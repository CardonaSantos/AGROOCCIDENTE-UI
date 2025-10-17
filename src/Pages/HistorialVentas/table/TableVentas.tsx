// components/ventas/table/TableVentas.tsx
import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { columnsVentas } from "./columnsVentas";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  PaginationMeta,
  VentaResumen,
  VentasApiResponse,
} from "../interfaces/VentasHistorialResponse";
import { formattMonedaGT } from "@/utils/formattMoneda";

type Props = {
  pageData: VentasApiResponse; // { data, meta } siempre presente
  isLoading: boolean;
  onSortChange: (
    sortBy: PaginationMeta["sortBy"],
    sortDir: PaginationMeta["sortDir"]
  ) => void;
  onViewVenta: (v: VentaResumen) => void;
  onDeleteVenta: (v: VentaResumen) => void;
};

/** Skeleton UI para carga */
const SkeletonRows = ({ rows = 8 }: { rows?: number }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, idx) => (
      <tr key={idx} className="animate-pulse">
        {Array.from({ length: 7 }).map((__, c) => (
          <td key={c} className="p-3 border-b">
            <Skeleton className="h-4 w-[80%]" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export default function TableVentas({
  pageData,
  isLoading,
  onSortChange,
  onViewVenta,
  onDeleteVenta,
}: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Sincroniza estado de sorting local con server meta
  React.useEffect(() => {
    const m = pageData.meta;
    if (m?.sortBy && m?.sortDir) {
      setSorting([{ id: m.sortBy, desc: m.sortDir === "desc" }]);
    }
  }, [pageData.meta?.sortBy, pageData.meta?.sortDir]);

  const table = useReactTable({
    data: pageData.data ?? [],
    columns: columnsVentas,
    getRowId: (row) => `venta-${row.id}`,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      const s = next?.[0];
      if (s) {
        onSortChange(s.id as any, s.desc ? "desc" : "asc");
      } else {
        // default del backend
        onSortChange("fechaVenta", "desc");
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // sólo para iconos; sort real es server-side
    manualSorting: true,
    meta: {
      onView: onViewVenta,
      onDelete: onDeleteVenta,
    },
  });

  const hasData = (pageData?.data?.length ?? 0) > 0;

  return (
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border bg-white dark:bg-zinc-900">
        <table className="min-w-full text-sm">
          {/* Header */}
          <thead className="bg-muted/40">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="text-left">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sort = header.column.getIsSorted(); // false | 'asc' | 'desc'
                  const thClass =
                    (header.column.columnDef.meta as any)?.thClass ?? "";
                  return (
                    <th
                      key={header.id}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      className={`px-3 py-2 font-semibold select-none ${
                        canSort ? "cursor-pointer hover:bg-muted/60" : ""
                      } ${thClass}`}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {sort === "asc" && <span>▲</span>}
                        {sort === "desc" && <span>▼</span>}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {isLoading && <SkeletonRows rows={8} />}

          {!isLoading && hasData && (
            <tbody>
              <AnimatePresence initial={false}>
                {table.getRowModel().rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="hover:bg-muted/30"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2 border-t align-top"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          )}

          {!isLoading && !hasData && (
            <tbody>
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No se encontraron ventas con ese criterio.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border p-3 bg-white dark:bg-zinc-900"
            >
              <Skeleton className="h-4 w-44 mb-2" />
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-3 w-60 mb-3" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}

        {!isLoading &&
          hasData &&
          pageData.data.map((v) => (
            <div
              key={`venta-${v.id}`}
              className="rounded-xl border p-3 bg-white dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    #{v.id} — {v.clienteNombre ?? "CF"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {/* Usa tu formateador si quieres */}
                    {new Date(v.fecha).toLocaleDateString()} •{" "}
                    {new Date(v.hora).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => table.options.meta?.onView?.(v)}
                >
                  Ver
                </Button>
              </div>

              <div className="mt-2 text-sm">
                Total:{" "}
                <span className="font-semibold">
                  {v.total.toFixed(2)
                    ? formattMonedaGT(v.total)
                    : formattMonedaGT(Number(v.total || 0))}
                </span>
              </div>
            </div>
          ))}

        {!isLoading && !hasData && (
          <div className="rounded-xl border p-6 text-center text-muted-foreground bg-white dark:bg-zinc-900">
            No se encontraron ventas.
          </div>
        )}
      </div>
    </div>
  );
}
