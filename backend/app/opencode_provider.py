from __future__ import annotations

import asyncio
import json
import os
import re
import shutil
import tempfile
import time
from pathlib import Path
from typing import Any

from .config import settings
from .provider import ProviderError, classify_model, extract_answer_and_reasoning


def find_opencode_binary(configured_path: str = "") -> str | None:
    """Locate the official OpenCode CLI binary (PATH or bundled inside OpenChamber Desktop)."""
    explicit = (configured_path or settings.opencode_cli_path or "").strip()
    if explicit and Path(explicit).is_file():
        return explicit

    on_path = shutil.which("opencode")
    if on_path:
        return on_path

    candidates: list[Path] = []
    if os.name == "nt":
        local_app = os.environ.get("LOCALAPPDATA", "")
        user_profile = os.environ.get("USERPROFILE", "")
        if local_app:
            candidates.extend(
                [
                    Path(local_app) / "Programs" / "@openchamberelectron" / "resources" / "opencode-cli" / "opencode.exe",
                    Path(local_app) / "Programs" / "OpenChamber" / "resources" / "opencode-cli" / "opencode.exe",
                    Path(local_app) / "Programs" / "@opencode-aidesktop" / "resources" / "opencode-cli" / "opencode.exe",
                ]
            )
        if user_profile:
            candidates.extend(
                [
                    Path(user_profile) / ".opencode" / "bin" / "opencode.exe",
                    Path(user_profile) / ".local" / "bin" / "opencode.exe",
                ]
            )
    else:
        home = Path.home()
        candidates.extend(
            [
                Path("/Applications/OpenChamber.app/Contents/Resources/opencode-cli/opencode"),
                home / ".opencode" / "bin" / "opencode",
                home / ".local" / "bin" / "opencode",
                Path("/usr/local/bin/opencode"),
                Path("/opt/OpenChamber/resources/opencode-cli/opencode"),
            ]
        )

    for cand in candidates:
        if cand.is_file():
            return str(cand)
    return None


def _discover_mcp_server_names() -> list[str]:
    """Read ONLY MCP server key names (never values/secrets) to disable external MCPs during pure LLM benchmarks."""
    config_dir = Path.home() / ".config" / "opencode"
    for filename in ("opencode.jsonc", "opencode.json"):
        cfg_file = config_dir / filename
        if not cfg_file.is_file():
            continue
        try:
            raw = cfg_file.read_text(encoding="utf-8")
            # Strip // line comments safely outside strings for lightweight JSONC parsing
            cleaned = re.sub(r"^\s*//.*$", "", raw, flags=re.MULTILINE)
            data = json.loads(cleaned)
            mcp = data.get("mcp")
            if isinstance(mcp, dict):
                return [str(k) for k in mcp.keys() if isinstance(k, str) and k.strip()]
        except Exception:
            return []
    return []


def build_benchmark_opencode_env() -> dict[str, str]:
    """Build an isolated environment for OpenCode CLI benchmark runs without external MCPs/plugins/write permissions."""
    env = os.environ.copy()
    disabled_mcps = {name: {"enabled": False} for name in _discover_mcp_server_names()}
    override_cfg: dict[str, Any] = {
        "instructions": [],
        "plugins": [],
        "permission": {"*": "deny"},
    }
    if disabled_mcps:
        override_cfg["mcp"] = disabled_mcps
    env["OPENCODE_CONFIG_CONTENT"] = json.dumps(override_cfg)
    return env


def parse_opencode_ndjson(stdout: str, *, wall_latency_ms: float = 0.0) -> dict[str, Any]:
    """Parse NDJSON output emitted by `opencode run --format json --thinking`."""
    text_parts: list[str] = []
    reasoning_parts: list[str] = []
    step_start_ts: int | None = None
    step_finish_ts: int | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    reasoning_tokens: int | None = None
    finish_reason: str | None = None
    error_event: dict[str, Any] | None = None

    for raw_line in (stdout or "").splitlines():
        line = raw_line.strip()
        if not line or not line.startswith("{"):
            continue
        try:
            ev = json.loads(line)
        except Exception:
            continue
        if not isinstance(ev, dict):
            continue

        ev_type = ev.get("type")
        part = ev.get("part") if isinstance(ev.get("part"), dict) else {}
        ts = ev.get("timestamp")

        if ev_type == "step_start" and isinstance(ts, (int, float)) and step_start_ts is None:
            step_start_ts = int(ts)
        elif ev_type == "text":
            txt = part.get("text")
            if isinstance(txt, str) and txt:
                text_parts.append(txt)
        elif ev_type == "reasoning":
            rtxt = part.get("text")
            if isinstance(rtxt, str) and rtxt.strip():
                reasoning_parts.append(rtxt.strip())
        elif ev_type == "step_finish":
            if isinstance(ts, (int, float)):
                step_finish_ts = int(ts)
            finish_reason = part.get("reason") or finish_reason
            tokens = part.get("tokens")
            if isinstance(tokens, dict):
                if isinstance(tokens.get("input"), int):
                    input_tokens = tokens["input"]
                if isinstance(tokens.get("output"), int):
                    output_tokens = tokens["output"]
                if isinstance(tokens.get("reasoning"), int):
                    reasoning_tokens = tokens["reasoning"]
        elif ev_type == "error":
            err = ev.get("error")
            if isinstance(err, dict):
                error_event = err
            else:
                error_event = {"message": str(err or "Erro desconhecido do provedor OpenCode.")}

    if error_event is not None:
        status = error_event.get("status") if isinstance(error_event.get("status"), int) else 502
        msg = str(error_event.get("message") or error_event)
        retryable = status in (429, 500, 502, 503, 504)
        raise ProviderError(msg, status_code=status, retryable=retryable)

    raw_text = "\n".join(text_parts).strip()
    extracted = extract_answer_and_reasoning(raw_text, "\n\n".join(reasoning_parts) or None)

    if step_start_ts is not None and step_finish_ts is not None and step_finish_ts >= step_start_ts:
        latency_ms = round(float(step_finish_ts - step_start_ts), 1)
    else:
        latency_ms = round(float(wall_latency_ms), 1)

    effective_output_tokens = output_tokens
    if effective_output_tokens is not None and reasoning_tokens:
        # Tokens/s reflects total generated tokens (output + reasoning) during step duration
        total_gen = effective_output_tokens + reasoning_tokens
    else:
        total_gen = effective_output_tokens

    tokens_per_second: float | None = None
    if total_gen and latency_ms > 0:
        tokens_per_second = round(total_gen / (latency_ms / 1000.0), 1)

    return {
        "text": extracted["text"],
        "raw_text": raw_text,
        "reasoning_text": extracted["reasoning_text"],
        "thinking_stripped": extracted["thinking_stripped"],
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "reasoning_tokens": reasoning_tokens,
        "latency_ms": latency_ms,
        "tokens_per_second": tokens_per_second,
        "finish_reason": finish_reason,
    }


class OpenCodeCLIProvider:
    """Runs benchmarks directly through OpenChamber's bundled OpenCode CLI (no NVIDIA_API_KEY required)."""

    def __init__(
        self,
        cli_path: str | None = None,
        provider_prefix: str | None = None,
        timeout_seconds: int | None = None,
        max_retries: int | None = None,
        use_standalone: bool | None = None,
    ):
        self._cli_path = cli_path
        self._provider_prefix = provider_prefix
        self._timeout_seconds = timeout_seconds
        self._max_retries = max_retries
        self._use_standalone = use_standalone

    @property
    def cli_path(self) -> str | None:
        return find_opencode_binary(self._cli_path or "")

    @property
    def provider_prefix(self) -> str:
        return (self._provider_prefix or settings.opencode_provider_prefix or "console-nvidia").strip().strip("/")

    @property
    def timeout_seconds(self) -> int:
        return self._timeout_seconds if self._timeout_seconds is not None else settings.request_timeout_seconds

    @property
    def max_retries(self) -> int:
        return self._max_retries if self._max_retries is not None else settings.nvidia_max_retries

    @property
    def use_standalone(self) -> bool:
        return self._use_standalone if self._use_standalone is not None else settings.opencode_use_standalone

    def _require_binary(self) -> str:
        binary = self.cli_path
        if not binary:
            raise ProviderError(
                "Binário do OpenCode/OpenChamber não encontrado. Instale o OpenChamber Desktop ou informe OPENCODE_CLI_PATH em backend/.env.",
                status_code=503,
            )
        return binary

    async def _exec(self, args: list[str], *, timeout: int, env: dict[str, str] | None = None) -> tuple[int, str, str]:
        binary = self._require_binary()
        proc = await asyncio.create_subprocess_exec(
            binary,
            *args,
            stdin=asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=tempfile.gettempdir(),
            env=env or os.environ.copy(),
        )
        try:
            stdout_b, stderr_b = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        except asyncio.TimeoutError as exc:
            proc.kill()
            try:
                await proc.wait()
            except Exception:
                pass
            raise ProviderError(
                f"Timeout ({timeout}s) aguardando resposta do modelo via OpenChamber/OpenCode.",
                status_code=504,
                retryable=True,
            ) from exc

        return (
            proc.returncode or 0,
            stdout_b.decode("utf-8", errors="replace"),
            stderr_b.decode("utf-8", errors="replace"),
        )

    async def list_models(
        self,
        *,
        coding_only: bool = False,
        search: str | None = None,
    ) -> list[dict[str, Any]]:
        args = ["models"]
        if self.use_standalone:
            args.append("--standalone")
        rc, stdout, stderr = await self._exec(args, timeout=min(self.timeout_seconds, 30), env=build_benchmark_opencode_env())
        if rc != 0 and not stdout.strip():
            raise ProviderError(f"Falha ao listar modelos via OpenCode CLI: {(stderr or stdout).strip()[:260]}", status_code=502)

        prefix = f"{self.provider_prefix}/"
        query = (search or "").strip().lower()
        enriched: list[dict[str, Any]] = []

        for raw_line in stdout.splitlines():
            line = raw_line.strip()
            if not line or not line.lower().startswith(prefix.lower()):
                continue
            model_id = line[len(prefix):]
            if not model_id:
                continue
            info = classify_model(model_id, owned_by=self.provider_prefix)
            info["object"] = "model"
            info["full_id"] = line
            info["source"] = "openchamber"
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
        del max_tokens, temperature  # Managed by OpenCode provider profile
        prefix = f"{self.provider_prefix}/"
        full_model = model if model.lower().startswith(prefix.lower()) else f"{prefix}{model}"

        instruction = system_prompt or (
            "Você está participando de um benchmark técnico de programação. "
            "Não use ferramentas nem leia arquivos. Siga exatamente as instruções e o formato pedido."
        )
        combined_prompt = f"{instruction}\n\n{prompt}"

        args = ["run"]
        if self.use_standalone:
            args.append("--standalone")
        args.extend(
            [
                "--model",
                full_model,
                "--format",
                "json",
                "--archived",
                "--thinking",
                "--title",
                f"[ModelArena] {model[:48]}",
                combined_prompt,
            ]
        )

        env = build_benchmark_opencode_env()
        attempts = max(1, self.max_retries + 1)
        last_error: Exception | None = None

        for attempt in range(attempts):
            started = time.perf_counter()
            try:
                rc, stdout, stderr = await self._exec(args, timeout=self.timeout_seconds, env=env)
                wall_ms = (time.perf_counter() - started) * 1000.0
                parsed = parse_opencode_ndjson(stdout, wall_latency_ms=wall_ms)
                if rc != 0 and not parsed["text"]:
                    detail = (stderr or stdout).strip()[:280]
                    raise ProviderError(
                        f"OpenCode CLI retornou código {rc} para {full_model}: {detail}",
                        status_code=502,
                    )
                return parsed
            except ProviderError as exc:
                last_error = exc
                if not exc.retryable or attempt >= attempts - 1:
                    raise
                await asyncio.sleep(min(2.0 * (2**attempt), 8.0))

        raise last_error or ProviderError(f"Falha ao executar {full_model} via OpenCode CLI.")

    async def test_connection(self, model: str | None = None) -> dict[str, Any]:
        started = time.perf_counter()
        models = await self.list_models()
        list_ms = round((time.perf_counter() - started) * 1000, 1)
        coding_count = sum(1 for m in models if m["is_coding_candidate"])
        result: dict[str, Any] = {
            "ok": True,
            "mode": "opencode",
            "provider_prefix": self.provider_prefix,
            "cli_path": self.cli_path,
            "models_total": len(models),
            "coding_models_total": coding_count,
            "latency_ms": list_ms,
        }
        if model:
            probe = await self.chat(model, "Responda exatamente apenas com a palavra: OK")
            result["probe"] = {
                "model": model,
                "response": probe["text"],
                "latency_ms": probe["latency_ms"],
                "tokens_per_second": probe["tokens_per_second"],
            }
        return result
