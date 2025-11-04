// table/table.tsx
import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import type { ProductoInventarioResponse } from "../interfaces/InventaryInterfaces";
import { makeColumnsInventario } from "./column";

type Props = {
  data: ProductoInventarioResponse[];
  columns?: ColumnDef<ProductoInventarioResponse, any>[];
  setPagination: React.Dispatch<
    React.SetStateAction<{
      pageIndex: number;
      pageSize: number;
    }>
  >;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  meta: {
    totalCount: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  rolUser: string;
};

function TableInventario({
  data,
  setPagination,
  pagination,
  meta,
  rolUser,
}: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const pageCount =
    meta?.totalPages ??
    Math.max(
      1,
      Math.ceil((meta?.totalCount ?? 0) / (meta?.limit ?? pagination.pageSize))
    );

  const columns = React.useMemo(
    () => makeColumnsInventario(rolUser),
    [rolUser]
  );

  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: true,
    pageCount,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {},
  });
  console.log("inventario: ", data);

  return (
    <div className="w-full rounded-lg border overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 sticky top-0 z-10">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  onClick={h.column.getToggleSortingHandler()}
                  className="px-2 py-1.5 text-left select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {({ asc: "▲", desc: "▼" } as const)[
                      h.column.getIsSorted() as "asc" | "desc"
                    ] ?? null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <motion.tbody
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.02 },
            },
          }}
        >
          {table.getRowModel().rows.map((row) => (
            <motion.tr
              key={row.id}
              variants={{
                hidden: { opacity: 0, y: 6 },
                visible: { opacity: 1, y: 0 },
              }}
              className="border-t"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1.5 align-middle">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </motion.tr>
          ))}
        </motion.tbody>
      </table>

      {/* Controles de paginación compactos */}
      <div className="flex items-center gap-2 p-2">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          «
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          ‹
        </button>
        <span className="px-1">
          {table.getState().pagination.pageIndex + 1} / {Math.max(1, pageCount)}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          ›
        </button>
        <button
          onClick={() => table.setPageIndex(Math.max(0, pageCount - 1))}
          disabled={!table.getCanNextPage()}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          »
        </button>

        <select
          className="ml-auto border rounded px-2 py-1"
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map((ps) => (
            <option key={ps} value={ps}>
              {ps}/pág
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default TableInventario;
