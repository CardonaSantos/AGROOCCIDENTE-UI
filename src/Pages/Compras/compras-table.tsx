"use client";

import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
} from "lucide-react";
import { comprasColumns } from "./columns";
import { ComprasDetailDialog } from "./compras-detail-dialog";
import { CompraListItem } from "./Interfaces/Interfaces1";

type PropsComprasTable = {
  data: CompraListItem[];
  page: number; // 1-based
  limit: number;
  pages: number; // total de páginas (server)
  total: number; // total de registros (server)
  loading?: boolean;
  onChangePage: (p: number) => void;
  onChangeLimit: (l: number) => void;
};

const tableVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, staggerChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.15 } },
};

export function ComprasTable({
  data,
  limit,
  onChangeLimit,
  onChangePage,
  page,
  pages,
  total,
  loading,
}: PropsComprasTable) {
  const [selected, setSelected] = React.useState<CompraListItem | null>(null);
  const [openDetalle, setOpenDetalle] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);

  // Memo data para no recrear referencias en renders
  const tableData = React.useMemo(() => data, [data]);

  const table = useReactTable<CompraListItem>({
    data: tableData,
    columns: comprasColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: Math.max(0, page - 1), // TanStack usa base 0
        pageSize: limit,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: Math.max(0, page - 1), pageSize: limit })
          : updater;

      if (next.pageSize !== limit) onChangeLimit(next.pageSize);
      if (next.pageIndex !== Math.max(0, page - 1))
        onChangePage(next.pageIndex + 1);
    },

    // Paginación server-side
    manualPagination: true,
    pageCount: pages,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),

    // callback para abrir detalle desde las celdas/acciones en columns
    meta: {
      onOpenDetalle: (row: CompraListItem) => {
        setSelected(row);
        setOpenDetalle(true);
      },
    },
  });

  const activeFiltersCount = columnFilters.length + (globalFilter ? 1 : 0);

  const clearAllFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
  };

  return (
    <motion.div
      className="space-y-3"
      initial="hidden"
      animate="visible"
      variants={tableVariants}
    >
      {/* Header */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                {" "}
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />{" "}
                <Input
                  placeholder="Buscar compras..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-7 h-8 text-xs"
                />{" "}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="relative h-8 text-xs"
                aria-expanded={showFilters}
                aria-controls="compras-filters"
              >
                <Filter className="h-3 w-3 mr-1" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 h-4 w-4 p-0 text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground h-8 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabla */}
      <Card aria-busy={!!loading}>
        {/* Barra de carga sutil cuando loading=true */}
        {loading && (
          <div className="h-0.5 w-full bg-primary/10">
            <div className="h-0.5 w-1/2 animate-[shimmer_1.2s_infinite] bg-primary/60" />
          </div>
        )}

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <motion.table className="w-full text-xs" variants={tableVariants}>
              <thead className="bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="text-left py-2 px-2 font-medium cursor-pointer select-none hover:bg-muted/80 transition-colors text-xs"
                        style={{ width: header.getSize() }}
                        scope="col"
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          <div className="flex flex-col">
                            {(
                              {
                                asc: (
                                  <span className="text-primary text-xs">
                                    ↑
                                  </span>
                                ),
                                desc: (
                                  <span className="text-primary text-xs">
                                    ↓
                                  </span>
                                ),
                              } as Record<string, React.ReactNode>
                            )[header.column.getIsSorted() as string] ?? (
                              <span className="text-muted-foreground opacity-50 text-xs">
                                ↕
                              </span>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {showFilters && header.column.getCanFilter() && (
                            <motion.div
                              id="compras-filters"
                              className="mt-1"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Input
                                value={
                                  (header.column.getFilterValue() as string) ??
                                  ""
                                }
                                onChange={(e) =>
                                  header.column.setFilterValue(e.target.value)
                                }
                                placeholder="Filtrar columna…"
                                className="h-6 text-xs"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                <AnimatePresence mode="popLayout">
                  {table.getRowModel().rows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="border-b hover:bg-muted/50 transition-colors"
                      style={{ animationDelay: `${index * 0.03}s` }}
                      data-rowid={(row.original as CompraListItem).id}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="py-1.5 px-2"
                          style={{ width: cell.column.getSize() }}
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
            </motion.table>
          </div>

          {table.getRowModel().rows.length === 0 && (
            <motion.div
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-muted-foreground">
                <div className="text-2xl mb-2">📦</div>
                <div className="text-sm font-medium">
                  No se encontraron compras
                </div>
                <div className="text-xs">
                  {globalFilter || columnFilters.length > 0
                    ? "Intenta ajustar los filtros"
                    : "No hay registros disponibles"}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {data.length > 0 && (
        <Card>
          <CardContent className="py-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {total === 0 ? "0-0" : (page - 1) * limit + 1} -{" "}
                  {Math.min(page * limit, total)} de {total}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChangePage(1)}
                    disabled={page <= 1 || loading}
                    className="h-7 w-7 p-0"
                    aria-label="Primera página"
                  >
                    <ChevronsLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChangePage(page - 1)}
                    disabled={page <= 1 || loading}
                    className="h-7 w-7 p-0"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-1 mx-2">
                    <span className="text-xs">Pág.</span>
                    <Badge variant="outline" className="text-xs px-1">
                      {page}/{Math.max(1, pages)}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChangePage(page + 1)}
                    disabled={page >= pages || loading}
                    className="h-7 w-7 p-0"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChangePage(pages)}
                    disabled={page >= pages || loading}
                    className="h-7 w-7 p-0"
                    aria-label="Última página"
                  >
                    <ChevronsRight className="h-3 w-3" />
                  </Button>
                </div>

                <select
                  className="border rounded px-1 py-0.5 text-xs bg-background h-7"
                  value={limit}
                  onChange={(e) => onChangeLimit(Number(e.target.value))}
                  disabled={loading}
                  aria-label="Tamaño de página"
                >
                  {[5, 10, 15, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ComprasDetailDialog
        open={openDetalle}
        onOpenChange={setOpenDetalle}
        compra={selected}
      />
    </motion.div>
  );
}
