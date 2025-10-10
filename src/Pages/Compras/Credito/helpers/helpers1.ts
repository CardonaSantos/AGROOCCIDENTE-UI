import { TZGT } from "@/Pages/Utils/Utils";
import dayjs from "dayjs";
export const round2 = (n: number) => Math.round(n * 100) / 100;

export function addDaysISO(baseISO: string, d: number) {
  return dayjs(baseISO)
    .tz(TZGT)
    .add(d, "day")
    .startOf("day")
    .toDate()
    .toISOString();
}

export const toNumber = (v: string | number) =>
  typeof v === "string" ? Number(v.replace(/,/g, ".")) : v;
