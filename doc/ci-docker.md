# CI 与 Docker 使用说明

本文档说明本项目新增的 CI 与 Docker 配置，以及接入 GitHub Actions 所需的最小配置。

## 1. 新增文件

1. `Dockerfile`
2. `.dockerignore`
3. `.github/workflows/ci.yml`
4. `.github/workflows/docker-build-push.yml`

## 2. CI 流程说明

### 2.1 代码质量 CI

文件：`/.github/workflows/ci.yml`

行为：

1. 在 `push`、`pull_request` 到 `main/master` 时触发（仅代码相关路径变更）。
2. 安装依赖后执行 `pnpm lint`。
3. 开启并发互斥，自动取消同分支旧任务。

### 2.2 Docker 构建与发布

文件：`/.github/workflows/docker-build-push.yml`

行为：

1. `pull_request`：仅做 `linux/amd64` 构建校验，不推镜像。
2. `push` 到 `main/master`：构建并发布镜像到 GHCR；如配置 Docker Hub 则同时发布。
3. `workflow_dispatch`：支持手动控制是否构建 ARM64（`build_arm`）。
4. 私有仓库默认仅构建 `amd64`；公开仓库默认 `amd64 + arm64`。

镜像名配置：

1. workflow 使用 `env.IMAGE_NAME=zrt`，最终镜像地址为：
   1. `ghcr.io/<repo-owner>/zrt`
   2. `docker.io/<dockerhub-username>/zrt`（可选）

## 3. GitHub 必要配置

### 3.1 必需权限

仓库 Actions 权限需要允许：

1. `contents: read`
2. `packages: write`
3. `pull-requests: write`（用于 PR 评论，可选但推荐）

### 3.2 可选变量与密钥（用于 Docker Hub）

1. Repository Variable：`DOCKERHUB_USERNAME`
2. Repository Secret：`DOCKERHUB_TOKEN`

说明：

1. 未配置 Docker Hub 时，流程仅推送 GHCR。
2. GHCR 使用 `GITHUB_TOKEN` 登录。

## 4. Dockerfile 设计说明

1. 基础镜像：`node:22-alpine`
2. 多阶段构建：`deps -> builder -> runner`
3. 使用 Next standalone 输出（依赖 `next.config.ts` 的 `output: "standalone"`）
4. 构建阶段执行：
   1. `pnpm prisma:business:generate`
   2. `pnpm prisma:external:generate`
   3. `pnpm build`
5. 运行阶段以 `nextjs` 非 root 用户启动：`node server.js`

## 5. 本地构建与运行

本地构建示例：

```bash
docker build -t zrt:local .
```

本地运行示例：

```bash
docker run --rm -p 3000:3000 --env-file .env zrt:local
```

说明：

1. 运行时请提供完整业务环境变量（可参考 `.env.example` 与 `doc/trademark-search-deploy-and-init.md`）。
2. 构建阶段已提供占位 build-arg 以避免因必填环境变量缺失导致 Next 构建中断。
