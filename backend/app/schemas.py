from typing import Literal
from pydantic import BaseModel, Field


class BenchmarkRequest(BaseModel):
    models: list[str] = Field(min_length=1, max_length=30)
    categories: list[str] = Field(
        default_factory=lambda: ["reasoning", "coding", "debugging", "delphi", "csharp", "firebird"]
    )
    repeats: int = Field(default=1, ge=1, le=3)


class ProviderTestRequest(BaseModel):
    model: str | None = None


class ProviderModeRequest(BaseModel):
    mode: Literal["auto", "opencode", "nvidia_api"] = "auto"
    opencode_provider_prefix: str | None = None


class ScheduleUpdateRequest(BaseModel):
    enabled: bool = False
    interval_minutes: int = Field(default=360, ge=5, le=10080)
    model_selection_mode: Literal["manual", "auto_coding"] = "manual"
    max_auto_models: int = Field(default=6, ge=1, le=20)
    models: list[str] = Field(default_factory=list, max_length=30)
    categories: list[str] = Field(
        default_factory=lambda: ["reasoning", "coding", "debugging", "delphi", "csharp", "firebird"]
    )
    repeats: int = Field(default=1, ge=1, le=3)


class ModelInfo(BaseModel):
    id: str
    vendor: str | None = None
    object: str | None = None
    owned_by: str | None = None
    modality: str = "chat"
    is_coding_candidate: bool = True
    tags: list[str] = Field(default_factory=list)
