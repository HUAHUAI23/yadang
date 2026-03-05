const FEN_PER_YUAN = 100;

const ensureFinite = (value: number, message: string) => {
  if (!Number.isFinite(value)) {
    throw new Error(message);
  }
};

export function fenToYuan(value: bigint | number) {
  const fen = typeof value === "bigint" ? Number(value) : value;
  ensureFinite(fen, "金额超出可序列化范围");
  return Number((fen / FEN_PER_YUAN).toFixed(2));
}

export function yuanToFen(value: number) {
  ensureFinite(value, "金额格式无效");
  return BigInt(Math.round(value * FEN_PER_YUAN));
}

export function yuanToFenNumber(value: number) {
  ensureFinite(value, "金额格式无效");
  const fen = Math.round(value * FEN_PER_YUAN);
  ensureFinite(fen, "金额超出可序列化范围");
  return fen;
}

export function formatYuan(value: number) {
  ensureFinite(value, "金额格式无效");
  return value.toFixed(2);
}
