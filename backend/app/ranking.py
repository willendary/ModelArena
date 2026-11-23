from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import desc
from sqlalchemy.orm import Session

from .benchmarks import CATEGORY_META, compute_composite_score
from .models import Run


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def build_ranking(
    db: Session,
    *,
    category: str | None = None,
    days: int | None = None,
) -> dict[str, Any]:
    query = db.query(Run)
    if category:
        query = query.filter(Run.category == category)
    if days and days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        query = query.filter(Run.created_at >= cutoff)

    rows = query.order_by(desc(Run.id)).all()
    if not rows:
        return {"data": [], "updated_at": None, "total_runs": 0}

    grouped: dict[str, list[Run]] = defaultdict(list)
    for row in rows:
        grouped[row.model_id].append(row)

    ranking_rows: list[dict[str, Any]] = []
    latest_overall = rows[0].created_at

    for model_id, model_runs in grouped.items():
        total_runs = len(model_runs)
        successes = sum(1 for r in model_runs if r.status == "success")
        success_rate = successes / total_runs if total_runs else 0.0

        quality_score = round(sum(float(r.score or 0.0) for r in model_runs) / total_runs, 1)

        latencies = [float(r.latency_ms) for r in model_runs if r.latency_ms is not None]
        avg_latency = round(sum(latencies) / len(latencies), 1) if latencies else 0.0

        tps_vals = [float(r.tokens_per_second) for r in model_runs if r.tokens_per_second is not None]
        avg_tps = round(sum(tps_vals) / len(tps_vals), 1) if tps_vals else None

        exec_evaluated = [r for r in model_runs if r.execution_passed is not None]
        exec_pass_rate = (
            round((sum(1 for r in exec_evaluated if r.execution_passed) / len(exec_evaluated)) * 100.0, 1)
            if exec_evaluated
            else None
        )

        by_cat: dict[str, list[float]] = defaultdict(list)
        for r in model_runs:
            by_cat[r.category].append(float(r.score or 0.0))
        category_scores = {
            cat: round(sum(vals) / len(vals), 1) for cat, vals in sorted(by_cat.items())
        }

        # Score trend: compare newest job batch (or newest half) against earlier runs
        score_delta: float | None = None
        job_ids_ordered: list[str] = []
        for r in model_runs:
            if r.job_id and r.job_id not in job_ids_ordered:
                job_ids_ordered.append(r.job_id)
        if len(job_ids_ordered) >= 2:
            latest_jid, prev_jid = job_ids_ordered[0], job_ids_ordered[1]
            latest_scores = [float(r.score or 0.0) for r in model_runs if r.job_id == latest_jid]
            prev_scores = [float(r.score or 0.0) for r in model_runs if r.job_id == prev_jid]
            if latest_scores and prev_scores:
                score_delta = round(
                    (sum(latest_scores) / len(latest_scores)) - (sum(prev_scores) / len(prev_scores)),
                    1,
                )

        composite = compute_composite_score(quality_score, success_rate, avg_latency)
        ranking_rows.append(
            {
                "model_id": model_id,
                "score": composite,
                "composite_score": composite,
                "quality_score": quality_score,
                "success_rate": round(success_rate * 100.0, 1),
                "execution_pass_rate": exec_pass_rate,
                "avg_latency_ms": avg_latency,
                "avg_tokens_per_second": avg_tps,
                "runs": total_runs,
                "successes": successes,
                "categories_covered": len(category_scores),
                "category_scores": category_scores,
                "score_delta": score_delta,
                "last_run_at": _iso(model_runs[0].created_at),
            }
        )

    ranking_rows.sort(
        key=lambda x: (
            -x["composite_score"],
            -x["quality_score"],
            -x["categories_covered"],
            x["avg_latency_ms"] if x["avg_latency_ms"] > 0 else 999999.0,
        )
    )
    for idx, item in enumerate(ranking_rows, start=1):
        item["rank"] = idx

    return {
        "data": ranking_rows,
        "updated_at": _iso(latest_overall),
        "total_runs": len(rows),
    }


def build_recommendation(db: Session) -> dict[str, Any]:
    ranking = build_ranking(db)
    rows = ranking["data"]
    if not rows:
        return {
            "has_data": False,
            "updated_at": None,
            "primary_coding_model": None,
            "fastest_reliable_model": None,
            "best_by_category": {},
            "summary": "Execute um benchmark com seus modelos NVIDIA para descobrir qual deve ser seu modelo principal de programação.",
        }

    # Prefer models evaluated across at least 2 categories if any exist
    broad_candidates = [r for r in rows if r["categories_covered"] >= 2 and r["successes"] > 0]
    pool = broad_candidates or [r for r in rows if r["successes"] > 0] or rows
    winner = pool[0]

    reliable_fast_pool = [
        r for r in rows if r["quality_score"] >= 75.0 and r["success_rate"] >= 80.0 and r["avg_latency_ms"] > 0
    ]
    fastest = min(reliable_fast_pool, key=lambda r: r["avg_latency_ms"]) if reliable_fast_pool else None

    best_by_category: dict[str, dict[str, Any]] = {}
    for cat_id, meta in CATEGORY_META.items():
        cat_candidates = [r for r in rows if cat_id in r["category_scores"]]
        if not cat_candidates:
            continue
        best_cat = max(
            cat_candidates,
            key=lambda r: (r["category_scores"][cat_id], -r["avg_latency_ms"]),
        )
        best_by_category[cat_id] = {
            "category_id": cat_id,
            "category_label": meta["label"],
            "model_id": best_cat["model_id"],
            "score": best_cat["category_scores"][cat_id],
            "avg_latency_ms": best_cat["avg_latency_ms"],
        }

    pass_phrase = (
        f", aprovação real em testes de {winner['execution_pass_rate']}%"
        if winner["execution_pass_rate"] is not None
        else ""
    )
    rationale = (
        f"Melhor pontuação composta ({winner['composite_score']}/100): "
        f"qualidade real {winner['quality_score']}/100{pass_phrase}, "
        f"confiabilidade {winner['success_rate']}% e latência média de {winner['avg_latency_ms']} ms "
        f"em {winner['categories_covered']} categoria(s)."
    )

    return {
        "has_data": True,
        "updated_at": ranking["updated_at"],
        "total_models": len(rows),
        "total_runs": ranking["total_runs"],
        "primary_coding_model": {
            **winner,
            "openchamber_model_ref": f"console-nvidia/{winner['model_id']}",
            "rationale": rationale,
        },
        "fastest_reliable_model": (
            {
                **fastest,
                "openchamber_model_ref": f"console-nvidia/{fastest['model_id']}",
            }
            if fastest
            else None
        ),
        "best_by_category": best_by_category,
        "summary": f"Modelo principal recomendado: {winner['model_id']} ({winner['composite_score']}/100).",
    }


def export_ranking_markdown(ranking: dict[str, Any], recommendation: dict[str, Any]) -> str:
    lines = [
        "# ModelArena — Ranking NVIDIA NIM",
        "",
        f"Atualizado em: `{ranking.get('updated_at') or 'sem execuções'}` · Total de execuções: **{ranking.get('total_runs', 0)}**",
        "",
    ]
    winner = recommendation.get("primary_coding_model")
    if winner:
        lines.extend(
            [
                "## Modelo Principal Recomendado para Programação",
                f"- **Modelo:** `{winner['model_id']}` (OpenChamber: `console-nvidia/{winner['model_id']}`)",
                f"- **Pontuação composta:** **{winner['composite_score']}/100** (Qualidade: {winner['quality_score']}/100 · Sucesso: {winner['success_rate']}% · Latência média: {winner['avg_latency_ms']} ms)",
                f"- **Motivo:** {winner['rationale']}",
                "",
            ]
        )

    rows = ranking.get("data") or []
    if not rows:
        lines.append("_Nenhum benchmark registrado ainda._")
        return "\n".join(lines)

    lines.extend(
        [
            "## Ranking Geral",
            "",
            "| # | Modelo | Composta | Qualidade | Testes Reais | Sucesso | Latência | Tok/s | Categorias |",
            "|---:|---|---:|---:|---:|---:|---:|---:|---:|",
        ]
    )
    for r in rows:
        exec_str = f"{r['execution_pass_rate']}%" if r["execution_pass_rate"] is not None else "—"
        tps_str = f"{r['avg_tokens_per_second']}" if r["avg_tokens_per_second"] is not None else "—"
        lines.append(
            f"| {r['rank']} | `{r['model_id']}` | **{r['composite_score']}** | {r['quality_score']} | "
            f"{exec_str} | {r['success_rate']}% | {r['avg_latency_ms']} ms | {tps_str} | {r['categories_covered']} |"
        )

    best_by_cat = recommendation.get("best_by_category") or {}
    if best_by_cat:
        lines.extend(["", "## Melhor por Categoria", ""])
        for info in best_by_cat.values():
            lines.append(
                f"- **{info['category_label']}:** `{info['model_id']}` ({info['score']}/100 · {info['avg_latency_ms']} ms)"
            )

    return "\n".join(lines) + "\n"
