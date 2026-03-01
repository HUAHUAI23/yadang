from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from http import HTTPStatus

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings
from app.inference import DINOv3Embedder, VectorizationError
from app.schemas import HealthResponse, VectorizeRequest, VectorizeResponse

PROVIDER_NAME = "local-fastapi-dinov3"
bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class RuntimeState:
    settings: Settings
    embedder: DINOv3Embedder


def _configure_logging(level: str) -> None:
    logging.basicConfig(
        level=level.upper(),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    _configure_logging(settings.log_level)
    logger = logging.getLogger("vector-api")

    embedder = DINOv3Embedder(settings)
    logger.info("Loading model '%s' ...", settings.model_id)

    started_at = time.perf_counter()
    embedder.load()
    elapsed_ms = int((time.perf_counter() - started_at) * 1000)

    logger.info(
        "Model loaded: model=%s, device=%s, dtype=%s, warmup=%s, auth=%s, cost=%sms",
        settings.model_id,
        embedder.device,
        embedder.dtype,
        settings.warmup_on_startup,
        bool(settings.vector_api_key_value),
        elapsed_ms,
    )

    app.state.runtime = RuntimeState(settings=settings, embedder=embedder)

    try:
        yield
    finally:
        logger.info("Shutting down vector model runtime ...")
        embedder.unload()


app = FastAPI(
    title="ZRT Local DINOv3 Vector API",
    version="0.1.0",
    lifespan=lifespan,
)


def _runtime() -> RuntimeState:
    runtime = getattr(app.state, "runtime", None)
    if runtime is None:
        raise HTTPException(
            status_code=HTTPStatus.SERVICE_UNAVAILABLE,
            detail="模型服务未就绪",
        )
    return runtime


def _verify_vector_api_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> None:
    runtime = _runtime()
    expected_key = runtime.settings.vector_api_key_value

    if expected_key is None:
        return

    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or credentials.credentials != expected_key
    ):
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail="向量接口鉴权失败",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.get("/healthz", response_model=HealthResponse)
def healthz():
    runtime = _runtime()
    return HealthResponse(
        status="ok",
        model=runtime.settings.model_id,
        device=runtime.embedder.device,
        loaded=runtime.embedder.loaded,
    )


@app.get("/readyz", response_model=HealthResponse)
def readyz():
    runtime = _runtime()
    if not runtime.embedder.loaded:
        raise HTTPException(
            status_code=HTTPStatus.SERVICE_UNAVAILABLE,
            detail="模型未加载完成",
        )
    return HealthResponse(
        status="ready",
        model=runtime.settings.model_id,
        device=runtime.embedder.device,
        loaded=True,
    )


@app.post("/v1/vectorize", response_model=VectorizeResponse)
def vectorize(
    request: VectorizeRequest,
    _: None = Depends(_verify_vector_api_auth),
):
    runtime = _runtime()
    settings = runtime.settings

    if request.model and settings.reject_model_override and request.model != settings.model_id:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST,
            detail=f"不支持请求模型 {request.model}，当前服务仅加载 {settings.model_id}",
        )

    started_at = time.perf_counter()
    try:
        vector = runtime.embedder.embed_base64(request.imageBase64)
    except VectorizationError as exc:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=HTTPStatus.SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"向量化失败: {exc}",
        ) from exc

    latency_ms = int((time.perf_counter() - started_at) * 1000)
    return VectorizeResponse(
        vector=vector,
        dimension=len(vector),
        model=settings.model_id,
        provider=PROVIDER_NAME,
        latencyMs=latency_ms,
        normalized=settings.normalize_vector,
    )
