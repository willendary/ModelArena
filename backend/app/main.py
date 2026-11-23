from __future__ import annotations

import json
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import desc
from sqlalchemy.orm import Session

from .benchmarks import get_tasks, list_categories
from .config import settings
from .db import SessionLocal, ensure_schema, get_db
from .frontier_reference import build_frontier_comparison
from .models import BenchmarkJob, Run
from .provider import ProviderError
from .provider_router import ProviderRouter
from .ranking import build_ranking, build_recommendation, export_ranking_markdown
from .runner import (
    BenchmarkEngine,
    get_or_create_schedule,
    serialize_job,
    serialize_run,
    serialize_schedule,
)
from .schemas import BenchmarkRequest, ProviderModeRequest, ProviderTestRequest, ScheduleUpdateRequest

ensure_schema()

provider = ProviderRouter()
engine_runner = BenchmarkEngine(
    provider_getter=lambda: provider,
    session_factory=SessionLocal,
    max_concurrency=settings.max_concurrency,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_schema()
    engine_runner.start_scheduler()
    try:
        yield
    finally:
        await engine_runner.stop_scheduler()


app = FastAPI(title="ModelArena API", version="1.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health(db: Session = Depends(get_db)):
    sched = get_or_create_schedule(db)
    active_jobs = db.query(BenchmarkJob).filter(BenchmarkJob.status.in_(["queued", "running"])).count()
    pstatus = (
        provider.status()
        if hasattr(provider, "status")
        else {
            "configured_mode": "nvidia_api",
            "active_provider_mode": "nvidia_api",
            "active_provider_label": "NVIDIA NIM API",
            "provider_ready": True,
            "opencode_available": False,
            "opencode_cli_path": None,
            "opencode_provider_prefix": settings.opencode_provider_prefix,
            "nvidia_configured": settings.nvidia_configured,
        }
    )
    return {
        "status": "ok",
        "version": app.version,
        "provider": pstatus["active_provider_mode"],
        **pstatus,
        "nvidia_base_url": settings.nvidia_base_url,
        "max_concurrency": max(1, settings.max_concurrency),
        "scheduler_enabled": bool(sched.enabled),
        "active_jobs": active_jobs,
    }


@app.put("/api/provider/mode")
async def set_provider_mode(request: ProviderModeRequest):
    if not hasattr(provider, "set_mode"):
        raise HTTPException(status_code=400, detail="Troca de modo não suportada pelo provedor ativo.")
    try:
        return provider.set_mode(
            request.mode,
            provider_prefix=request.opencode_provider_prefix,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/categories")
def categories():
    return {"data": list_categories()}


@app.get("/api/models")
async def models(coding_only: bool = False, search: str | None = None):
    try:
        items = await provider.list_models(coding_only=coding_only, search=search)
        return {
            "data": items,
            "total": len(items),
            "coding_total": sum(1 for m in items if m.get("is_coding_candidate")),
        }
    except ProviderError as exc:
        raise HTTPException(status_code=exc.status_code or 502, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.post("/api/provider/test")
async def test_provider(request: ProviderTestRequest | None = None):
    try:
        model = request.model if request else None
        return await provider.test_connection(model=model)
    except ProviderError as exc:
        raise HTTPException(status_code=exc.status_code or 502, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.post("/api/benchmarks")
async def run_benchmark(request: BenchmarkRequest):
    try:
        job, _ = engine_runner.create_job(
            request.models, request.categories, request.repeats, trigger="manual"
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    results = await engine_runner.execute_job(job.id)
    return {"job_id": job.id, "created": len(results), "results": results}


@app.post("/api/benchmarks/jobs")
async def create_benchmark_job(request: BenchmarkRequest):
    try:
        job = engine_runner.start_background_job(
            request.models, request.categories, request.repeats, trigger="manual"
        )
        return {"job": job}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/benchmarks/jobs")
def list_benchmark_jobs(limit: int = 20, db: Session = Depends(get_db)):
    rows = (
        db.query(BenchmarkJob)
        .order_by(desc(BenchmarkJob.created_at))
        .limit(min(max(limit, 1), 100))
        .all()
    )
    return {"data": [serialize_job(j) for j in rows]}


@app.get("/api/benchmarks/jobs/{job_id}")
def get_benchmark_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(BenchmarkJob).filter(BenchmarkJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado.")
    runs = db.query(Run).filter(Run.job_id == job_id).order_by(desc(Run.id)).all()
    return {"job": serialize_job(job), "runs": [serialize_run(r) for r in runs]}


@app.post("/api/benchmarks/jobs/{job_id}/cancel")
def cancel_benchmark_job(job_id: str):
    if not engine_runner.cancel_job(job_id):
        raise HTTPException(status_code=404, detail="Job ativo não encontrado.")
    return {"cancelled": True, "job_id": job_id}


@app.get("/api/schedule")
def get_schedule(db: Session = Depends(get_db)):
    cfg = get_or_create_schedule(db)
    return serialize_schedule(cfg)


@app.put("/api/schedule")
def update_schedule(request: ScheduleUpdateRequest, db: Session = Depends(get_db)):
    valid_tasks = get_tasks(request.categories)
    if not valid_tasks:
        raise HTTPException(status_code=400, detail="Selecione pelo menos uma categoria válida.")
    if request.enabled and request.model_selection_mode == "manual" and not request.models:
        raise HTTPException(
            status_code=400,
            detail="No modo manual, selecione pelo menos um modelo ou alterne para descoberta automática.",
        )

    cfg = get_or_create_schedule(db)
    cfg.enabled = request.enabled
    cfg.interval_minutes = request.interval_minutes
    cfg.model_selection_mode = request.model_selection_mode
    cfg.max_auto_models = request.max_auto_models
    cfg.models_json = json.dumps(list(dict.fromkeys(m.strip() for m in request.models if m.strip())))
    cfg.categories_json = json.dumps(request.categories)
    cfg.repeats = request.repeats
    if cfg.enabled:
        cfg.next_run_at = datetime.now(timezone.utc) + timedelta(minutes=cfg.interval_minutes)
    else:
        cfg.next_run_at = None
    db.commit()
    db.refresh(cfg)
    return serialize_schedule(cfg)


@app.post("/api/schedule/run-now")
async def run_schedule_now():
    res = await engine_runner.trigger_schedule_if_due(force=True)
    if not res.get("triggered"):
        raise HTTPException(
            status_code=400,
            detail=res.get("detail") or f"Não foi possível iniciar o agendamento: {res.get('reason')}",
        )
    return res


@app.post("/api/schedule/tick")
async def tick_schedule():
    return await engine_runner.trigger_schedule_if_due(force=False)


@app.get("/api/runs/{run_id}")
def get_run_detail(run_id: int, db: Session = Depends(get_db)):
    row = db.query(Run).filter(Run.id == run_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Execução não encontrada.")
    return serialize_run(row, include_full=True)


@app.get("/api/ranking")
def ranking(
    category: str | None = None,
    days: int | None = Query(default=None, ge=1, le=365),
    db: Session = Depends(get_db),
):
    return build_ranking(db, category=category, days=days)


@app.get("/api/recommendation")
def recommendation(db: Session = Depends(get_db)):
    return build_recommendation(db)


@app.get("/api/frontier-comparison")
def frontier_comparison(db: Session = Depends(get_db)):
    return build_frontier_comparison(db)


@app.get("/api/ranking/export")
def export_ranking(
    format: str = Query(default="markdown", pattern="^(markdown|json)$"),
    db: Session = Depends(get_db),
):
    rk = build_ranking(db)
    rec = build_recommendation(db)
    if format == "json":
        return {"ranking": rk, "recommendation": rec}
    md = export_ranking_markdown(rk, rec)
    return PlainTextResponse(content=md, media_type="text/markdown; charset=utf-8")


@app.get("/api/history")
def history(
    limit: int = 100,
    model_id: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Run)
    if model_id:
        query = query.filter(Run.model_id == model_id)
    if category:
        query = query.filter(Run.category == category)
    rows = query.order_by(desc(Run.id)).limit(min(max(limit, 1), 500)).all()
    return {"data": [serialize_run(r) for r in rows]}


@app.delete("/api/history")
def clear_history(db: Session = Depends(get_db)):
    deleted_runs = db.query(Run).delete()
    deleted_jobs = db.query(BenchmarkJob).delete()
    db.commit()
    return {"deleted_runs": deleted_runs, "deleted_jobs": deleted_jobs}


# Optional static serving of built frontend dashboard when frontend/dist exists
_FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if (_FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(_FRONTEND_DIST / "assets")), name="frontend-assets")


@app.get("/", include_in_schema=False)
def serve_frontend_root():
    index_file = _FRONTEND_DIST / "index.html"
    if index_file.is_file():
        return FileResponse(str(index_file))
    return {
        "name": "ModelArena API",
        "version": app.version,
        "docs": "/docs",
        "message": "Build o frontend (`cd frontend && npm run build`) ou rode `npm run dev` para abrir o dashboard.",
    }
