from __future__ import annotations

import base64
import re
from io import BytesIO

import torch
from PIL import Image, UnidentifiedImageError
from transformers import AutoImageProcessor, AutoModel

from app.config import Settings

DATA_URL_PATTERN = re.compile(r"^data:([\w.+-]+/[\w.+-]+);base64,(.*)$", re.IGNORECASE)


class VectorizationError(Exception):
    pass


def _resolve_device(configured_device: str) -> str:
    if configured_device != "auto":
        return configured_device

    if torch.cuda.is_available():
        return "cuda"

    has_mps = bool(getattr(torch.backends, "mps", None))
    if has_mps and torch.backends.mps.is_available():
        return "mps"

    return "cpu"


def _resolve_dtype(configured_dtype: str, device: str) -> torch.dtype:
    if configured_dtype == "float32":
        return torch.float32
    if configured_dtype == "float16":
        return torch.float16
    if configured_dtype == "bfloat16":
        return torch.bfloat16

    if device == "cuda":
        if torch.cuda.is_bf16_supported():
            return torch.bfloat16
        return torch.float16

    return torch.float32


def _decode_image(image_base64: str, max_image_bytes: int) -> Image.Image:
    raw = image_base64.strip()
    if not raw:
        raise VectorizationError("imageBase64 为空")

    matched = DATA_URL_PATTERN.match(raw)
    payload = matched.group(2) if matched else raw

    try:
        image_bytes = base64.b64decode(payload, validate=True)
    except Exception as exc:
        raise VectorizationError(f"imageBase64 不是合法的 Base64: {exc}") from exc

    if len(image_bytes) == 0:
        raise VectorizationError("图片数据为空")

    if len(image_bytes) > max_image_bytes:
        raise VectorizationError(f"图片过大，最大支持 {max_image_bytes} 字节")

    try:
        return Image.open(BytesIO(image_bytes)).convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise VectorizationError(f"无法解析图片内容: {exc}") from exc


class DINOv3Embedder:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.device: str = "cpu"
        self.dtype: torch.dtype = torch.float32
        self.processor: AutoImageProcessor | None = None
        self.model: AutoModel | None = None

    @property
    def loaded(self) -> bool:
        return self.processor is not None and self.model is not None

    def load(self) -> None:
        if self.loaded:
            return

        self.device = _resolve_device(self.settings.torch_device)
        self.dtype = _resolve_dtype(self.settings.torch_dtype, self.device)

        load_kwargs: dict[str, object] = {
            "local_files_only": self.settings.local_files_only,
            "trust_remote_code": self.settings.trust_remote_code,
        }
        if self.settings.hf_token_value:
            load_kwargs["token"] = self.settings.hf_token_value

        self.processor = AutoImageProcessor.from_pretrained(
            self.settings.model_id,
            **load_kwargs,
        )
        self.model = AutoModel.from_pretrained(
            self.settings.model_id,
            **load_kwargs,
        )
        self.model.to(self.device, dtype=self.dtype)
        self.model.eval()

        if self.settings.warmup_on_startup:
            # Warmup can reduce the first request latency after startup.
            warmup_image = Image.new("RGB", (224, 224), color=(0, 0, 0))
            self.embed_image(warmup_image)

    def unload(self) -> None:
        self.processor = None
        self.model = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    def embed_base64(self, image_base64: str) -> list[float]:
        image = _decode_image(image_base64, self.settings.max_image_bytes)
        return self.embed_image(image)

    def embed_image(self, image: Image.Image) -> list[float]:
        if self.processor is None or self.model is None:
            raise RuntimeError("模型尚未加载完成")

        inputs = self.processor(images=image, return_tensors="pt")
        prepared_inputs = {key: value.to(self.device) for key, value in inputs.items()}

        with torch.inference_mode():
            outputs = self.model(**prepared_inputs)

        vector_tensor = getattr(outputs, "pooler_output", None)
        if vector_tensor is None:
            hidden = getattr(outputs, "last_hidden_state", None)
            if hidden is None:
                raise RuntimeError("模型输出不包含 pooler_output 或 last_hidden_state")
            # Fallback to CLS token embedding.
            vector_tensor = hidden[:, 0]

        vector = vector_tensor[0].detach().float().cpu()

        if self.settings.normalize_vector:
            norm = torch.linalg.vector_norm(vector, ord=2)
            if float(norm) > 0:
                vector = vector / norm

        return vector.tolist()

