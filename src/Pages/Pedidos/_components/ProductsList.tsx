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
import { Package2, ChevronRight, ChevronDown } from "lucide-react";
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

/** === Celda de stock con popover por sucursal === */
const StockCell = ({
  stockPorSucursal,
}: {
  stockPorSucursal: {
    sucursalId: number;
    sucursalNombre: string;
    cantidad: number;
  }[];
}) => {
  const total = useMemo(
    () => stockPorSucursal.reduce((a, s) => a + (s.cantidad || 0), 0),
    [stockPorSucursal]
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Badge variant="outline" className="font-medium">
            {total}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
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
              <span className="font-medium">{s.cantidad}</span>
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

  /** === Columnas TanStack v5 === */
  const columns = useMemo<ColumnDef<ProductoToPedidoList>[]>(
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
              className="h-8 w-8"
              onClick={row.getToggleExpandedHandler()}
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
          <div className="flex justify-center text-xs text-muted-foreground">
            SEL
          </div>
        ),
        size: 44,
        cell: ({ row }) => {
          const p = row.original;
          const checked = isProductChecked(p.id);
          return (
            <div className="flex justify-center">
              <Checkbox
                checked={checked}
                onCheckedChange={(ck) => onToggleProduct(p.id, Boolean(ck))}
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
          const p = row.original;
          return (
            <div className="flex items-center gap-2">
              <Package2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="truncate font-medium">{p.nombre}</div>
                {!!p.descripcion && (
                  <div className="text-xs text-muted-foreground truncate">
                    {p.descripcion}
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground">
                  Código: {p.codigoProducto} · Unidad: {p.unidadBase}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "stock",
        header: () => <span className="text-sm">Stock</span>,
        size: 100,
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <StockCell stockPorSucursal={row.original.stockPorSucursal} />
          </div>
        ),
      },
      {
        id: "qty-price",
        header: () => <span className="text-sm">Cant. / Precio</span>,
        size: 270,
        cell: ({ row }) => {
          const p = row.original;
          const rk = rowKeyForProduct(p.id);
          const checked = isProductChecked(p.id);

          // Cantidad (con draft + commit onChange)
          const qtySel = qtyOfKey(rk);
          const qtyDisplay =
            drafts[rk]?.qty ?? (qtySel !== undefined ? String(qtySel) : "");

          // Precio (con draft + commit onChange)
          const priceOverride = priceOfKey(rk); // number | null
          const displayPrice =
            drafts[rk]?.price ?? ((priceOverride ?? "") as string | number);

          // Reglas de habilitado para editar precio
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
                className="h-8 w-20 text-center text-sm font-mono tabular-nums"
                placeholder="Cant."
                aria-label="Cantidad producto"
              />

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
                className="h-8 w-28 text-right text-sm font-mono tabular-nums"
                placeholder={`Q ${p.precioCostoActual.toFixed(2)}`}
                aria-label="Precio costo unitario"
              />
            </div>
          );
        },
      },
      {
        id: "fecha",
        header: () => <span className="text-sm">F. Cad</span>,
        size: 140,
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
                className="h-8 w-36 px-2 rounded-md border bg-background text-foreground text-sm text-center"
                aria-label="Fecha de caducidad"
              />
            </div>
          );
        },
      },
      {
        id: "updCosto",
        header: () => <span className="text-sm">Act. Costo</span>,
        size: 90,
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
        header: () => <span className="text-sm">Total</span>,
        size: 110,
        cell: ({ row }) => {
          const p = row.original;
          const rk = rowKeyForProduct(p.id);
          const qty = qtyOfKey(rk) || 0;
          const price = (priceOfKey(rk) ?? p.precioCostoActual) || 0;
          const total = qty * price;
          return (
            <div className="text-right font-medium text-sm">
              Q {isFinite(total) ? total.toFixed(2) : "0.00"}
            </div>
          );
        },
      },
    ],
    [selectedLines, drafts]
  );

  /** === Tabla TanStack v5 === */
  const table = useReactTable({
    data: productos,
    columns,
    state: { expanded },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => row.original.presentaciones.length > 0,
    onExpandedChange: setExpanded,
  });

  /** === Fila expandida de Presentaciones === */
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

    return (
      <div
        key={pp.id}
        className="
          grid items-center gap-x-3 gap-y-1 py-1
          grid-cols-[24px_minmax(0,1fr)_100px_96px_120px_90px_110px]
          md:grid-cols-[24px_minmax(0,1fr)_110px_120px_140px_90px_120px]
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
          <div className="truncate font-medium">
            {p.nombre} — <span className="font-normal">{pp.nombre}</span>
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <span>Tipo: {pp.tipoPresentacion}</span>
            <span>Factor: {pp.factorUnidadBase}</span>
            {pp.sku && <span>SKU: {pp.sku}</span>}
            {pp.codigoBarras && <span>CB: {pp.codigoBarras}</span>}
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
            className="h-8 w-24 text-center text-sm"
            placeholder="Cant."
            aria-label="Cantidad presentación"
          />
        </div>

        <div className="justify-self-center">
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
            className="h-8 w-28 text-right text-sm font-mono tabular-nums"
            placeholder={`Q ${(pp.costoReferencialPresentacion ?? 0).toFixed(
              2
            )}`}
            aria-label="Precio costo presentación"
          />
        </div>

        <div className="flex justify-center">
          <Checkbox
            checked={checkedPrecioAct}
            onCheckedChange={(ck) => toggleActPrecioProduct(rk, Boolean(ck))}
            aria-label="Actualizar costo presentación"
          />
        </div>

        <div className="text-right font-medium text-sm">
          Q {isFinite(lineTotal) ? lineTotal.toFixed(2) : "0.00"}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Buscador */}
      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código…"
          className="max-w-sm"
        />
      </div>

      {/* Tabla principal */}
      <div className="rounded-md border">
        <div className="max-h-full overflow-y-auto">
          <Table className="w-full table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="h-10">
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
              {productos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Sin resultados…
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

                      {row.getIsExpanded() && (
                        <TableRow className="bg-muted/30">
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
