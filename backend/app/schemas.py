from pydantic import BaseModel, Field

class BenchmarkRequest(BaseModel):
    models: list[str] = Field(min_length=1, max_length=30)
    categories: list[str] = Field(default_factory=lambda: ["reasoning", "coding", "debugging"])
    repeats: int = Field(default=1, ge=1, le=3)

class ModelInfo(BaseModel):
    id: str
    object: str | None = None
    owned_by: str | None = None
