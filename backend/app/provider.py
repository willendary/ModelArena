import httpx
from .config import settings

class NVIDIAProvider:
    def _headers(self):
        if not settings.nvidia_api_key:
            raise RuntimeError("NVIDIA_API_KEY não configurada. Defina a variável no backend/.env.")
        return {"Authorization": f"Bearer {settings.nvidia_api_key}", "Accept": "application/json"}

    async def list_models(self):
        url = settings.nvidia_base_url.rstrip("/") + "/models"
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get(url, headers=self._headers())
            response.raise_for_status()
            payload = response.json()
            return payload.get("data", [])

    async def chat(self, model: str, prompt: str):
        url = settings.nvidia_base_url.rstrip("/") + "/chat/completions"
        body = {
            "model": model,
            "messages": [
                {"role": "system", "content": "Você está participando de um benchmark. Siga exatamente as instruções. Seja objetivo e não invente resultados."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0,
            "stream": False
        }
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.post(url, headers={**self._headers(), "Content-Type": "application/json"}, json=body)
            response.raise_for_status()
            data = response.json()
            choice = (data.get("choices") or [{}])[0]
            usage = data.get("usage") or {}
            return {
                "text": ((choice.get("message") or {}).get("content") or ""),
                "input_tokens": usage.get("prompt_tokens"),
                "output_tokens": usage.get("completion_tokens")
            }
