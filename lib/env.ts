// 统一加载 .env，仅在服务端模块执行。
import "server-only";

import { config } from "dotenv";

const dotenvLoaded = process.env.DOTENV_LOADED;

if (!dotenvLoaded) {
  config();
  process.env.DOTENV_LOADED = "true";
}
