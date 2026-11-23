from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    database_url: str = "sqlite:///./modelarena.db"
    request_timeout_seconds: int = 90
    max_concurrency: int = 1
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
