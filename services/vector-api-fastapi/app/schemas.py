from pydantic import BaseModel, Field


class VectorizeRequest(BaseModel):
    model: str | None = Field(default=None, min_length=1)
    imageBase64: str = Field(..., min_length=1)
    mimeType: str | None = Field(default=None, min_length=1)


class HealthResponse(BaseModel):
    status: str
    model: str
    device: str
    loaded: bool


class VectorizeResponse(BaseModel):
    vector: list[float]
    dimension: int
    model: str
    provider: str
    latencyMs: int
    normalized: bool

