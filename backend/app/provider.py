from __future__ import annotations

import asyncio
import re
import time
from typing import Any

import httpx

from .config import settings

NON_CHAT_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("embedding", re.compile(r"(embed|bge-|e5-|snowflake-arctic-embed|nv-embed)", re.I)),
    ("rerank", re.compile(r"(rerank|nv-rerank)", re.I)),
    ("audio", re.compile(r"(whisper|parakeet|riva|canary|tts|asr|speech|audio)", re.I)),
    ("vision_gen", re.compile(r"(stable-diffusion|sdxl|flux|imagen|cosmos-predict|edify|trellis|consistory|visual-change)", re.I)),
    ("guardrail", re.compile(r"(guard|shield|safety|nemoguard|content-safety|topic-control|jailbreak)", re.I)),
    ("reward", re.compile(r"(reward|helpsteer|steerm|prm-)", re.I)),
    ("ocr", re.compile(r"(neva|paddleocr|deplot|kosmos|parse|layout|paligemma|grounding-dino|florence|yolox)", re.I)),
)

CODING_KEYWORDS = re.compile(
    r"(coder|codestral|devstral|starcoder|deepseek|qwen|glm|nemotron|llama-3\.[123]|llama-4|mistral|kimi|minimax|gpt-oss|granite-code|command-r|claude|gemma)",
    re.I,
)
REASONING_KEYWORDS = re.compile(r"(deepseek-r1|qwq|reason|think|nemotron.*(ultra|super)|glm-5|glm-4\.5|kimi-k2)", re.I)
FAST_KEYWORDS = re.compile(r"(flash|mini|nano|haiku|small|lite|8b|7b|9b|14b|instant|turbo)", re.I)
THINK_BLOCK_RE = re.compile(r"<think>(.*?)</think>", re.DOTALL | re.IGNORECASE)
UNCLOSED_THINK_RE = re.compile(r"<think>(.*)$", re.DOTALL | re.IGNORECASE)


def classify_model(model_id: str, owned_by: str | None = None) -> dict[str, Any]:
    """Classify an NVIDIA NIM model ID by modality, vendor, and coding suitability."""
    mid = (model_id or "").strip()
    vendor = mid.split("/", 1)[0] if "/" in mid else (owned_by or "nvidia")

    modality = "chat"
    for kind, pattern in NON_CHAT_PATTERNS:
        if pattern.search(mid):
            modality = kind
            break

    is_coding_candidate = modality == "chat"
    tags: list[str] = []
    if modality != "chat":
        tags.append(modality)
    else:
        if re.search(r"(coder|codestral|devstral|starcoder)", mid, re.I):
            tags.append("coding")
        elif CODING_KEYWORDS.search(mid):
            tags.append("general-code")
        if REASONING_KEYWORDS.search(mid):
            tags.append("reasoning")
        if FAST_KEYWORDS.search(mid):
            tags.append("fast")
        if re.search(r"(-vl|vision|multimodal)", mid, re.I):
            tags.append("vision")

    return {
        "id": mid,
        "vendor": vendor,
        "owned_by": owned_by or vendor,
        "modality": modality,
        "is_coding_candidate": is_coding_candidate,
        "tags": tags,
    }


def extract_answer_and_reasoning(
    content: Any,
    reasoning_content: Any = None,
) -> dict[str, Any]:
    """Separate <think> blocks / reasoning_content from the clean final answer."""
    raw_text = ""
    if isinstance(content, str):
        raw_text = content
    elif isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(str(item.get("text") or ""))
            elif isinstance(item, str):
                parts.append(item)
        raw_text = "\n".join(parts)

    reasoning_parts: list[str] = []
    if isinstance(reasoning_content, str) and reasoning_content.strip():
        reasoning_parts.append(reasoning_content.strip())

    thinking_stripped = bool(reasoning_parts)
    clean_text = raw_text

    matches = THINK_BLOCK_RE.findall(clean_text)
    if matches:
        thinking_stripped = True
        for m in matches:
            if m.strip():
                reasoning_parts.append(m.strip())
        clean_text = THINK_BLOCK_RE.sub("", clean_text)

    # Handle truncated unclosed <think> blocks if model hit token limit while thinking
    if "<think>" in clean_text.lower():
        unclosed = UNCLOSED_THINK_RE.search(clean_text)
        if unclosed:
            thinking_stripped = True
            if unclosed.group(1).strip():
                reasoning_parts.append(unclosed.group(1).strip())
            clean_text = UNCLOSED_THINK_RE.sub("", clean_text)

    return {
        "text": clean_text.strip(),
        "raw_text": raw_text,
        "reasoning_text": "\n\n".join(reasoning_parts).strip() or None,
        "thinking_stripped": thinking_stripped,
    }


class ProviderError(RuntimeError):
    def __init__(self, message: str, status_code: int | None = None, retryable: bool = False):
        super().__init__(message)
        self.status_code = status_code
        self.retryable = retryable


def _format_http_error(exc: httpx.HTTPStatusError, model: str | None = None) -> ProviderError:
    status = exc.response.status_code
    detail = ""
    try:
        payload = exc.response.json()
        err = payload.get("error") or payload.get("detail") or payload
        if isinstance(err, dict):
            detail = str(err.get("message") or err.get("detail") or err)
        else:
            detail = str(err)
    except Exception:
        detail = (exc.response.text or "")[:240].strip()

    suffix = f" ({detail})" if detail else ""
    target = f" [{model}]" if model else ""

    if status == 401:
        return ProviderError(f"NVIDIA_API_KEY inválida ou expirada.{suffix}", status_code=401)
    if status == 403:
        return ProviderError(f"Modelo{target} não habilitado para sua conta/região NVIDIA.{suffix}", status_code=403)
    if status == 404:
        return ProviderError(f"Modelo{target} não encontrado no endpoint NVIDIA NIM.{suffix}", status_code=404)
    if status == 429:
        return ProviderError(f"Rate limit (429) atingido na API NVIDIA{target}.{suffix}", status_code=429, retryable=True)
    if status >= 500:
        return ProviderError(f"Erro temporário do servidor NVIDIA ({status}){target}.{suffix}", status_code=status, retryable=True)
    return ProviderError(f"Erro HTTP {status} na API NVIDIA{target}.{suffix}", status_code=status)


class NVIDIAProvider:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout_seconds: int | None = None,
        max_retries: int | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ):
        self._api_key = api_key
        self._base_url = base_url
        self._timeout_seconds = timeout_seconds
        self._max_retries = max_retries
        self._transport = transport

    @property
    def api_key(self) -> str:
        return (self._api_key if self._api_key is not None else settings.nvidia_api_key).strip()

    @property
    def base_url(self) -> str:
        return (self._base_url or settings.nvidia_base_url).rstrip("/")

    @property
    def timeout_seconds(self) -> int:
        return self._timeout_seconds if self._timeout_seconds is not None else settings.request_timeout_seconds

    @property
    def max_retries(self) -> int:
        return self._max_retries if self._max_retries is not None else settings.nvidia_max_retries

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise ProviderError(
                "NVIDIA_API_KEY não configurada. Defina a variável em backend/.env ou no ambiente.",
                status_code=401,
            )
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        }

    def _make_client(self) -> httpx.AsyncClient:
        kwargs: dict[str, Any] = {"timeout": self.timeout_seconds}
        if self._transport is not None:
            kwargs["transport"] = self._transport
        return httpx.AsyncClient(**kwargs)

    async def _request_with_retry(
        self,
        method: str,
        url: str,
        *,
        headers: dict[str, str],
        json_body: dict[str, Any] | None = None,
        model: str | None = None,
    ) -> httpx.Response:
        attempts = max(1, self.max_retries + 1)
        last_error: Exception | None = None

        for attempt in range(attempts):
            try:
                async with self._make_client() as client:
                    response = await client.request(method, url, headers=headers, json=json_body)
                    response.raise_for_status()
                    return response
            except httpx.HTTPStatusError as exc:
                err = _format_http_error(exc, model=model)
                last_error = err
                if not err.retryable or attempt >= attempts - 1:
                    raise err from exc
                retry_after = exc.response.headers.get("retry-after")
                delay = min(float(retry_after), 8.0) if (retry_after and retry_after.replace(".", "", 1).isdigit()) else min(1.5 * (2**attempt), 8.0)
                await asyncio.sleep(delay)
            except (httpx.TimeoutException, httpx.ConnectError, httpx.RemoteProtocolError) as exc:
                last_error = ProviderError(
                    f"Falha de rede/timeout ao conectar na API NVIDIA: {exc}",
                    status_code=504,
                    retryable=True,
                )
                if attempt >= attempts - 1:
                    raise last_error from exc
                await asyncio.sleep(min(1.5 * (2**attempt), 6.0))

        raise last_error or ProviderError("Falha desconhecida ao comunicar com a API NVIDIA.")

    async def list_models(
        self,
        *,
        coding_only: bool = False,
        search: str | None = None,
    ) -> list[dict[str, Any]]:
        url = f"{self.base_url}/models"
        response = await self._request_with_retry("GET", url, headers=self._headers())
        payload = response.json()
        raw_items = payload.get("data", []) or []

        enriched: list[dict[str, Any]] = []
        query = (search or "").strip().lower()
        for item in raw_items:
            model_id = item.get("id")
            if not model_id:
                continue
            info = classify_model(model_id, owned_by=item.get("owned_by"))
            info["object"] = item.get("object")
            if coding_only and not info["is_coding_candidate"]:
                continue
            if query and query not in model_id.lower() and query not in (info["vendor"] or "").lower():
                continue
            enriched.append(info)

        def _sort_key(m: dict[str, Any]) -> tuple[int, int, str]:
            coding_priority = 0 if "coding" in m["tags"] else (1 if m["is_coding_candidate"] else 2)
            reasoning_priority = 0 if "reasoning" in m["tags"] else 1
            return (coding_priority, reasoning_priority, m["id"].lower())

        enriched.sort(key=_sort_key)
        return enriched

    async def chat(
        self,
        model: str,
        prompt: str,
        *,
        system_prompt: str | None = None,
        max_tokens: int | None = None,
        temperature: float = 0.0,
    ) -> dict[str, Any]:
        url = f"{self.base_url}/chat/completions"
        body: dict[str, Any] = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                    or (
                        "Você está participando de um benchmark técnico de programação. "
                        "Siga exatamente as instruções e restrições de formato. "
                        "Seja objetivo, produza código funcional e não invente resultados."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens or settings.nvidia_max_tokens,
            "stream": False,
        }

        started = time.perf_counter()
        response = await self._request_with_retry(
            "POST",
            url,
            headers={**self._headers(), "Content-Type": "application/json"},
            json_body=body,
            model=model,
        )
        latency_ms = round((time.perf_counter() - started) * 1000, 1)

        data = response.json()
        choice = (data.get("choices") or [{}])[0]
        message = choice.get("message") or {}
        usage = data.get("usage") or {}
        extracted = extract_answer_and_reasoning(
            message.get("content"),
            message.get("reasoning_content"),
        )

        input_tokens = usage.get("prompt_tokens")
        output_tokens = usage.get("completion_tokens")
        tokens_per_second: float | None = None
        if output_tokens and latency_ms > 0:
            tokens_per_second = round(output_tokens / (latency_ms / 1000.0), 1)

        return {
            "text": extracted["text"],
            "raw_text": extracted["raw_text"],
            "reasoning_text": extracted["reasoning_text"],
            "thinking_stripped": extracted["thinking_stripped"],
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "latency_ms": latency_ms,
            "tokens_per_second": tokens_per_second,
            "finish_reason": choice.get("finish_reason"),
        }

    async def test_connection(self, model: str | None = None) -> dict[str, Any]:
        started = time.perf_counter()
        models = await self.list_models()
        list_ms = round((time.perf_counter() - started) * 1000, 1)
        coding_count = sum(1 for m in models if m["is_coding_candidate"])
        result: dict[str, Any] = {
            "ok": True,
            "base_url": self.base_url,
            "models_total": len(models),
            "coding_models_total": coding_count,
            "latency_ms": list_ms,
        }
        if model:
            probe = await self.chat(
                model,
                "Responda apenas com a palavra OK.",
                max_tokens=32,
            )
            result["probe"] = {
                "model": model,
                "response": probe["text"],
                "latency_ms": probe["latency_ms"],
                "tokens_per_second": probe["tokens_per_second"],
            }
        return result
