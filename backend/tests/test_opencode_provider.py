import asyncio
import json

import pytest

from app.opencode_provider import OpenCodeCLIProvider, parse_opencode_ndjson
from app.provider import NVIDIAProvider, ProviderError
from app.provider_router import ProviderRouter


def test_parse_opencode_ndjson_extracts_text_reasoning_tokens_and_real_step_latency():
    ndjson = "\n".join(
        [
            json.dumps({"type": "step_start", "timestamp": 10000, "part": {"type": "step-start"}}),
            json.dumps(
                {
                    "type": "reasoning",
                    "timestamp": 11500,
                    "part": {"type": "reasoning", "text": "Vou checar o caso de lista vazia."},
                }
            ),
            json.dumps(
                {
                    "type": "text",
                    "timestamp": 12000,
                    "part": {"type": "text", "text": "```python\ndef f(): return 1\n```"},
                }
            ),
            json.dumps(
                {
                    "type": "step_finish",
                    "timestamp": 12500,
                    "part": {
                        "type": "step-finish",
                        "reason": "stop",
                        "tokens": {"input": 250, "output": 30, "reasoning": 70},
                    },
                }
            ),
        ]
    )

    parsed = parse_opencode_ndjson(ndjson, wall_latency_ms=9000.0)
    assert parsed["text"] == "```python\ndef f(): return 1\n```"
    assert parsed["reasoning_text"] == "Vou checar o caso de lista vazia."
    assert parsed["thinking_stripped"] is True
    assert parsed["latency_ms"] == 2500.0  # Uses step_finish - step_start, not CLI boot overhead
    assert parsed["input_tokens"] == 250
    assert parsed["output_tokens"] == 30
    assert parsed["tokens_per_second"] == 40.0  # (30 + 70) / 2.5s


def test_parse_opencode_ndjson_raises_clear_provider_error_on_model_eol():
    ndjson = "\n".join(
        [
            json.dumps({"type": "step_start", "timestamp": 1000}),
            json.dumps(
                {
                    "type": "error",
                    "timestamp": 1050,
                    "error": {
                        "type": "provider.invalid-request",
                        "message": "The model 'openai/gpt-oss-20b' has reached its end of life.",
                        "status": 410,
                    },
                }
            ),
        ]
    )
    with pytest.raises(ProviderError) as exc_info:
        parse_opencode_ndjson(ndjson)
    assert exc_info.value.status_code == 410
    assert exc_info.value.retryable is False
    assert "end of life" in str(exc_info.value)


def test_opencode_provider_filters_console_nvidia_and_classifies_models(monkeypatch):
    oc = OpenCodeCLIProvider(cli_path="fake-opencode", provider_prefix="console-nvidia")

    sample_stdout = "\n".join(
        [
            "opencode/deepseek-v4-flash",
            "console-nvidia/z-ai/glm-5.3-flash",
            "console-nvidia/nvidia/nemotron-3.5-lightning-30b-a3b",
            "console-nvidia/nvidia/nemotron-3.5-content-safety",
            "console-nvidia/nvidia/nemotron-voicechat",
        ]
    )

    async def fake_exec(args, *, timeout, env=None):
        assert args[0] == "models"
        return 0, sample_stdout, ""

    monkeypatch.setattr(oc, "_exec", fake_exec)

    all_models = asyncio.run(oc.list_models(coding_only=False))
    assert len(all_models) == 4
    assert all(m["full_id"].startswith("console-nvidia/") for m in all_models)

    coding_only = asyncio.run(oc.list_models(coding_only=True))
    ids = [m["id"] for m in coding_only]
    assert "z-ai/glm-5.3-flash" in ids
    assert "nvidia/nemotron-3.5-lightning-30b-a3b" in ids
    assert "nvidia/nemotron-3.5-content-safety" not in ids
    assert "nvidia/nemotron-voicechat" not in ids


def test_provider_router_prefers_opencode_without_api_key_in_auto_mode(tmp_path):
    fake_bin = tmp_path / "opencode.exe"
    fake_bin.write_text("stub", encoding="utf-8")

    router = ProviderRouter(
        nvidia=NVIDIAProvider(api_key=""),
        opencode=OpenCodeCLIProvider(cli_path=str(fake_bin), provider_prefix="console-nvidia"),
        mode="auto",
    )
    st = router.status()
    assert st["active_provider_mode"] == "opencode"
    assert st["provider_ready"] is True
    assert st["active_provider_label"] == "OpenChamber (console-nvidia)"

    # Switching to nvidia_api without key marks unconfigured
    st2 = router.set_mode("nvidia_api")
    assert st2["active_provider_mode"] == "unconfigured"
    assert st2["provider_ready"] is False

    # With API key, auto uses nvidia_api unless forced to opencode
    router_with_key = ProviderRouter(
        nvidia=NVIDIAProvider(api_key="nvapi-123"),
        opencode=OpenCodeCLIProvider(cli_path=str(fake_bin), provider_prefix="console-nvidia"),
        mode="auto",
    )
    assert router_with_key.active_mode() == "nvidia_api"
    router_with_key.set_mode("opencode")
    assert router_with_key.active_mode() == "opencode"
