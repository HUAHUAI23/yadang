import type {
  ApiResponse,
  AuthPayload,
  AuthResult,
  RegisterPayload,
  SearchConfig,
  SearchResponse,
} from "@/lib/types";
import { SearchType } from "@/lib/types";
import { RECHARGE_PACKAGES } from "@/lib/constants";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockPatents = [
  {
    id: "p-001",
    type: SearchType.DESIGN_PATENT,
    title: "可折叠无线耳机收纳盒",
    number: "D987654",
    owner: "Nova Audio Inc.",
    filingDate: "2023-08-10",
    issueDate: "2024-03-02",
    description: "圆角矩形结构，顶部弧形开合，侧边带隐藏式磁吸。",
    imageUrl:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=800",
    status: "Active",
    similarityScore: 0.93,
  },
  {
    id: "p-002",
    type: SearchType.DESIGN_PATENT,
    title: "智能咖啡机外观设计",
    number: "D962431",
    owner: "Arca Brew Co.",
    filingDate: "2022-12-05",
    issueDate: "2023-06-18",
    description: "一体式胶囊仓，前置环形灯带，顶部触控面板。",
    imageUrl:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800",
    status: "Active",
    similarityScore: 0.88,
  },
  {
    id: "p-003",
    type: SearchType.DESIGN_PATENT,
    title: "极简桌面音箱外观",
    number: "D945210",
    owner: "Lumen Works",
    filingDate: "2022-04-28",
    issueDate: "2022-11-21",
    description: "方形格栅与圆角框体组合，正面隐藏式按键。",
    imageUrl:
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=800",
    status: "Active",
    similarityScore: 0.84,
  },
];

const mockTrademarks = [
  {
    id: "t-001",
    type: SearchType.TRADEMARK,
    title: "LUMEN ARC",
    number: "TM-803221",
    owner: "Lumen Works",
    filingDate: "2023-02-02",
    issueDate: "2023-09-14",
    description: "用于智能音频设备的商标与图形组合。",
    imageUrl:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800",
    status: "Registered",
    similarityScore: 0.9,
  },
  {
    id: "t-002",
    type: SearchType.TRADEMARK,
    title: "NOVA",
    number: "TM-779014",
    owner: "Nova Audio Inc.",
    filingDate: "2022-07-11",
    issueDate: "2023-01-05",
    description: "用于可穿戴音频设备的文字商标。",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=800",
    status: "Registered",
    similarityScore: 0.86,
  },
  {
    id: "t-003",
    type: SearchType.TRADEMARK,
    title: "ARCABREW",
    number: "TM-766033",
    owner: "Arca Brew Co.",
    filingDate: "2021-11-29",
    issueDate: "2022-04-30",
    description: "用于咖啡与智能家电的混合图形商标。",
    imageUrl:
      "https://images.unsplash.com/photo-1504691342899-a3a364e0f3c0?auto=format&fit=crop&q=80&w=800",
    status: "Registered",
    similarityScore: 0.82,
  },
];

export async function mockSearch(
  imageBase64: string,
  config: SearchConfig
): Promise<ApiResponse<SearchResponse>> {
  void imageBase64;
  await delay(900);

  return {
    code: 0,
    data: {
      patents: config.patents ? mockPatents : [],
      trademarks: config.trademarks ? mockTrademarks : [],
    },
  };
}

export async function mockLogin(
  payload: AuthPayload
): Promise<ApiResponse<AuthResult>> {
  void payload;
  await delay(500);
  return { code: 0, data: { token: "mock-token" } };
}

export async function mockRegister(
  payload: RegisterPayload
): Promise<ApiResponse<AuthResult>> {
  void payload;
  await delay(600);
  return { code: 0, data: { token: "mock-token" } };
}

export async function mockRecharge(packageId: string) {
  await delay(400);
  const pkg = RECHARGE_PACKAGES.find((item) => item.id === packageId);

  if (!pkg) {
    return { code: 404, data: { credits: 0, amount: 0 }, message: "套餐不存在" };
  }

  return { code: 0, data: { credits: pkg.credits, amount: pkg.amount } };
}

export async function mockSendSms(phone: string) {
  void phone;
  await delay(400);
  return { code: 0, data: { sms: "123456" } };
}

export async function mockClearHistory() {
  await delay(200);
  return { code: 0, data: true };
}
