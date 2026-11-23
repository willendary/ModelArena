from fastapi.testclient import TestClient
from app.main import app


def test_health_endpoint_returns_configuration_status():
    client = TestClient(app)
    res = client.get("/api/health")
    assert res.status_code == 200
    payload = res.json()
    assert payload["status"] == "ok"
    assert payload["active_provider_mode"] in ("opencode", "nvidia_api", "unconfigured")
    assert "provider_ready" in payload
    assert "opencode_available" in payload
    assert "nvidia_configured" in payload
    assert "max_concurrency" in payload
    assert payload["max_concurrency"] >= 1
