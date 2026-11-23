import asyncio
import json
import time

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session

from .benchmarks import evaluate_answer, get_tasks, list_categories
from .config import settings
from .db import ensure_schema, get_db
from .models import Run
from .provider import NVIDIAProvider, ProviderError
from .schemas import BenchmarkRequest, ProviderTestRequest

ensure_schema()
app = FastAPI(title="ModelArena API", version="0.3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
provider = NVIDIAProvider()
semaphore = asyncio.Semaphore(max(1, settings.max_concurrency))


def _serialize_run(row: Run, include_full: bool = False) -> dict:
    evaluation = None
    if row.evaluation_json:
        try:
            evaluation = json.loads(row.evaluation_json)
        except Exception:
            evaluation = None
    item = {
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
        "created_at": str(row.created_at),
    }
    if include_full:
        item["prompt"] = row.prompt
        item["response"] = row.response
        item["reasoning"] = row.reasoning
        item["evaluation"] = evaluation
    return item


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": app.version,
        "provider": "nvidia",
        "nvidia_configured": settings.nvidia_configured,
        "nvidia_base_url": settings.nvidia_base_url,
        "max_concurrency": max(1, settings.max_concurrency),
    }


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
async def run_benchmark(request: BenchmarkRequest, db: Session = Depends(get_db)):
    tasks = get_tasks(request.categories)
    if not tasks:
        raise HTTPException(status_code=400, detail="Nenhuma categoria válida selecionada.")
    created = []
    for model in request.models:
        for category, task in tasks:
            for _ in range(request.repeats):
                started = time.perf_counter()
                try:
                    async with semaphore:
                        result = await provider.chat(model, task["prompt"])
                    latency = result.get("latency_ms") or round((time.perf_counter() - started) * 1000, 1)
                    evaluation = evaluate_answer(category, task["id"], result["text"])
                    row = Run(
                        model_id=model,
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
                except Exception as exc:
                    row = Run(
                        model_id=model,
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
                db.add(row)
                db.commit()
                db.refresh(row)
                created.append(_serialize_run(row))
    return {"created": len(created), "results": created}


@app.get("/api/runs/{run_id}")
def get_run_detail(run_id: int, db: Session = Depends(get_db)):
    row = db.query(Run).filter(Run.id == run_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Execução não encontrada.")
    return _serialize_run(row, include_full=True)


@app.get("/api/ranking")
def ranking(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Run.model_id,
            func.avg(Run.score).label("score"),
            func.avg(Run.latency_ms).label("latency"),
            func.avg(Run.tokens_per_second).label("tps"),
            func.count(Run.id).label("runs"),
            func.sum(case((Run.status == "success", 1), else_=0)).label("successes"),
        )
        .group_by(Run.model_id)
        .order_by(desc("score"))
        .all()
    )
    return {
        "data": [
            {
                "model_id": r.model_id,
                "score": round(float(r.score or 0), 1),
                "avg_latency_ms": round(float(r.latency or 0), 1),
                "avg_tokens_per_second": round(float(r.tps), 1) if r.tps else None,
                "runs": r.runs,
                "successes": int(r.successes or 0),
            }
            for r in rows
        ]
    }


@app.get("/api/history")
def history(limit: int = 100, model_id: str | None = None, category: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Run)
    if model_id:
        query = query.filter(Run.model_id == model_id)
    if category:
        query = query.filter(Run.category == category)
    rows = query.order_by(desc(Run.id)).limit(min(max(limit, 1), 500)).all()
    return {"data": [_serialize_run(r) for r in rows]}
