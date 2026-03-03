export const parseQueryLimit = (
  raw: string | null,
  fallback: number,
  max: number,
) => {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
};
