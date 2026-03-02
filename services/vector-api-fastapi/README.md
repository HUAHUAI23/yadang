# vector-api-fastapi

`vector-api-fastapi` is a local embedding service for `facebook/dinov3-vitl16-pretrain-lvd1689m`.

## API

- `GET /healthz`: process health.
- `GET /readyz`: model readiness.
- `POST /v1/vectorize`: image embedding endpoint.
  - Requires `Authorization: Bearer <VECTOR_API_KEY>`.

Request payload:

```json
{
  "model": "facebook/dinov3-vitl16-pretrain-lvd1689m",
  "imageBase64": "data:image/png;base64,...",
  "mimeType": "image/png"
}
```

Response payload:

```json
{
  "vector": [0.0123, -0.0456],
  "dimension": 1024,
  "model": "facebook/dinov3-vitl16-pretrain-lvd1689m",
  "provider": "local-fastapi-dinov3",
  "latencyMs": 52,
  "normalized": false
}
```

## Dependency Management (recommended)

Use `pyproject.toml` as dependency source and export `requirements.txt` for deployment:

```bash
uv lock
uv export --no-hashes -o requirements.txt
```

If your project already uses `venv`, install directly:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 1
```

If you use the official gated model, place your token in `.env`:

```env
HF_TOKEN=hf_xxx
```

Then point the main app to this service:

```env
VECTOR_API_ENDPOINT=http://127.0.0.1:8001/v1/vectorize
VECTOR_API_KEY=replace_with_internal_vector_api_token
VECTOR_MODEL_ID=facebook/dinov3-vitl16-pretrain-lvd1689m
VECTOR_DIMENSION=1024
```

## Docker

```bash
docker build -t zrt-vector-api-fastapi .
docker run --rm -p 8001:8001 --env-file .env zrt-vector-api-fastapi
```

Or with compose:

```bash
docker compose up -d --build
```
