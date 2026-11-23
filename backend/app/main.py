import asyncio
import time
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, case
from .config import settings
from .db import Base, engine, get_db
from .models import Run
from .schemas import BenchmarkRequest
from .provider import NVIDIAProvider
from .benchmarks import get_tasks, deterministic_score

Base.metadata.create_all(bind=engine)
app = FastAPI(title="ModelArena API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
provider = NVIDIAProvider()
semaphore = asyncio.Semaphore(max(1, settings.max_concurrency))

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

@app.get("/api/models")
async def models():
    try:
        items = await provider.list_models()
        return {"data": [{"id": m.get("id"), "object": m.get("object"), "owned_by": m.get("owned_by")} for m in items if m.get("id")]}
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
                    latency = (time.perf_counter() - started) * 1000
                    score = deterministic_score(category, task["id"], result["text"])
                    row = Run(model_id=model, category=category, task_id=task["id"], prompt=task["prompt"],
                              response=result["text"], latency_ms=latency, input_tokens=result["input_tokens"],
                              output_tokens=result["output_tokens"], score=score, status="success")
                except Exception as exc:
                    row = Run(model_id=model, category=category, task_id=task["id"], prompt=task["prompt"],
                              latency_ms=(time.perf_counter() - started) * 1000, score=0, status="error", error=str(exc))
                db.add(row)
                db.commit()
                db.refresh(row)
                created.append({"id": row.id, "model_id": row.model_id, "category": row.category, "task_id": row.task_id,
                                "score": row.score, "latency_ms": row.latency_ms, "status": row.status, "error": row.error})
    return {"created": len(created), "results": created}

@app.get("/api/ranking")
def ranking(db: Session = Depends(get_db)):
    rows = db.query(Run.model_id, func.avg(Run.score).label("score"), func.avg(Run.latency_ms).label("latency"),
                    func.count(Run.id).label("runs"), func.sum(case((Run.status == "success", 1), else_=0)).label("successes"))             .group_by(Run.model_id).order_by(desc("score")).all()
    return {"data": [{"model_id": r.model_id, "score": round(float(r.score or 0), 1),
                      "avg_latency_ms": round(float(r.latency or 0), 1), "runs": r.runs, "successes": int(r.successes or 0)} for r in rows]}

@app.get("/api/history")
def history(limit: int = 100, db: Session = Depends(get_db)):
    rows = db.query(Run).order_by(desc(Run.id)).limit(min(max(limit, 1), 500)).all()
    return {"data": [{"id": r.id, "model_id": r.model_id, "category": r.category, "task_id": r.task_id,
                      "score": r.score, "latency_ms": r.latency_ms, "status": r.status, "created_at": str(r.created_at)} for r in rows]}
