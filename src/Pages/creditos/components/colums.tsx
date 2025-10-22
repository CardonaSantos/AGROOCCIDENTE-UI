import { createColumnHelper } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";

import { NormalizedSolicitud } from "@/Pages/NewDashboard/credit-authorizations/interfaces/Interfaces.interfaces";

/** Meta que inyecta TablePOS a la tabla (para acciones) */
declare module "@tanstack/table-core" {
  interface TableMeta<TData extends unknown> {
    // onAddToCart?: (p: ProductoData) => void;
    // onPreviewImages?: (images: string[]) => void;
  }
}

const columnHelper = createColumnHelper<NormalizedSolicitud>();

export const columnTableCreditos: ColumnDef<NormalizedSolicitud, any>[] = [
  columnHelper.display({
    id: "precios",
    header: "Precios",
    meta: { thClass: "w-[22%]" },
  }),
];
