// Prisma CLI 业务库配置，集中定义 schema、迁移路径与连接信息。
import "dotenv/config";

import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: path.join("schema.prisma"),
  migrations: {
    path: path.join("migrations"),
  },
  datasource: {
    url: env("BUSINESS_DATABASE_URL"),
  },
});
