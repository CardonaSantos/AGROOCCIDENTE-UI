"use client";

import React, { useMemo, useState } from "react";
import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package2,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  BadgeDollarSign,
  ListFilter,
} from "lucide-react";

import type {
  ProductoToPedidoList,
  ProductoPresentacionToPedido,
} from "../Interfaces/productsList.interfaces";
import type { PedidoLineaUI } from "./CreatePedidoCard";

/** === Helpers de llave estable por línea === */
const keyFor = (l: PedidoLineaUI) =>
  l.tipo === "PRODUCTO" ? `P-${l.productoId}` : `PP-${l.presentacionId}`;
const rowKeyForProduct = (productoId: number) => `P-${productoId}`;
const rowKeyForPres = (presentacionId: number) => `PP-${presentacionId}`;

type Props = {
  productos: ProductoToPedidoList[];
  selectedLines: PedidoLineaUI[];
  onToggleProduct: (productoId: number, checked: boolean) => void;
  onTogglePresentacion: (
    productoId: number,
    presentacionId: number,
    checked: boolean
  ) => void;
  onQtyChange: (rowKey: string, qty: number | null) => void;
  onPriceChange: (rowKey: string, price?: number | null) => void;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  handleChangeFechaVencimiento: (rowKey: string, date: string) => void;
  toggleActPrecioProduct: (rowKey: string, checked: boolean) => void;
};

/** === Popover compacto para ver stock por sucursal === */
const StockCell: React.FC<{
  stockPorSucursal: {
    sucursalId: number;
    sucursalNombre: string;
    cantidad: number;
  }[];
}> = ({ stockPorSucursal }) => {
  const total = useMemo(
    () => stockPorSucursal.reduce((a, s) => a + (s.cantidad || 0), 0),
    [stockPorSucursal]
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          aria-label="Ver stock por sucursal"
        >
          <Badge variant="outline" className="font-medium tabular-nums">
            {total}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56">
        <div className="text-xs text-muted-foreground mb-2">
          Stock por sucursal
        </div>
        <div className="space-y-1">
          {stockPorSucursal.map((s) => (
            <div
              key={s.sucursalId}
              className="flex items-center justify-between text-sm"
            >
              <span className="truncate">{s.sucursalNombre}</span>
              <span className="font-medium tabular-nums">{s.cantidad}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function ProductsList({
  productos,
  selectedLines,
  onToggleProduct,
  onTogglePresentacion,
  onQtyChange,
  onPriceChange,
  search,
  setSearch,
  handleChangeFechaVencimiento,
  toggleActPrecioProduct,
}: Props) {
  /** === Estado de filas expandidas (presentaciones) === */
  const [expanded, setExpanded] = useState<ExpandedState>({});

  /** === Drafts locales para UX (mientras se escribe) === */
  const [drafts, setDrafts] = useState<
    Record<string, { qty?: string; price?: string }>
  >({});

  /** === Selectores auxiliares con selectedLines === */
  const isProductChecked = (productoId: number) =>
    selectedLines.some(
      (l) => l.tipo === "PRODUCTO" && l.productoId === productoId
    );

  const isPresChecked = (productoId: number, presentacionId: number) =>
    selectedLines.some(
      (l) =>
        l.tipo === "PRESENTACION" &&
        l.productoId === productoId &&
        l.presentacionId === presentacionId
    );

  const qtyOfKey = (rowKey: string) =>
    selectedLines.find(
      (l) =>
        (l.tipo === "PRODUCTO" && rowKey === rowKeyForProduct(l.productoId)) ||
        (l.tipo === "PRESENTACION" &&
          rowKey === rowKeyForPres(l.presentacionId!))
    )?.cantidad;

  const priceOfKey = (rowKey: string) =>
    selectedLines.find(
      (l) =>
        (l.tipo === "PRODUCTO" && rowKey === rowKeyForProduct(l.productoId)) ||
        (l.tipo === "PRESENTACION" &&
          rowKey === rowKeyForPres(l.presentacionId!))
    )?.precioUnitarioOverride ?? null;

  /**
   * Tamaños (en px) de columnas NO elásticas.
   * Dejamos la columna "Producto" sin size para que absorba/responda.
   */
  const COL = {
    EXPAND: 28,
    SELECT: 40,
    STOCK: 60,
    QTY_PRICE: 220,
    FECHA: 120,
    ACT: 56,
    TOTAL: 96,
  } as const;

  /** === Columnas (compactas + responsivas) === */
  const columns = useMemo<ColumnDef<ProductoToPedidoList>[]>(() => {
    return [
      {
        id: "expander",
        header: () => null,
        size: COL.EXPAND,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={row.getToggleExpandedHandler()}
              aria-label={row.getIsExpanded() ? "Contraer" : "Expandir"}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : null,
      },
      {
        id: "select",
        header: () => (
          <div className="flex justify-center text-[10px] text-muted-foreground select-none">
            SEL
          </div>
        ),
        size: COL.SELECT,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex justify-center">
              <Checkbox
                checked={isProductChecked(p.id)}
                onCheckedChange={(ck) => onToggleProduct(p.id, Boolean(ck))}
                aria-label="Seleccionar producto"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "nombre",
        header: () => <span className="text-xs sm:text-sm">Producto</span>,
        // sin size => flexible
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-start gap-2 min-w-0">
              <Package2 className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="truncate font-medium leading-tight">
                  {p.nombre}
                </div>
                {!!p.descripcion && (
                  <div className="text-xs text-muted-foreground truncate leading-tight">
                    {p.descripcion}
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground leading-tight">
                  Código: {p.codigoProducto} · Unidad: {p.unidadBase}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "stock",
        header: () => <span className="text-xs sm:text-sm">Stock</span>,
        size: COL.STOCK,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <StockCell stockPorSucursal={row.original.stockPorSucursal} />
          </div>
        ),
      },
      {
        id: "qty-price",
        header: () => (
          <div className="flex items-center justify-center gap-1 text-xs sm:text-sm">
            <span className="hidden sm:inline">Cant.</span>/<span>Precio</span>
          </div>
        ),
        size: COL.QTY_PRICE,
        cell: ({ row }) => {
          const p = row.original;
          const rk = rowKeyForProduct(p.id);
          const checked = isProductChecked(p.id);

          const qtySel = qtyOfKey(rk);
          const qtyDisplay =
            drafts[rk]?.qty ?? (qtySel !== undefined ? String(qtySel) : "");

          const priceOverride = priceOfKey(rk); // number | null
          const displayPrice =
            drafts[rk]?.price ?? ((priceOverride ?? "") as string | number);

          // Si NO está marcado "actualizarCosto" => se bloquea el input de precio
          const checkedChangeActPrecio =
            selectedLines.find((l) => rowKeyForProduct(p.id) === keyFor(l))
              ?.actualizarCosto || false;
          const disablePrice = checked && checkedChangeActPrecio === false;

          return (
            <div className="flex items-center justify-center gap-2">
              <Input
                type="number"
                min={1}
                disabled={!checked}
                value={checked ? qtyDisplay : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setDrafts((prev) => ({
                    ...prev,
                    [rk]: { ...prev[rk], qty: v },
                  }));
                  const next =
                    v === ""
                      ? null
                      : Number.isFinite(Number(v))
                      ? Number(v)
                      : null;
                  onQtyChange(rk, next);
                }}
                className="h-8 w-14 text-center text-xs font-mono tabular-nums"
                placeholder="Cant."
                aria-label="Cantidad producto"
              />

              {/* Precio con icono monetario a la izquierda */}
              <div className="relative">
                <BadgeDollarSign className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  disabled={disablePrice}
                  value={checked ? displayPrice : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDrafts((prev) => ({
                      ...prev,
                      [rk]: { ...prev[rk], price: v },
                    }));
                    const num =
                      v === ""
                        ? null
                        : Number.isFinite(Number(v))
                        ? Number(v)
                        : null;
                    onPriceChange(rk, num);
                  }}
                  className="h-8 w-24 pl-7 text-right text-xs font-mono tabular-nums"
                  placeholder={`Q ${p.precioCostoActual.toFixed(2)}`}
                  aria-label="Precio costo unitario"
                />
              </div>
            </div>
          );
        },
      },
      {
        id: "fecha",
        header: () => (
          <div className="flex items-center justify-center gap-1 text-xs sm:text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="hidden md:inline">F. Cad</span>
            <span className="md:hidden">Cad</span>
          </div>
        ),
        size: COL.FECHA,
        cell: ({ row }) => {
          const p = row.original;
          const checked = isProductChecked(p.id);
          return (
            <div className="flex justify-center">
              <input
                type="date"
                disabled={!checked}
                value={
                  selectedLines.find(
                    (l) => keyFor(l) === rowKeyForProduct(p.id)
                  )?.fechaVencimiento || ""
                }
                onChange={(e) =>
                  handleChangeFechaVencimiento(
                    rowKeyForProduct(p.id),
                    e.target.value
                  )
                }
                className="h-8 w-28 px-2 rounded-md border bg-background text-foreground text-xs text-center"
                aria-label="Fecha de caducidad"
              />
            </div>
          );
        },
      },
      {
        id: "updCosto",
        header: () => <span className="text-xs sm:text-sm">Act.</span>,
        size: COL.ACT,
        cell: ({ row }) => {
          const p = row.original;
          const rk = rowKeyForProduct(p.id);
          const checked = isProductChecked(p.id);
          const checkedChangeActPrecio =
            selectedLines.find((l) => rk === keyFor(l))?.actualizarCosto ||
            false;
          return (
            <div className="flex justify-center">
              <Checkbox
                checked={checked ? checkedChangeActPrecio : false}
                onCheckedChange={(ck) =>
                  toggleActPrecioProduct(rk, Boolean(ck))
                }
                aria-label="Actualizar costo maestro"
              />
            </div>
          );
        },
      },
      {
        id: "total",
        header: () => <span className="text-xs sm:text-sm">Total</span>,
        size: COL.TOTAL,
        cell: ({ row }) => {
          const p = row.original;
          const rk = rowKeyForProduct(p.id);
          const qty = qtyOfKey(rk) || 0;
          const price = (priceOfKey(rk) ?? p.precioCostoActual) || 0;
          const total = qty * price;
          return (
            <div className="text-right font-medium text-xs tabular-nums">
              Q {Number.isFinite(total) ? total.toFixed(2) : "0.00"}
            </div>
          );
        },
      },
    ];
  }, [selectedLines, drafts]);

  /** === Tabla TanStack === */
  const table = useReactTable({
    data: productos,
    columns,
    state: { expanded },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => row.original.presentaciones.length > 0,
    onExpandedChange: setExpanded,
  });

  /** === Fila expandida de Presentaciones (grid compacta) === */
  const PresentacionGridRow: React.FC<{
    p: ProductoToPedidoList;
    pp: ProductoPresentacionToPedido;
  }> = ({ p, pp }) => {
    const rk = rowKeyForPres(pp.id);
    const isChecked = isPresChecked(p.id, pp.id);
    const qty = qtyOfKey(rk);
    const price = priceOfKey(rk) ?? pp.costoReferencialPresentacion ?? 0;
    const lineTotal = (qty || 0) * (price || 0);

    const checkedPrecioAct =
      selectedLines.find((l) => keyFor(l) === rk)?.actualizarCosto || false;
    const disablePrice = isChecked && checkedPrecioAct === false;
    const currentFecha =
      selectedLines.find((l) => keyFor(l) === rk)?.fechaVencimiento || "";

    return (
      <div
        className="
          grid items-center gap-x-3 gap-y-1 py-1
          grid-cols-[24px_minmax(0,1fr)_60px_70px_120px_56px_96px]
          md:grid-cols-[24px_minmax(0,1fr)_72px_84px_140px_60px_110px]
        "
      >
        <div className="flex justify-center">
          <Checkbox
            checked={isChecked}
            onCheckedChange={(ck) =>
              onTogglePresentacion(p.id, pp.id, Boolean(ck))
            }
            aria-label="Seleccionar presentación"
          />
        </div>

        <div className="min-w-0">
          <div className="truncate font-medium">{p.nombre}</div>
          <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>Tipo: {pp.tipoPresentacion}</span>
            {pp.codigoBarras && <span>Código: {pp.codigoBarras}</span>}
          </div>
        </div>

        <div className="justify-self-center">
          <StockCell stockPorSucursal={pp.stockPorSucursal} />
        </div>

        <div className="justify-self-center">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            disabled={!isChecked}
            value={isChecked ? qty || "" : ""}
            onChange={(e) =>
              onQtyChange(
                rk,
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            className="h-8 w-16 text-center text-xs tabular-nums"
            placeholder="Cant."
            aria-label="Cantidad presentación"
          />
        </div>

        <div className="relative justify-self-center">
          <BadgeDollarSign className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            disabled={disablePrice}
            value={isChecked ? priceOfKey(rk) ?? "" : ""}
            onChange={(e) =>
              onPriceChange(
                rk,
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            className="h-8 w-24 pl-7 text-right text-xs font-mono tabular-nums"
            placeholder={`Q ${(pp.costoReferencialPresentacion ?? 0).toFixed(
              2
            )}`}
            aria-label="Precio costo presentación"
          />
        </div>

        <div className="justify-self-center">
          <input
            type="date"
            disabled={!isChecked}
            value={isChecked ? currentFecha : ""}
            onChange={(e) => handleChangeFechaVencimiento(rk, e.target.value)}
            className="h-8 w-28 px-2 rounded-md border bg-background text-foreground text-xs text-center"
            aria-label="Fecha de caducidad (presentación)"
          />
        </div>

        <div className="flex justify-center">
          <Checkbox
            checked={checkedPrecioAct}
            onCheckedChange={(ck) => toggleActPrecioProduct(rk, Boolean(ck))}
            aria-label="Actualizar costo presentación"
          />
        </div>

        <div className="text-right font-medium text-xs tabular-nums">
          Q {Number.isFinite(lineTotal) ? lineTotal.toFixed(2) : "0.00"}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <ListFilter className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código…"
            className="pl-8"
            aria-label="Buscar productos"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {productos.length} resultados
        </div>
      </div>

      {/* Tabla principal */}
      <div className="rounded-md border overflow-hidden">
        <div className="max-h-full overflow-y-auto overflow-x-hidden">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="h-8">
                  {hg.headers.map((h) => (
                    <TableHead
                      key={h.id}
                      className="align-middle text-[11px] sm:text-xs"
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
              {productos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No hay resultados…
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const p = row.original;
                  const prodSelected = isProductChecked(p.id);
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow
                        data-state={row.getIsExpanded() ? "open" : undefined}
                        className={`h-10 ${prodSelected ? "bg-muted/40" : ""}`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="align-middle py-2"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>

                      {row.getIsExpanded() && (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={columns.length} className="py-2">
                            <div className="space-y-1">
                              {p.presentaciones.map((pp) => (
                                <PresentacionGridRow
                                  key={pp.id}
                                  p={p}
                                  pp={pp}
                                />
                              ))}
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
      </div>
    </div>
  );
}
