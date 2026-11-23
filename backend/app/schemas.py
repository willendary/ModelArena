from pydantic import BaseModel, Field


class BenchmarkRequest(BaseModel):
    models: list[str] = Field(min_length=1, max_length=30)
    categories: list[str] = Field(default_factory=lambda: ["reasoning", "coding", "debugging"])
    repeats: int = Field(default=1, ge=1, le=3)


class ProviderTestRequest(BaseModel):
    model: str | None = None


class ModelInfo(BaseModel):
    id: str
    vendor: str | None = None
    object: str | None = None
    owned_by: str | None = None
    modality: str = "chat"
    is_coding_candidate: bool = True
    tags: list[str] = Field(default_factory=list)
