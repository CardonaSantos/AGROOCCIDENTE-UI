export function toInt(n: unknown, def = 0): number {
  const v = Number(n);
  return Number.isFinite(v) ? Math.trunc(v) : def;
}
export function toMoney(n: unknown, def = 0): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return def;
  // redondeo a 2 decimales sin “string tricks”
  return Math.round(v * 100) / 100;
}
