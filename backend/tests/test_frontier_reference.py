from fastapi.testclient import TestClient

from app.frontier_reference import (
    FRONTIER_LEADER_SCORE,
    get_nvidia_reference_profile,
)
from app.main import app


def test_nvidia_reference_profile_resolves_known_and_prefixed_models():
    glm = get_nvidia_reference_profile("console-nvidia/z-ai/glm-5.3-flash")
    assert glm["swe_bench_verified"] == 92.0
    assert glm["project_risk"] == "baixo"

    ultra = get_nvidia_reference_profile("nvidia/nemotron-3-ultra-550b-a55b")
    assert ultra["swe_bench_verified"] == 69.0
    assert ultra["project_risk"] == "medio"

    unknown = get_nvidia_reference_profile("custom/unknown-model")
    assert unknown["project_risk"] == "desconhecido"
    assert unknown["swe_bench_verified"] is None


def test_frontier_comparison_endpoint_exposes_baselines_and_gaps():
    client = TestClient(app)
    res = client.get("/api/frontier-comparison")
    assert res.status_code == 200
    payload = res.json()

    assert payload["frontier_leader"]["score"] == FRONTIER_LEADER_SCORE
    families = {b["family"] for b in payload["frontier_baselines"]}
    assert "Claude (Anthropic)" in families
    assert "ChatGPT (OpenAI)" in families
    assert "DeepSeek" in families
    assert "Gemini (Google)" in families

    by_id = {m["model_id"]: m for m in payload["nvidia_models"]}
    assert by_id["z-ai/glm-5.3-flash"]["gap_vs_frontier_pp"] == -5.0
    assert by_id["nvidia/nemotron-3-ultra-550b-a55b"]["gap_vs_frontier_pp"] == -28.0
    assert by_id["nvidia/nemotron-3.5-lightning-30b-a3b"]["project_risk"] == "alto"
    assert "SWE-bench Verified" in payload["methodology_note"]
