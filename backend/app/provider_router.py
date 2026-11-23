from __future__ import annotations

from typing import Any

from .config import settings
from .opencode_provider import OpenCodeCLIProvider
from .provider import NVIDIAProvider


class ProviderRouter:
    """Routes benchmark calls transparently between OpenChamber/OpenCode CLI (no API key) and NVIDIA NIM API."""

    def __init__(
        self,
        nvidia: NVIDIAProvider | None = None,
        opencode: OpenCodeCLIProvider | None = None,
        mode: str | None = None,
    ):
        self.nvidia = nvidia or NVIDIAProvider()
        self.opencode = opencode or OpenCodeCLIProvider()
        self.mode = (mode or settings.provider_mode or "auto").strip().lower()

    def set_mode(self, mode: str, *, provider_prefix: str | None = None) -> dict[str, Any]:
        clean = mode.strip().lower()
        if clean not in ("auto", "opencode", "nvidia_api"):
            raise ValueError("Modo inválido. Use: auto, opencode ou nvidia_api.")
        self.mode = clean
        if provider_prefix is not None and provider_prefix.strip():
            self.opencode._provider_prefix = provider_prefix.strip().strip("/")
        return self.status()

    def active_mode(self) -> str:
        if self.mode == "opencode":
            return "opencode" if self.opencode.cli_path else "unconfigured"
        if self.mode == "nvidia_api":
            return "nvidia_api" if bool(self.nvidia.api_key) else "unconfigured"
        # auto: prefer NVIDIA API only if user explicitly configured a key; otherwise use OpenChamber/OpenCode seamlessly
        if bool(self.nvidia.api_key):
            return "nvidia_api"
        if self.opencode.cli_path:
            return "opencode"
        return "unconfigured"

    def _delegate(self) -> NVIDIAProvider | OpenCodeCLIProvider:
        resolved = self.active_mode()
        if resolved == "opencode":
            return self.opencode
        if self.mode == "opencode":
            return self.opencode
        return self.nvidia

    def status(self) -> dict[str, Any]:
        resolved = self.active_mode()
        oc_path = self.opencode.cli_path
        prefix = self.opencode.provider_prefix
        nvidia_ok = bool(self.nvidia.api_key)
        if resolved == "opencode":
            label = f"OpenChamber ({prefix})"
        elif resolved == "nvidia_api":
            label = "NVIDIA NIM API"
        else:
            label = "Não configurado"
        return {
            "configured_mode": self.mode,
            "active_provider_mode": resolved,
            "active_provider_label": label,
            "provider_ready": resolved in ("opencode", "nvidia_api"),
            "opencode_available": bool(oc_path),
            "opencode_cli_path": oc_path,
            "opencode_provider_prefix": prefix,
            "nvidia_configured": nvidia_ok,
        }

    async def list_models(self, *, coding_only: bool = False, search: str | None = None) -> list[dict[str, Any]]:
        return await self._delegate().list_models(coding_only=coding_only, search=search)

    async def chat(
        self,
        model: str,
        prompt: str,
        *,
        system_prompt: str | None = None,
        max_tokens: int | None = None,
        temperature: float = 0.0,
    ) -> dict[str, Any]:
        return await self._delegate().chat(
            model,
            prompt,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
        )

    async def test_connection(self, model: str | None = None) -> dict[str, Any]:
        return await self._delegate().test_connection(model=model)
