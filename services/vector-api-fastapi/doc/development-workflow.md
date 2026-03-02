# vector-api-fastapi 开发流程（uv 标准路线）

## 1. 目标与原则

- 本项目依赖的唯一维护源：`pyproject.toml`
- 本地开发运行方式：`uv`（自动使用项目 `.venv`）
- 部署/镜像安装依赖文件：`requirements.txt`（由 `uv export` 生成，不手改）

当前项目在 `pyproject.toml` 中声明了：

- 运行时依赖：`[project].dependencies`
- 开发依赖：`[dependency-groups].dev`
- `package = false`：本项目按应用服务管理依赖，不走包发布流程

## 2. 前置条件

- Python `>=3.11`
- 已安装 `uv`

安装 `uv`（未安装时）：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## 3. 首次初始化（本地开发）

在项目目录执行：

```bash
cd services/vector-api-fastapi
uv lock
uv sync
```

说明：

- `uv sync` 会自动创建并维护项目虚拟环境：`services/vector-api-fastapi/.venv`
- 不需要手动 `python -m venv .venv`

## 4. 日常开发命令

启动服务：

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 1
```

运行测试：

```bash
uv run pytest
```

静态检查：

```bash
uv run ruff check
```

## 5. 依赖变更流程

新增运行时依赖：

```bash
uv add <package>
```

新增开发依赖：

```bash
uv add --dev <package>
```

升级并重锁定后同步：

```bash
uv lock
uv sync
```

注意：

- 不要手动编辑 `requirements.txt`
- 依赖变更后，优先检查 `pyproject.toml` 和 `uv.lock` 是否一致

## 6. requirements.txt 生成规则（部署用）

仅在需要给 `pip install -r requirements.txt` 或 Docker 构建时生成：

```bash
uv export --frozen --no-dev --no-hashes -o requirements.txt
```

说明：

- `--no-dev`：只导出运行时依赖
- 若你希望导出包含开发依赖的完整列表，可移除 `--no-dev`
- 文件内容比 `dependencies` 多是正常的，因为会包含传递依赖

## 7. Docker 构建前检查

当前 `Dockerfile` 通过 `requirements.txt` 安装依赖，因此构建前请先导出：

```bash
uv export --frozen --no-dev --no-hashes -o requirements.txt
docker build -t zrt-vector-api-fastapi .
```

## 8. 常见问题

### 8.1 `No solution found when resolving dependencies`

原因通常是版本不可用（例如拼错版本号）。

处理：

1. 检查 `pyproject.toml` 中固定版本是否存在
2. 修改后重新执行：

```bash
uv lock
uv sync
```

### 8.2 `requirements.txt` 比 `dependencies` 多很多

正常。`requirements.txt` 是“完整可复现依赖树”，会包含所有传递依赖和平台条件依赖（如 `torch` 相关条目）。

