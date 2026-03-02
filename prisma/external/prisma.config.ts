// Prisma CLI 外部库配置，仅结构拉取不维护迁移。
import path from "node:path";
import { defineConfig, env } from "prisma/config";

import "dotenv/config";

export default defineConfig({
  schema: path.join("schema.prisma"),
  datasource: {
    url: env("EXTERNAL_DATABASE_URL"),
  },
});
