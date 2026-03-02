from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "zrt-vector-api-fastapi"
    app_version: str = "0.1.0"
    log_level: str = "INFO"

    model_id: str = "facebook/dinov3-vitl16-pretrain-lvd1689m"
    hf_token: SecretStr | None = None
    local_files_only: bool = False
    trust_remote_code: bool = False
    warmup_on_startup: bool = True

    # Use "auto" for runtime detection (cuda -> mps -> cpu).
    torch_device: Literal["auto", "cpu", "cuda", "mps"] = "auto"
    # Valid values: auto, float32, float16, bfloat16.
    torch_dtype: Literal["auto", "float32", "float16", "bfloat16"] = "auto"

    max_image_bytes: int = Field(default=10 * 1024 * 1024, ge=1)
    normalize_vector: bool = False
    reject_model_override: bool = True
    vector_api_key: SecretStr | None = None

    @property
    def hf_token_value(self) -> str | None:
        if self.hf_token is None:
            return None
        token = self.hf_token.get_secret_value().strip()
        return token if token else None

    @property
    def vector_api_key_value(self) -> str | None:
        if self.vector_api_key is None:
            return None
        key = self.vector_api_key.get_secret_value().strip()
        return key if key else None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
