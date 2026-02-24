import type { RechargePackage } from "./types";

export const DB_SYNC_TIME = "2026-01-30 12:30";

export const RECHARGE_PACKAGES: RechargePackage[] = [
  { id: "1", amount: 50, credits: 500 },
  { id: "2", amount: 100, credits: 1000 },
  { id: "3", amount: 500, credits: 5500, isPopular: true },
  { id: "4", amount: 900, credits: 10000 },
];

export const LANDING_CAROUSEL = [
  {
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1400",
    caption: "AI Search Interface",
  },
  {
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1400",
    caption: "Design Patent Comparison",
  },
  {
    url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1400",
    caption: "Trademark Verification",
  },
];

export const LANDING_FEATURES = [
  {
    title: "毫秒级视觉识别",
    desc: "基于超大规模视觉特征向量模型，捕捉设计最细微的相似点。",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    color: "blue",
  },
  {
    title: "全美数据覆盖",
    desc: "实时同步 USPTO 最新公开的外观设计专利与商标申请数据。",
    icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
    color: "purple",
  },
  {
    title: "隐私安全保障",
    desc: "所有检索请求均经过端到端加密，历史记录存储于服务端并可追溯。",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "indigo",
  },
];
