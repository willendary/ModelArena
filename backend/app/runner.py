from __future__ import annotations

import asyncio
import json
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from sqlalchemy import desc
from sqlalchemy.orm import Session

from .benchmarks import evaluate_answer, get_tasks
from .config import settings
from .models import BenchmarkJob, Run, ScheduleConfig
from .provider import NVIDIAProvider

DEFAULT_CATEGORIES = ["reasoning", "coding", "debugging", "delphi", "csharp", "firebird"]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def serialize_run(row: Run, include_full: bool = False) -> dict[str, Any]:
    evaluation = None
    if row.evaluation_json:
        try:
            evaluation = json.loads(row.evaluation_json)
        except Exception:
            evaluation = None
    item: dict[str, Any] = {
        "id": row.id,
        "job_id": row.job_id,
        "model_id": row.model_id,
        "category": row.category,
        "task_id": row.task_id,
        "score": row.score,
        "latency_ms": row.latency_ms,
        "input_tokens": row.input_tokens,
        "output_tokens": row.output_tokens,
        "tokens_per_second": row.tokens_per_second,
        "execution_passed": row.execution_passed,
        "tests_passed": row.tests_passed,
        "tests_total": row.tests_total,
        "summary": evaluation.get("summary") if isinstance(evaluation, dict) else None,
        "evaluator_type": evaluation.get("evaluator_type") if isinstance(evaluation, dict) else None,
        "status": row.status,
        "error": row.error,
        "created_at": _iso(row.created_at),
    }
    if include_full:
        item["prompt"] = row.prompt
        item["response"] = row.response
        item["reasoning"] = row.reasoning
        item["evaluation"] = evaluation
    return item


def serialize_job(job: BenchmarkJob) -> dict[str, Any]:
    try:
        models = json.loads(job.models_json)
    except Exception:
        models = []
    try:
        categories = json.loads(job.categories_json)
    except Exception:
        categories = []
    progress = round((job.completed_steps / job.total_steps) * 100.0, 1) if job.total_steps else 0.0
    return {
        "id": job.id,
        "trigger": job.trigger,
        "status": job.status,
        "models": models,
        "categories": categories,
        "repeats": job.repeats,
        "total_steps": job.total_steps,
        "completed_steps": job.completed_steps,
        "succeeded_steps": job.succeeded_steps,
        "failed_steps": job.failed_steps,
        "progress_percent": progress,
        "current_model": job.current_model,
        "current_category": job.current_category,
        "current_task_id": job.current_task_id,
        "error": job.error,
        "created_at": _iso(job.created_at),
        "started_at": _iso(job.started_at),
        "finished_at": _iso(job.finished_at),
    }


def get_or_create_schedule(db: Session) -> ScheduleConfig:
    cfg = db.query(ScheduleConfig).filter(ScheduleConfig.id == 1).first()
    if cfg is None:
        cfg = ScheduleConfig(
            id=1,
            enabled=False,
            interval_minutes=360,
            model_selection_mode="manual",
            max_auto_models=6,
            models_json="[]",
            categories_json=json.dumps(DEFAULT_CATEGORIES),
            repeats=1,
        )
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


def serialize_schedule(cfg: ScheduleConfig) -> dict[str, Any]:
    try:
        models = json.loads(cfg.models_json)
    except Exception:
        models = []
    try:
        categories = json.loads(cfg.categories_json)
    except Exception:
        categories = list(DEFAULT_CATEGORIES)
    return {
        "enabled": bool(cfg.enabled),
        "interval_minutes": cfg.interval_minutes,
        "model_selection_mode": cfg.model_selection_mode,
        "max_auto_models": cfg.max_auto_models,
        "models": models,
        "categories": categories,
        "repeats": cfg.repeats,
        "last_run_at": _iso(cfg.last_run_at),
        "next_run_at": _iso(cfg.next_run_at),
        "last_job_id": cfg.last_job_id,
        "last_status": cfg.last_status,
        "updated_at": _iso(cfg.updated_at),
    }


class BenchmarkEngine:
    def __init__(
        self,
        provider_getter: Callable[[], NVIDIAProvider],
        session_factory: Callable[[], Session],
        max_concurrency: int | None = None,
    ):
        self._provider_getter = provider_getter
        self._session_factory = session_factory
        self._max_concurrency = max(1, max_concurrency or settings.max_concurrency)
        self._semaphore = asyncio.Semaphore(self._max_concurrency)
        self._tasks: dict[str, asyncio.Task[Any]] = {}
        self._cancel_flags: dict[str, asyncio.Event] = {}
        self._scheduler_task: asyncio.Task[Any] | None = None

    def create_job(
        self,
        models: list[str],
        categories: list[str],
        repeats: int,
        *,
        trigger: str = "manual",
    ) -> tuple[BenchmarkJob, list[tuple[str, dict[str, str]]]]:
        tasks = get_tasks(categories)
        if not tasks:
            raise ValueError("Nenhuma categoria válida selecionada.")
        clean_models = list(dict.fromkeys(m.strip() for m in models if m and m.strip()))
        if not clean_models:
            raise ValueError("Nenhum modelo válido selecionado.")

        job_id = uuid.uuid4().hex[:16]
        total_steps = len(clean_models) * len(tasks) * repeats
        db = self._session_factory()
        try:
            job = BenchmarkJob(
                id=job_id,
                trigger=trigger,
                status="queued",
                models_json=json.dumps(clean_models),
                categories_json=json.dumps(categories),
                repeats=repeats,
                total_steps=total_steps,
                completed_steps=0,
                succeeded_steps=0,
                failed_steps=0,
            )
            db.add(job)
            db.commit()
            db.refresh(job)
            return job, tasks
        finally:
            db.close()

    async def execute_job(self, job_id: str) -> list[dict[str, Any]]:
        cancel_event = self._cancel_flags.setdefault(job_id, asyncio.Event())
        db = self._session_factory()
        try:
            job = db.query(BenchmarkJob).filter(BenchmarkJob.id == job_id).first()
            if not job:
                return []
            models = json.loads(job.models_json)
            categories = json.loads(job.categories_json)
            repeats = job.repeats
            tasks = get_tasks(categories)
            job.status = "running"
            job.started_at = _utcnow()
            db.commit()
        finally:
            db.close()

        created_runs: list[dict[str, Any]] = []
        provider = self._provider_getter()

        async def _run_step(model_id: str, category: str, task: dict[str, str]) -> dict[str, Any] | None:
            if cancel_event.is_set():
                return None

            db_step = self._session_factory()
            try:
                job_row = db_step.query(BenchmarkJob).filter(BenchmarkJob.id == job_id).first()
                if job_row:
                    job_row.current_model = model_id
                    job_row.current_category = category
                    job_row.current_task_id = task["id"]
                    db_step.commit()
            finally:
                db_step.close()

            started = time.perf_counter()
            try:
                async with self._semaphore:
                    if cancel_event.is_set():
                        return None
                    result = await provider.chat(model_id, task["prompt"])
                latency = result.get("latency_ms") or round((time.perf_counter() - started) * 1000, 1)
                evaluation = evaluate_answer(category, task["id"], result["text"])
                row = Run(
                    job_id=job_id,
                    model_id=model_id,
                    category=category,
                    task_id=task["id"],
                    prompt=task["prompt"],
                    response=result["text"],
                    reasoning=result.get("reasoning_text"),
                    latency_ms=latency,
                    input_tokens=result.get("input_tokens"),
                    output_tokens=result.get("output_tokens"),
                    tokens_per_second=result.get("tokens_per_second"),
                    score=evaluation["score"],
                    execution_passed=evaluation["execution_passed"],
                    tests_passed=evaluation["tests_passed"],
                    tests_total=evaluation["tests_total"],
                    evaluation_json=json.dumps(evaluation, ensure_ascii=False),
                    status="success",
                )
                succeeded = True
            except Exception as exc:
                row = Run(
                    job_id=job_id,
                    model_id=model_id,
                    category=category,
                    task_id=task["id"],
                    prompt=task["prompt"],
                    latency_ms=round((time.perf_counter() - started) * 1000, 1),
                    score=0,
                    execution_passed=False,
                    tests_passed=0,
                    tests_total=0,
                    status="error",
                    error=str(exc),
                )
                succeeded = False

            db_save = self._session_factory()
            try:
                db_save.add(row)
                job_row = db_save.query(BenchmarkJob).filter(BenchmarkJob.id == job_id).first()
                if job_row:
                    job_row.completed_steps += 1
                    if succeeded:
                        job_row.succeeded_steps += 1
                    else:
                        job_row.failed_steps += 1
                db_save.commit()
                db_save.refresh(row)
                return serialize_run(row)
            finally:
                db_save.close()

        try:
            for model_id in models:
                for category, task in tasks:
                    for _ in range(repeats):
                        if cancel_event.is_set():
                            break
                        serialized = await _run_step(model_id, category, task)
                        if serialized is not None:
                            created_runs.append(serialized)
                    if cancel_event.is_set():
                        break
                if cancel_event.is_set():
                    break

            final_status = "cancelled" if cancel_event.is_set() else "completed"
            db_done = self._session_factory()
            try:
                job_row = db_done.query(BenchmarkJob).filter(BenchmarkJob.id == job_id).first()
                if job_row:
                    job_row.status = final_status
                    job_row.current_model = None
                    job_row.current_category = None
                    job_row.current_task_id = None
                    job_row.finished_at = _utcnow()
                    if job_row.trigger == "scheduled":
                        sched = get_or_create_schedule(db_done)
                        sched.last_status = final_status
                    db_done.commit()
            finally:
                db_done.close()
        except Exception as exc:
            db_err = self._session_factory()
            try:
                job_row = db_err.query(BenchmarkJob).filter(BenchmarkJob.id == job_id).first()
                if job_row:
                    job_row.status = "failed"
                    job_row.error = str(exc)
                    job_row.finished_at = _utcnow()
                    if job_row.trigger == "scheduled":
                        sched = get_or_create_schedule(db_err)
                        sched.last_status = f"failed: {str(exc)[:40]}"
                    db_err.commit()
            finally:
                db_err.close()
        finally:
            self._tasks.pop(job_id, None)
            self._cancel_flags.pop(job_id, None)

        return created_runs

    def start_background_job(
        self,
        models: list[str],
        categories: list[str],
        repeats: int,
        *,
        trigger: str = "manual",
    ) -> dict[str, Any]:
        job, _ = self.create_job(models, categories, repeats, trigger=trigger)
        self._cancel_flags[job.id] = asyncio.Event()
        task = asyncio.create_task(self.execute_job(job.id))
        self._tasks[job.id] = task
        return serialize_job(job)

    def cancel_job(self, job_id: str) -> bool:
        ev = self._cancel_flags.get(job_id)
        if ev:
            ev.set()
            return True
        db = self._session_factory()
        try:
            job = db.query(BenchmarkJob).filter(BenchmarkJob.id == job_id).first()
            if job and job.status in ("queued", "running"):
                job.status = "cancelled"
                job.finished_at = _utcnow()
                db.commit()
                return True
            return False
        finally:
            db.close()

    def has_active_job(self, trigger: str | None = None) -> bool:
        db = self._session_factory()
        try:
            q = db.query(BenchmarkJob).filter(BenchmarkJob.status.in_(["queued", "running"]))
            if trigger:
                q = q.filter(BenchmarkJob.trigger == trigger)
            return q.first() is not None
        finally:
            db.close()

    async def trigger_schedule_if_due(self, *, force: bool = False) -> dict[str, Any]:
        db = self._session_factory()
        try:
            cfg = get_or_create_schedule(db)
            now = _utcnow()
            if not force:
                if not cfg.enabled:
                    return {"triggered": False, "reason": "disabled"}
                next_at = cfg.next_run_at
                if next_at is not None:
                    if next_at.tzinfo is None:
                        next_at = next_at.replace(tzinfo=timezone.utc)
                    if now < next_at:
                        return {"triggered": False, "reason": "not_due", "next_run_at": _iso(next_at)}

            if self.has_active_job():
                return {"triggered": False, "reason": "job_already_running"}

            models: list[str] = json.loads(cfg.models_json or "[]")
            categories: list[str] = json.loads(cfg.categories_json or "[]") or list(DEFAULT_CATEGORIES)
            repeats = cfg.repeats or 1
            mode = cfg.model_selection_mode
            max_auto = cfg.max_auto_models or 6
        finally:
            db.close()

        if mode == "auto_coding" or not models:
            try:
                discovered = await self._provider_getter().list_models(coding_only=True)
                models = [m["id"] for m in discovered[:max_auto]]
            except Exception as exc:
                db_fail = self._session_factory()
                try:
                    sched = get_or_create_schedule(db_fail)
                    sched.last_status = f"error: {str(exc)[:48]}"
                    sched.next_run_at = _utcnow() + timedelta(minutes=max(5, sched.interval_minutes))
                    db_fail.commit()
                finally:
                    db_fail.close()
                return {"triggered": False, "reason": "provider_error", "detail": str(exc)}

        if not models:
            return {"triggered": False, "reason": "no_models_configured"}

        job_info = self.start_background_job(models, categories, repeats, trigger="scheduled")
        now = _utcnow()
        db_upd = self._session_factory()
        try:
            sched = get_or_create_schedule(db_upd)
            sched.last_run_at = now
            sched.next_run_at = now + timedelta(minutes=max(5, sched.interval_minutes))
            sched.last_job_id = job_info["id"]
            sched.last_status = "running"
            db_upd.commit()
        finally:
            db_upd.close()

        return {"triggered": True, "job": job_info}

    async def _scheduler_loop(self) -> None:
        poll_s = max(5, settings.scheduler_poll_seconds)
        while True:
            try:
                await self.trigger_schedule_if_due(force=False)
            except asyncio.CancelledError:
                raise
            except Exception:
                pass
            await asyncio.sleep(poll_s)

    def start_scheduler(self) -> None:
        if settings.scheduler_enabled and (self._scheduler_task is None or self._scheduler_task.done()):
            self._scheduler_task = asyncio.create_task(self._scheduler_loop())

    async def stop_scheduler(self) -> None:
        if self._scheduler_task and not self._scheduler_task.done():
            self._scheduler_task.cancel()
            try:
                await self._scheduler_task
            except asyncio.CancelledError:
                pass
        self._scheduler_task = None
        for task in list(self._tasks.values()):
            if not task.done():
                task.cancel()
