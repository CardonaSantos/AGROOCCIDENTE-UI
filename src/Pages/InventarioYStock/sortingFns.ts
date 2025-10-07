// utils/sortingFns.ts
import type { ColumnDef } from "@tanstack/react-table";
import { ddmmyyyyToTime, numFromStr } from "./tableFormatters";
import { ProductoInventarioResponse } from "./interfaces/InventaryInterfaces";

const collatorEs = new Intl.Collator("es", {
  sensitivity: "base",
  ignorePunctuation: true,
});

export const esTextSortingFn: ColumnDef<ProductoInventarioResponse>["sortingFn"] =
  (a, b, columnId) => {
    const A = String(a.getValue(columnId) ?? "");
    const B = String(b.getValue(columnId) ?? "");
    return collatorEs.compare(A, B);
  };

export const numericStringSortingFn: ColumnDef<ProductoInventarioResponse>["sortingFn"] =
  (a, b, columnId) => {
    const A = numFromStr(a.getValue(columnId) as any);
    const B = numFromStr(b.getValue(columnId) as any);
    if (Number.isNaN(A) && Number.isNaN(B)) return 0;
    if (Number.isNaN(A)) return 1;
    if (Number.isNaN(B)) return -1;
    return A - B;
  };

export const ddmmyyyySortingFn: ColumnDef<ProductoInventarioResponse>["sortingFn"] =
  (a, b, columnId) => {
    const A = ddmmyyyyToTime(a.getValue(columnId) as any);
    const B = ddmmyyyyToTime(b.getValue(columnId) as any);
    if (Number.isNaN(A) && Number.isNaN(B)) return 0;
    if (Number.isNaN(A)) return 1;
    if (Number.isNaN(B)) return -1;
    return A - B;
  };
