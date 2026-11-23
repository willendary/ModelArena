import time
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import main as app_main
from app.db import Base, ensure_schema, get_db
from app.models import ScheduleConfig
from app.runner import BenchmarkEngine


class FakeNVIDIAProvider:
    async def list_models(self, *, coding_only: bool = False, search: str | None = None):
        return [
            {
                "id": "z-ai/glm-5.3-flash",
                "vendor": "z-ai",
                "owned_by": "z-ai",
                "modality": "chat",
                "is_coding_candidate": True,
                "tags": ["general-code", "reasoning", "fast"],
            },
            {
                "id": "nvidia/nemotron-3.5-super",
                "vendor": "nvidia",
                "owned_by": "nvidia",
                "modality": "chat",
                "is_coding_candidate": True,
                "tags": ["general-code", "reasoning"],
            },
        ]

    async def chat(self, model: str, prompt: str, **_kwargs):
        if "normalize_email" in prompt:
            if model == "z-ai/glm-5.3-flash":
                text = "```python\ndef normalize_email(value):\n    if not isinstance(value, str):\n        return ''\n    return value.strip().lower()\n```"
                latency = 850.0
            else:
                text = "```python\ndef normalize_email(value):\n    return value.strip().lower()\n```"
                latency = 2400.0
        elif "merge_intervals" in prompt:
            text = (
                "```python\ndef merge_intervals(intervals):\n    if not intervals:\n        return []\n"
                "    ordered = sorted((a, b) for a, b in intervals)\n    out = [ordered[0]]\n"
                "    for s, e in ordered[1:]:\n        ps, pe = out[-1]\n        if s <= pe:\n            out[-1] = (ps, max(pe, e))\n"
                "        else:\n            out.append((s, e))\n    return out\n```"
            )
            latency = 950.0 if "glm" in model else 1800.0
        elif "clientes(id, nome)" in prompt:
            if "glm" in model:
                text = "```sql\nSELECT c.id, c.nome, COUNT(p.id) AS total_pedidos FROM clientes c LEFT JOIN pedidos p ON p.cliente_id = c.id GROUP BY c.id, c.nome;\n```"
            else:
                text = "```sql\nSELECT c.id, c.nome, COUNT(*) AS total_pedidos FROM clientes c LEFT JOIN pedidos p ON p.cliente_id = c.id GROUP BY c.id, c.nome;\n```"
            latency = 700.0
        elif "NOT EXISTS" in prompt:
            text = "SELECT c.ID FROM CLIENTES c WHERE NOT EXISTS (SELECT 1 FROM PEDIDOS p WHERE p.ID_CLIENTE = c.ID);"
            latency = 650.0
        elif "FIRST 5" in prompt:
            text = (
                "SELECT FIRST 5 c.ID, c.NOME, COALESCE(SUM(p.VALOR), 0) AS TOTAL_PAGO "
                "FROM CLIENTES c LEFT JOIN PEDIDOS p ON p.ID_CLIENTE = c.ID AND p.STATUS = 'PAGO' "
                "GROUP BY c.ID, c.NOME ORDER BY TOTAL_PAGO DESC;"
            )
            latency = 720.0
        else:
            text = "ORDEM: A, B, C. A vem antes de C e B não é a primeira."
            latency = 600.0

        return {
            "text": text,
            "raw_text": text,
            "reasoning_text": "Análise interna do modelo.",
            "thinking_stripped": True,
            "input_tokens": 90,
            "output_tokens": 60,
            "latency_ms": latency,
            "tokens_per_second": round(60 / (latency / 1000.0), 1),
            "finish_reason": "stop",
        }

    async def test_connection(self, model: str | None = None):
        return {"ok": True, "models_total": 2, "coding_models_total": 2, "latency_ms": 12.0}


@pytest.fixture()
def isolated_client(tmp_path, monkeypatch):
    db_file = tmp_path / "test_arena.db"
    test_engine = create_engine(f"sqlite:///{db_file.as_posix()}", connect_args={"check_same_thread": False})
    TestSession = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)
    ensure_schema(test_engine)

    fake_provider = FakeNVIDIAProvider()
    test_runner = BenchmarkEngine(
        provider_getter=lambda: fake_provider,
        session_factory=TestSession,
        max_concurrency=1,
    )

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    monkeypatch.setattr(app_main, "provider", fake_provider)
    monkeypatch.setattr(app_main, "engine_runner", test_runner)
    monkeypatch.setattr(app_main.settings, "scheduler_enabled", False)
    app_main.app.dependency_overrides[get_db] = override_get_db

    with TestClient(app_main.app) as client:
        yield client, TestSession

    app_main.app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


def test_background_job_ranking_recommendation_and_export(isolated_client):
    client, _ = isolated_client

    res = client.post(
        "/api/benchmarks/jobs",
        json={
            "models": ["z-ai/glm-5.3-flash", "nvidia/nemotron-3.5-super"],
            "categories": ["coding", "firebird"],
            "repeats": 1,
        },
    )
    assert res.status_code == 200
    job_id = res.json()["job"]["id"]

    # Wait for background job completion
    final_job = None
    for _ in range(60):
        poll = client.get(f"/api/benchmarks/jobs/{job_id}")
        assert poll.status_code == 200
        final_job = poll.json()
        if final_job["job"]["status"] in ("completed", "failed", "cancelled"):
            break
        time.sleep(0.05)

    assert final_job is not None
    assert final_job["job"]["status"] == "completed"
    assert final_job["job"]["completed_steps"] == 10
    assert final_job["job"]["succeeded_steps"] == 10

    # Inspect a single run detail with full rubric criteria
    run_id = final_job["runs"][0]["id"]
    detail = client.get(f"/api/runs/{run_id}").json()
    assert detail["evaluation"]["criteria"]
    assert detail["reasoning"] == "Análise interna do modelo."

    # Ranking must place z-ai/glm-5.3-flash above nvidia/nemotron-3.5-super
    rk = client.get("/api/ranking").json()
    assert len(rk["data"]) == 2
    assert rk["data"][0]["model_id"] == "z-ai/glm-5.3-flash"
    assert rk["data"][0]["composite_score"] > rk["data"][1]["composite_score"]
    assert "coding" in rk["data"][0]["category_scores"]
    assert "firebird" in rk["data"][0]["category_scores"]

    # Recommendation must highlight #1 coding model + OpenChamber ref
    rec = client.get("/api/recommendation").json()
    assert rec["has_data"] is True
    assert rec["primary_coding_model"]["model_id"] == "z-ai/glm-5.3-flash"
    assert rec["primary_coding_model"]["openchamber_model_ref"] == "console-nvidia/z-ai/glm-5.3-flash"
    assert "coding" in rec["best_by_category"]

    # Export Markdown report
    md_res = client.get("/api/ranking/export?format=markdown")
    assert md_res.status_code == 200
    assert "z-ai/glm-5.3-flash" in md_res.text
    assert "Modelo Principal Recomendado" in md_res.text


def test_schedule_configuration_and_auto_trigger(isolated_client):
    client, TestSession = isolated_client

    upd = client.put(
        "/api/schedule",
        json={
            "enabled": True,
            "interval_minutes": 60,
            "model_selection_mode": "auto_coding",
            "max_auto_models": 2,
            "models": [],
            "categories": ["firebird"],
            "repeats": 1,
        },
    )
    assert upd.status_code == 200
    sched = upd.json()
    assert sched["enabled"] is True
    assert sched["next_run_at"] is not None

    # Force schedule due in the past and tick
    db = TestSession()
    cfg = db.query(ScheduleConfig).filter(ScheduleConfig.id == 1).first()
    cfg.next_run_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()
    db.close()

    tick = client.post("/api/schedule/tick")
    assert tick.status_code == 200
    payload = tick.json()
    assert payload["triggered"] is True
    job_id = payload["job"]["id"]

    for _ in range(50):
        poll = client.get(f"/api/benchmarks/jobs/{job_id}").json()
        if poll["job"]["status"] == "completed":
            break
        time.sleep(0.05)

    assert poll["job"]["status"] == "completed"
    assert poll["job"]["trigger"] == "scheduled"
    assert poll["job"]["completed_steps"] == 4
