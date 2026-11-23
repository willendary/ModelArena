import asyncio
import json

import httpx
import pytest

from app.provider import (
    NVIDIAProvider,
    ProviderError,
    classify_model,
    extract_answer_and_reasoning,
)


def test_classify_model_distinguishes_coding_vs_non_chat():
    coder = classify_model("qwen/qwen2.5-coder-32b-instruct")
    assert coder["is_coding_candidate"] is True
    assert coder["modality"] == "chat"
    assert "coding" in coder["tags"]
    assert coder["vendor"] == "qwen"

    reasoning = classify_model("deepseek-ai/deepseek-r1")
    assert reasoning["is_coding_candidate"] is True
    assert "reasoning" in reasoning["tags"]

    embed = classify_model("nvidia/nv-embedqa-e5-v5")
    assert embed["is_coding_candidate"] is False
    assert embed["modality"] == "embedding"

    rerank = classify_model("nvidia/nv-rerankqa-mistral-4b-v3")
    assert rerank["is_coding_candidate"] is False
    assert rerank["modality"] == "rerank"

    guard = classify_model("nvidia/llama-3.1-nemoguard-8b-content-safety")
    assert guard["is_coding_candidate"] is False
    assert guard["modality"] == "guardrail"


def test_extract_answer_and_reasoning_strips_think_and_keeps_reasoning():
    res = extract_answer_and_reasoning(
        "<think>Vou analisar passo a passo...</think>\n```python\ndef f(): return 1\n```"
    )
    assert res["thinking_stripped"] is True
    assert "Vou analisar" in (res["reasoning_text"] or "")
    assert res["text"].startswith("```python")

    res_separate = extract_answer_and_reasoning(
        "ORDEM: A, B, C",
        reasoning_content="A antes de C e B não pode ser primeira.",
    )
    assert res_separate["thinking_stripped"] is True
    assert res_separate["text"] == "ORDEM: A, B, C"
    assert "A antes de C" in (res_separate["reasoning_text"] or "")

    res_unclosed = extract_answer_and_reasoning("Texto final\n<think>pensamento cortado")
    assert res_unclosed["thinking_stripped"] is True
    assert res_unclosed["text"] == "Texto final"


def test_provider_retries_on_429_and_parses_chat_metrics():
    attempts = {"count": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        attempts["count"] += 1
        if request.url.path.endswith("/models"):
            return httpx.Response(
                200,
                json={
                    "data": [
                        {"id": "nvidia/nv-embedqa-e5-v5", "owned_by": "nvidia"},
                        {"id": "z-ai/glm-5.3-flash", "owned_by": "z-ai"},
                        {"id": "qwen/qwen2.5-coder-32b-instruct", "owned_by": "qwen"},
                    ]
                },
            )
        if attempts["count"] == 1:
            return httpx.Response(429, headers={"Retry-After": "0"}, json={"error": {"message": "rate limited"}})
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": "<think>checando</think>\nOK",
                            "reasoning_content": "raciocínio extra",
                        },
                        "finish_reason": "stop",
                    }
                ],
                "usage": {"prompt_tokens": 20, "completion_tokens": 10},
            },
        )

    provider = NVIDIAProvider(
        api_key="nvapi-test-token",
        base_url="https://integrate.api.nvidia.com/v1",
        max_retries=2,
        transport=httpx.MockTransport(handler),
    )

    chat_res = asyncio.run(provider.chat("z-ai/glm-5.3-flash", "Responda OK"))
    assert attempts["count"] == 2
    assert chat_res["text"] == "OK"
    assert chat_res["thinking_stripped"] is True
    assert chat_res["input_tokens"] == 20
    assert chat_res["output_tokens"] == 10
    assert chat_res["latency_ms"] >= 0

    coding_models = asyncio.run(provider.list_models(coding_only=True))
    ids = [m["id"] for m in coding_models]
    assert "nvidia/nv-embedqa-e5-v5" not in ids
    assert ids[0] == "qwen/qwen2.5-coder-32b-instruct"
    assert "z-ai/glm-5.3-flash" in ids


def test_provider_returns_clear_error_on_401():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"detail": "Invalid API key"})

    provider = NVIDIAProvider(
        api_key="nvapi-bad",
        max_retries=1,
        transport=httpx.MockTransport(handler),
    )
    with pytest.raises(ProviderError) as exc_info:
        asyncio.run(provider.list_models())
    assert exc_info.value.status_code == 401
    assert "inválida" in str(exc_info.value).lower()
