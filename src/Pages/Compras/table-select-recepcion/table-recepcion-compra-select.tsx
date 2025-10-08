"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { columnsDetallesSelect } from "./columns";
import { DetalleRecepcionable } from "../ResumenRecepcionParcial/Interfaces/detalleRecepcionable";
import {
  ItemDetallesPayloadParcial,
  PayloadRecepcionParcial,
} from "./selectedItems";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { flexRender } from "@tanstack/react-table";

interface PropsTable {
  detalles: DetalleRecepcionable[];
  upsserSelectItems: (
    item: ItemDetallesPayloadParcial,
    checked: boolean
  ) => void;
  selectedItems: PayloadRecepcionParcial;
  selectedIds: Set<number>;
  updateCantidadDetalle: (
    compraDetalleId: number,
    nuevaCantidad: number
  ) => void;

  updateFechaVencimiento: (
    compraDetalleId: number,
    nuevaFechaVencimiento: string
  ) => void;
}

const COL_W: Record<string, string> = {
  select: "w-8",
  nombre: "w-[42%]",
  cantidad: "w-24",
  costoUnitario: "w-28",
  codigo: "w-32", // hidden en <md>
  tipo: "w-24", // hidden en <lg>
  pendiente: "w-20",
  estado: "w-28",
};

export default function TableRecepcionCompraSelect({
  detalles,
  selectedItems,
  upsserSelectItems,
  selectedIds,
  updateCantidadDetalle,
  updateFechaVencimiento,
}: PropsTable) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "nombre", desc: false },
  ]);

  const columns = React.useMemo(
    () =>
      columnsDetallesSelect({
        upsserSelectItems,
        selectedItems,
        selectedIds,
        updateCantidadDetalle,
        updateFechaVencimiento,
      }),
    [
      upsserSelectItems,
      selectedItems,
      selectedIds,
      updateCantidadDetalle,
      updateFechaVencimiento,
    ]
  );

  const table = useReactTable({
    data: detalles ?? [],
    columns,
    state: { globalFilter, sorting },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedCount = selectedIds.size;

  const clearSelection = React.useCallback(() => {
    selectedItems.lineas.forEach((li) => upsserSelectItems(li, false));
  }, [selectedItems, upsserSelectItems]);

  return (
    <div className="rounded-2xl border bg-card">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar por nombre o código"
            placeholder="Buscar por nombre o código..."
            className="h-9 pl-9 text-sm"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="h-6 px-2 text-[11px]">
            Seleccionados: {selectedCount}
          </Badge>
          {selectedCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-8 px-2"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        {/* Compacta: text-xs, menor padding, table-fixed en móviles  */}
        <Table className="w-full table-fixed md:table-auto text-xs">
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => {
                  const id = h.column.id ?? h.id;
                  return (
                    <TableHead
                      key={h.id}
                      className={[
                        "h-9 px-2 py-1 align-middle whitespace-nowrap",
                        h.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : "",
                        id === "costoUnitario" ||
                        id === "pendiente" ||
                        id === "fechaVencimiento" ||
                        id === "cantidad" ||
                        id === "estado"
                          ? "text-right"
                          : "text-left",
                        id === "codigo" ? "hidden md:table-cell" : "",
                        id === "tipo" ? "hidden lg:table-cell" : "",
                        COL_W[id] ?? "",
                      ].join(" ")}
                      onClick={
                        h.column.getCanSort()
                          ? h.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="px-2 py-6 text-center text-muted-foreground"
                >
                  No hay líneas para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  className={[
                    "hover:bg-muted/40",
                    i % 2 === 1 ? "bg-muted/20" : "",
                    "h-11",
                  ].join(" ")}
                >
                  {row.getVisibleCells().map((cell) => {
                    const id = cell.column.id;
                    return (
                      <TableCell
                        key={cell.id}
                        className={[
                          "px-2 py-1 align-middle",
                          id === "costoUnitario" ||
                          id === "pendiente" ||
                          id === "fechaVencimiento" ||
                          id === "cantidad" ||
                          id === "estado"
                            ? "text-right tabular-nums"
                            : "",
                          id === "codigo" ? "hidden md:table-cell" : "",
                          id === "tipo" ? "hidden lg:table-cell" : "",
                          COL_W[id] ?? "",
                        ].join(" ")}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer mini-info */}
      <div className="flex items-center justify-between p-2 text-[11px] text-muted-foreground">
        <span>Líneas: {table.getRowModel().rows.length}</span>
        <span>
          Orden:{" "}
          {sorting[0] ? `${sorting[0].id} ${sorting[0].desc ? "▼" : "▲"}` : "—"}
        </span>
      </div>
    </div>
  );
}
