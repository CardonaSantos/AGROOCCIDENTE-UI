// utils/tableFormatters.ts
export const ddmmyyyyToTime = (s?: string | null) => {
  if (!s) return NaN; // inválida
  // ej: "26-09-2025"
  const [d, m, y] = s.split("-").map(Number);
  if (!d || !m || !y) return NaN;
  return new Date(y, m - 1, d).getTime();
};

export const numFromStr = (v?: string | null): number => {
  if (v == null) return NaN;
  // acepta "123.45" o "123,45"
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

export const sumBy = <T>(arr: T[], sel: (t: T) => number) =>
  arr.reduce((acc, x) => acc + (Number(sel(x)) || 0), 0);
