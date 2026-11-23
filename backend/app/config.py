from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    provider_mode: str = "auto"
    opencode_cli_path: str = ""
    opencode_provider_prefix: str = "console-nvidia"
    opencode_use_standalone: bool = True

    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    database_url: str = f"sqlite:///{(BACKEND_DIR / 'modelarena.db').as_posix()}"
    request_timeout_seconds: int = 120
    max_concurrency: int = 1
    nvidia_max_retries: int = 2
    nvidia_max_tokens: int = 2048
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:8765,http://127.0.0.1:8765"
    )
    scheduler_enabled: bool = True
    scheduler_poll_seconds: int = 30

    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_DIR / ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def nvidia_configured(self) -> bool:
        return bool((self.nvidia_api_key or "").strip())


settings = Settings()
