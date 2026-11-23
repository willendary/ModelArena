from fastapi.testclient import TestClient
from app.main import app


def test_health_endpoint_returns_configuration_status():
    client = TestClient(app)
    res = client.get("/api/health")
    assert res.status_code == 200
    payload = res.json()
    assert payload["status"] == "ok"
    assert payload["provider"] == "nvidia"
    assert "nvidia_configured" in payload
    assert "max_concurrency" in payload
    assert payload["max_concurrency"] >= 1
