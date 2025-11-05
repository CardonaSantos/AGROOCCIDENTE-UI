"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Wallet } from "lucide-react";
import { NormalizedCredito } from "../../interfaces/CreditoResponse";
import { creditColumns } from "./colums";

// ====== Props ======
interface Props {
  data: NormalizedCredito[];
  isLoading: boolean;

  // filtros / búsqueda (se manejan en el padre para SSR)
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // paginación (Server-Side)
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;

  // acciones
  onOpenCredit?: (c: NormalizedCredito) => void;
  onRegisterPayment?: (c: NormalizedCredito) => void;
  onOpenHistory?: (c: NormalizedCredito) => void;

  // alturas opcionales
  maxDesktopHeightPx?: number;
  maxMobileHeightPx?: number;
  //
  /** Permite mostrar u ocultar el botón de eliminar (según rol). */
  canDelete?: boolean;

  /** Abrir diálogo de confirmación desde la fila seleccionada. */
  onRequestDelete?: (c: NormalizedCredito) => void;
}

/** Barra de paginación compacta */
function PaginationBar({
  page,
  totalPages,
  totalCount,
  from,
  to,
  limit,
  onPageChange,
  onLimitChange,
  isDisabled,
  showPageSize = true,
  className = "",
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  from: number;
  to: number;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (n: number) => void;
  isDisabled: boolean;
  showPageSize?: boolean;
  className?: string;
}) {
  return (
    <div
      role="navigation"
      className={`flex flex-wrap items-center justify-between gap-2 p-2 border-t bg-muted/30 ${className}`}
    >
      <div className="text-xs text-muted-foreground">
        Mostrando <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> de{" "}
        <span className="font-medium">{totalCount}</span>
      </div>

      <div className="flex items-center gap-2">
        {showPageSize && (
          <>
            <label className="text-xs">Filas:</label>
            <select
              className="h-8 rounded-md border px-2 text-sm text-black"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              disabled={isDisabled}
            >
              {[5, 10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="mx-1 text-muted-foreground">|</span>
          </>
        )}

        <button
          type="button"
          className="h-8 rounded-md border px-2 text-sm disabled:opacity-50"
          onClick={() => onPageChange(1)}
          disabled={isDisabled || page <= 1}
          aria-label="Primera página"
          title="Primera"
        >
          «
        </button>
        <button
          type="button"
          className="h-8 rounded-md border px-3 text-sm disabled:opacity-50"
          onClick={() => onPageChange(page - 1)}
          disabled={isDisabled || page <= 1}
          aria-label="Página anterior"
          title="Anterior"
        >
          ←
        </button>

        <span className="text-sm tabular-nums">
          {page} / {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          className="h-8 rounded-md border px-3 text-sm disabled:opacity-50"
          onClick={() => onPageChange(page + 1)}
          disabled={isDisabled || page >= totalPages}
          aria-label="Página siguiente"
          title="Siguiente"
        >
          →
        </button>
        <button
          type="button"
          className="h-8 rounded-md border px-2 text-sm disabled:opacity-50"
          onClick={() => onPageChange(totalPages)}
          disabled={isDisabled || page >= totalPages}
          aria-label="Última página"
          title="Última"
        >
          »
        </button>
      </div>
    </div>
  );
}

export default function CreditTable({
  data,
  isLoading,
  search,
  onSearchChange,
  page,
  limit,
  totalPages,
  totalCount,
  onPageChange,
  onLimitChange,
  onOpenCredit,
  onRegisterPayment,
  onOpenHistory,
  maxDesktopHeightPx,
  maxMobileHeightPx,
  //
  canDelete,
  onRequestDelete,
}: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "estado", desc: false },
  ]);

  const table = useReactTable({
    data,
    columns: creditColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => `${row.id}`,
    meta: {
      onOpenCredit,
      onRegisterPayment,
      onOpenHistory,
      // NUEVO:
      onRequestDelete,
      canDelete,
    },
  });

  const hasData = Array.isArray(data) && data.length > 0;

  // Rango mostrado (1–10 de N)
  const from = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalCount);

  /** ====== Alturas estimadas para scroll por "limit" ====== */
  const ESTIMATED_HEADER_H = 44;
  const ESTIMATED_ROW_H = 56;
  const ESTIMATED_PADDING = 8;

  const computedBodyMaxH =
    ESTIMATED_HEADER_H +
    ESTIMATED_ROW_H * Math.max(5, limit) +
    ESTIMATED_PADDING;

  const desktopBodyMaxH = Math.min(
    maxDesktopHeightPx ?? computedBodyMaxH,
    Math.max(
      360,
      Math.round(
        0.72 * (typeof window === "undefined" ? 800 : window.innerHeight)
      )
    )
  );

  const mobileBodyMaxH = Math.min(
    maxMobileHeightPx ?? computedBodyMaxH,
    Math.max(
      300,
      Math.round(
        0.65 * (typeof window === "undefined" ? 640 : window.innerHeight)
      )
    )
  );

  // ====== Skeleton ======
  const renderSkeleton = (rows = 6) => (
    <tbody>
      {Array.from({ length: rows }).map((_, idx) => (
        <tr key={idx} className="animate-pulse">
          <td className="p-2 border-b">
            <Skeleton className="h-4 w-44" />
          </td>
          <td className="p-2 border-b">
            <Skeleton className="h-4 w-40" />
          </td>
          <td className="p-2 border-b">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="p-2 border-b">
            <Skeleton className="h-4 w-48" />
          </td>
          <td className="p-2 border-b">
            <Skeleton className="h-6 w-24" />
          </td>
          <td className="p-2 border-b">
            <Skeleton className="h-6 w-20" />
          </td>
        </tr>
      ))}
    </tbody>
  );

  return (
    <div className="w-full">
      {/* Filtros básicos */}
      <div className="mb-3 flex items-center gap-2">
        <Input
          placeholder="Buscar por cliente, DPI o número de crédito…"
          value={search}
          onChange={onSearchChange}
          className="h-8"
        />
        {/* Espacio para más filtros (estado, sucursal, fechas…) */}
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="hidden md:flex flex-col rounded-xl border bg-card">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          from={from}
          to={to}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          isDisabled={isLoading}
          showPageSize
          className="border-t-0"
        />

        <div className="overflow-y-auto" style={{ maxHeight: desktopBodyMaxH }}>
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="text-left">
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sort = header.column.getIsSorted();
                    const thClass =
                      (header.column.columnDef as any)?.meta?.thClass ?? "";
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

            {isLoading && renderSkeleton(limit)}

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
                    No se encontraron créditos.
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>

        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          from={from}
          to={to}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          isDisabled={isLoading}
          showPageSize={false}
        />
      </div>

      {/* ===== MOBILE ===== */}
      <div className="md:hidden">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          from={from}
          to={to}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          isDisabled={isLoading}
          showPageSize
          className="rounded-xl border bg-white"
        />
      </div>

      <div
        className="md:hidden space-y-2 overflow-y-auto rounded-xl border bg-white p-2"
        style={{ maxHeight: mobileBodyMaxH }}
      >
        {isLoading &&
          Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3">
              <Skeleton className="h-4 w-44 mb-2" />
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-3 w-60 mb-3" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}

        {!isLoading && hasData && (
          <AnimatePresence initial={false}>
            {data.map((c) => {
              const numero = c.numeroCredito ?? `#${c.id}`;
              const full = [c.cliente?.nombre, c.cliente?.apellidos]
                .filter(Boolean)
                .join(" ");
              const venta = c.montos.venta ?? 0;
              const pagado = c.montos.totalPagado ?? 0;
              const saldo = venta - pagado;
              const prox = c.cuotas?.proxima ?? null;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-lg border p-3 bg-white"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {numero} · {full || "—"}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                        <Badge variant="secondary">
                          {c.plan.frecuenciaPago}
                        </Badge>
                        <Badge variant="outline">
                          {c.plan.cuotasTotales} cuotas
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => onOpenCredit?.(c)}
                      className="rounded-lg px-3 py-2 text-xs"
                    >
                      Ver
                    </Button>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" /> Venta: Q{venta}
                    </div>
                    <div className="flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" /> Pagado: Q{pagado}
                    </div>
                    <div className="flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" /> Saldo: Q{saldo}
                    </div>
                  </div>

                  {prox && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        Próximo:{" "}
                        {new Date(prox.fechaVencimientoISO!).toLocaleDateString(
                          "es-GT"
                        )}
                      </span>
                      <Badge className="h-5 px-1.5 text-[10px]">
                        {prox.estado}
                      </Badge>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {!isLoading && !hasData && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground bg-white">
            No se encontraron créditos.
          </div>
        )}
      </div>

      <div className="md:hidden mt-2">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          from={from}
          to={to}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          isDisabled={isLoading}
          showPageSize={false}
          className="rounded-xl border bg-white"
        />
      </div>
    </div>
  );
}
