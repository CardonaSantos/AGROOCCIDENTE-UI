"use client";
import React from "react";
import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
  OnChangeFn,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  ChevronDown,
  ChevronRight,
  Package,
  MessageCircleWarning,
  Pencil,
} from "lucide-react";
import dayjs from "dayjs";
import { formattMoneda } from "../Utils/Utils";
import {
  PagedResponse,
  RequisitionProductCandidate,
  SelectedKey,
  SelectedLine,
  keyForProducto,
  keyForPresentacion,
} from "./newMap/requisicion.interfaces";
import { computePresentacionCostoUnitario } from "./helpers";

const toFixed2 = (n: number | string | null | undefined) => {
  const v = typeof n === "string" ? Number(n) : n ?? 0;
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
};

const normalizeDecimalStr2 = (s: string | undefined | null) => {
  const v = Number((s ?? "").toString().replace(",", "."));
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
};

type Props = {
  data: PagedResponse<RequisitionProductCandidate> | undefined;
  isLoading: boolean;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  q: string;
  onSearchChange: (q: string) => void;
  refetch: () => void;
  selected: Record<SelectedKey, SelectedLine>;
  setSelected: React.Dispatch<
    React.SetStateAction<Record<SelectedKey, SelectedLine>>
  >;
  onAfterSelectionChange?: () => void;
};

export default function RequisitionCandidatesTable(props: Props) {
  const {
    data,
    isLoading,
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
    q,
    onSearchChange,
    refetch,
    selected,
    setSelected,
    onAfterSelectionChange,
  } = props;

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  // === Selección ===
  const toggleProducto = (row: RequisitionProductCandidate) => {
    const k = keyForProducto(row.productoId);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[k]) {
        delete next[k];
      } else {
        next[k] = {
          scope: "PRODUCTO",
          productoId: row.productoId,
          cantidad: Math.max(1, row.faltanteSugerido || 1),
          fechaExpiracion: null,
          precioCostoUnitario: toFixed2(row.precioCostoProducto ?? 0),
          actualizarCosto: false,
        };
      }
      onAfterSelectionChange?.();
      return next;
    });
  };

  const togglePresentacion = (
    row: RequisitionProductCandidate,
    presentacionId: number
  ) => {
    const k = keyForPresentacion(presentacionId);
    const pres = row.presentaciones.find((x) => x.id === presentacionId)!;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[k]) {
        delete next[k];
      } else {
        const precio = computePresentacionCostoUnitario(
          pres.costoReferencialPresentacion,
          row.precioCostoProducto,
          pres.factorUnidadBase
        );
        next[k] = {
          scope: "PRESENTACION",
          productoId: row.productoId,
          presentacionId,
          cantidad: 1,
          fechaExpiracion: null,
          precioCostoUnitario: precio,
          actualizarCosto: false,
        };
      }
      onAfterSelectionChange?.();
      return next;
    });
  };

  const updateQty = (k: SelectedKey, qty: number) =>
    setSelected((prev) => ({
      ...prev,
      [k]: { ...prev[k], cantidad: Math.max(1, qty | 0) },
    }));

  const updateDate = (k: SelectedKey, val: string) => {
    setSelected((prev) => ({
      ...prev,
      [k]: { ...prev[k], fechaExpiracion: val },
    }));
  };

  const updatePrecio = (k: SelectedKey, v: string) =>
    setSelected((prev) => ({
      ...prev,
      [k]: { ...prev[k], precioCostoUnitario: normalizeDecimalStr2(v) },
    }));

  const toggleActualizarCosto = (k: SelectedKey, checked: boolean) =>
    setSelected((prev) => ({
      ...prev,
      [k]: { ...prev[k], actualizarCosto: checked },
    }));

  // === Columnas principales (compactas y centradas) ===
  const columns = React.useMemo<ColumnDef<RequisitionProductCandidate>[]>(
    () => [
      {
        id: "expander",
        header: () => null,
        size: 36,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={row.getToggleExpandedHandler()}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          ) : null,
      },
      {
        id: "select",
        header: () => (
          <div className="flex justify-center text-xs text-muted-foreground">
            SEL
          </div>
        ),
        size: 44,
        cell: ({ row }) => {
          const k = keyForProducto(row.original.productoId);
          return (
            <div className="flex justify-center">
              <Checkbox
                checked={!!selected[k]}
                onCheckedChange={() => toggleProducto(row.original)}
                aria-label="Seleccionar producto"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "nombre",
        header: () => <span className="text-sm">Producto</span>,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium leading-tight">{r.nombre}</span>
                {!!r.codigoProducto && (
                  <span className="text-[10px] text-muted-foreground">
                    {r.codigoProducto}
                  </span>
                )}
              </div>
              {(r.pendientesProductoFolios?.length ?? 0) > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <MessageCircleWarning className="text-red-500 cursor-pointer" />
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="space-y-2">
                      <h4 className="text-sm">
                        Requisiciones pendientes (producto)
                      </h4>
                      <ul className="text-xs">
                        {r.pendientesProductoFolios.map((f, i) => (
                          <li key={i}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        },
      },
      {
        id: "stock",
        header: () => <span className="text-sm">Stock</span>,
        size: 110,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground">
              mín: {row.original.stockMinimo}
            </span>
          </div>
        ),
      },
      {
        id: "qty-price",
        header: () => <span className="text-sm">Cant. / Precio</span>,
        size: 260,
        cell: ({ row }) => {
          const r = row.original;
          const k = keyForProducto(r.productoId);
          const sel = selected[k];
          const sugerido = toFixed2(r.precioCostoProducto);
          return sel ? (
            <div className="flex items-center gap-2 justify-center">
              <Input
                type="number"
                min={1}
                step={1}
                className="h-8 w-16 text-center text-sm"
                value={sel.cantidad || 1}
                onChange={(e) => updateQty(k, Number(e.target.value))}
                aria-label="Cantidad producto"
              />
              <div className="flex items-center gap-1">
                <Input
                  inputMode="decimal"
                  step="0.01"
                  className="h-8 w-24 text-right font-mono text-sm"
                  value={sel.precioCostoUnitario}
                  onChange={(e) => updatePrecio(k, e.target.value)}
                  aria-label="Precio costo unitario"
                />
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center">
              Sugerido: <span className="font-mono">Q {sugerido}</span>
            </div>
          );
        },
      },
      {
        id: "total",
        header: () => <span className="text-sm">Total</span>,
        size: 110,
        cell: ({ row }) => {
          const k = keyForProducto(row.original.productoId);
          const sel = selected[k];
          if (!sel) return <span className="text-muted-foreground">—</span>;
          const total =
            Number(sel.precioCostoUnitario || "0") * (sel.cantidad || 0);
          return (
            <div className="text-right font-medium text-sm">
              {formattMoneda(total)}
            </div>
          );
        },
      },
      {
        id: "fecha",
        header: () => <span className="text-sm">F. exp.</span>,
        size: 140,
        cell: ({ row }) => {
          const k = keyForProducto(row.original.productoId);
          const sel = selected[k];
          return sel ? (
            <div className="flex justify-center">
              <input
                type="date"
                className="h-8 w-36 text-center text-sm"
                value={
                  sel.fechaExpiracion
                    ? dayjs(sel.fechaExpiracion).format("YYYY-MM-DD")
                    : ""
                }
                onChange={(e) => updateDate(k, e.target.value)}
                aria-label="Fecha expiración"
              />
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "updCosto",
        header: () => <span className="text-sm">Act. Costo</span>,
        size: 70,
        cell: ({ row }) => {
          const k = keyForProducto(row.original.productoId);
          const sel = selected[k];
          return sel ? (
            <div className="flex justify-center">
              <Checkbox
                checked={!!sel.actualizarCosto}
                onCheckedChange={(v) => toggleActualizarCosto(k, !!v)}
                aria-label="Actualizar costo maestro"
              />
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
    ],
    [selected]
  );

  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const table = useReactTable({
    data: items,
    columns,
    state: { pagination, sorting, expanded },
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => row.original.presentaciones.length > 0,
    onPaginationChange,
    onSortingChange,
    onExpandedChange: setExpanded,
    pageCount: totalPages,
  });

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <div className="w-full sm:max-w-sm">
          <Input
            placeholder="Buscar por código o nombre…"
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={refetch}>
          Refrescar
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table className="w-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className="align-middle"
                    style={{
                      width: h.getSize() ? `${h.getSize()}px` : undefined,
                    }}
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8"
                >
                  Cargando…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8"
                >
                  Sin resultados
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const prodKey = keyForProducto(row.original.productoId);
                const prodSelected = !!selected[prodKey];

                return (
                  <React.Fragment key={row.id}>
                    {/* Fila principal */}
                    <TableRow
                      data-state={row.getIsExpanded() ? "open" : undefined}
                      className={prodSelected ? "bg-muted/50" : ""}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="align-middle">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Fila expandida */}
                    {row.getIsExpanded() && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={columns.length} className="py-2">
                          <div className="space-y-1">
                            {row.original.presentaciones.map((pp) => {
                              const presKey = keyForPresentacion(pp.id);
                              const presSel = selected[presKey];
                              const pend = pp.pendientesFolios?.length ?? 0;
                              const costoSug = computePresentacionCostoUnitario(
                                pp.costoReferencialPresentacion,
                                row.original.precioCostoProducto,
                                pp.factorUnidadBase
                              );

                              return (
                                <div
                                  key={pp.id}
                                  className="
                                    grid items-center gap-x-3 gap-y-1 py-1
                                    grid-cols-[24px_minmax(0,1fr)_110px_70px_96px_132px_60px]
                                    md:grid-cols-[24px_minmax(0,1fr)_120px_80px_110px_150px_70px]
                                  "
                                >
                                  {/* checkbox */}
                                  <div className="flex justify-center">
                                    <Checkbox
                                      checked={!!presSel}
                                      onCheckedChange={() =>
                                        togglePresentacion(row.original, pp.id)
                                      }
                                      aria-label="Seleccionar presentación"
                                    />
                                  </div>

                                  {/* nombre + meta (left) */}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium truncate">
                                        {pp.nombre}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px]"
                                      >
                                        {pp.tipoPresentacion}
                                      </Badge>
                                      {pend > 0 && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <MessageCircleWarning className="text-red-500 cursor-pointer w-4 h-4" />
                                          </PopoverTrigger>
                                          <PopoverContent className="w-72">
                                            <h4 className="text-sm mb-1">
                                              Requisiciones pendientes
                                            </h4>
                                            <ul className="text-xs space-y-0.5">
                                              {pp.pendientesFolios.map(
                                                (f, i) => (
                                                  <li key={i}>• {f}</li>
                                                )
                                              )}
                                            </ul>
                                          </PopoverContent>
                                        </Popover>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      Factor: {pp.factorUnidadBase} • Stock
                                      Pres: {pp.stockCantidadPresentacion} •
                                      Eq/base: {pp.stockEquivalenteBase}
                                    </div>
                                  </div>

                                  {/* costo sugerido (centrado) */}
                                  <div className="text-xs text-muted-foreground text-center justify-self-center">
                                    Costo: Q {toFixed2(costoSug)}
                                  </div>

                                  {/* qty (centrado) */}
                                  <div className="justify-self-center">
                                    {presSel ? (
                                      <Input
                                        type="number"
                                        min={1}
                                        step={1}
                                        className="h-8 w-16 text-center text-sm"
                                        value={presSel.cantidad || 1}
                                        onChange={(e) =>
                                          updateQty(
                                            presKey,
                                            Number(e.target.value)
                                          )
                                        }
                                        aria-label="Cantidad presentación"
                                      />
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </div>

                                  {/* precio (centrado) */}
                                  <div className="justify-self-center">
                                    {presSel ? (
                                      <Input
                                        inputMode="decimal"
                                        step="0.01"
                                        className="h-8 w-24 text-right font-mono text-sm"
                                        value={presSel.precioCostoUnitario}
                                        onChange={(e) =>
                                          updatePrecio(presKey, e.target.value)
                                        }
                                        aria-label="Precio costo presentación"
                                      />
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </div>

                                  {/* fecha (centrado) */}
                                  <div className="justify-self-center">
                                    {presSel ? (
                                      <Input
                                        type="date"
                                        className="h-8 w-36 text-center text-sm"
                                        value={
                                          presSel.fechaExpiracion
                                            ? dayjs(
                                                presSel.fechaExpiracion
                                              ).format("YYYY-MM-DD")
                                            : ""
                                        }
                                        onChange={(e) =>
                                          updateDate(presKey, e.target.value)
                                        }
                                        aria-label="Fecha expiración presentación"
                                      />
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </div>

                                  {/* actualizar costo (centrado) */}
                                  <div className="flex justify-center">
                                    {presSel ? (
                                      <Checkbox
                                        checked={!!presSel.actualizarCosto}
                                        onCheckedChange={(v) =>
                                          toggleActualizarCosto(presKey, !!v)
                                        }
                                        aria-label="Actualizar costo presentación"
                                      />
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-muted-foreground">
          Mostrando página {pagination.pageIndex + 1} de {totalPages} • Total{" "}
          {total} productos
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.pageIndex === 0}
            onClick={() =>
              onPaginationChange((old) => ({
                ...old,
                pageIndex: old.pageIndex - 1,
              }))
            }
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.pageIndex + 1 >= totalPages}
            onClick={() =>
              onPaginationChange((old) => ({
                ...old,
                pageIndex: old.pageIndex + 1,
              }))
            }
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
