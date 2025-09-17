// /Creditos/components/CreditProducts.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, Package2, ChevronDown, ChevronRight } from "lucide-react";
import SelectM from "react-select";
import { Input } from "@/components/ui/input";
import { useSearchProducts } from "@/hooks/genericoCall/creditApi";
import { PresentacionApi, ProductoApi } from "./CreateVentaCuotaForm";
import { toast } from "sonner";

type Props = {
  sucursalId: number;
  q: string;
  onAddProduct: (p: {
    producto: ProductoApi;
    precioId: number | null;
    precio: number;
    cantidad: number;
  }) => void;
  onAddPresentation: (p: {
    producto: ProductoApi;
    presentacion: PresentacionApi;
    precioId: number | null;
    precio: number;
    cantidad: number;
  }) => void;

  /** 👇 NUEVO: cuántas unidades ya hay en el carrito */
  getInCartQtyProduct: (productId: number) => number;
  getInCartQtyPresentation: (presentacionId: number) => number;
};

const parsePrecio = (s: string | number) => {
  const n = typeof s === "string" ? parseFloat(s) : s ?? 0;
  return Number.isFinite(n) ? n : 0;
};

export default function CreditProducts({
  sucursalId,
  q,
  onAddProduct,
  onAddPresentation,
  getInCartQtyProduct,
  getInCartQtyPresentation,
}: Props) {
  const { data, isLoading } = useSearchProducts(sucursalId, q);
  const productos = data ?? [];
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-3">
      {isLoading && (
        <div className="text-sm text-muted-foreground">Buscando productos…</div>
      )}

      {productos.length === 0 && !isLoading ? (
        <div className="text-sm text-muted-foreground">Sin resultados…</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {productos.map((p) => (
          <ProductCard
            key={p.id}
            p={p}
            expanded={!!expanded[p.id]}
            onToggleExpand={() =>
              setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))
            }
            onAddProduct={onAddProduct}
            onAddPresentation={onAddPresentation}
            getInCartQtyProduct={getInCartQtyProduct}
            getInCartQtyPresentation={getInCartQtyPresentation}
          />
        ))}
      </div>
    </div>
  );
}

function ProductCard({
  p,
  expanded,
  onToggleExpand,
  onAddProduct,
  onAddPresentation,
  getInCartQtyProduct,
  getInCartQtyPresentation,
}: {
  p: ProductoApi;
  expanded: boolean;
  onToggleExpand: () => void;
  onAddProduct: Props["onAddProduct"];
  onAddPresentation: Props["onAddPresentation"];
  getInCartQtyProduct: Props["getInCartQtyProduct"];
  getInCartQtyPresentation: Props["getInCartQtyPresentation"];
}) {
  const [qty, setQty] = useState<number>(1);
  const priceOptions =
    p.precios?.map((pp) => ({
      value: pp.id,
      label: `${pp.rol}: Q ${parsePrecio(pp.precio).toFixed(2)}`,
      raw: pp,
    })) ?? [];
  const [priceOpt, setPriceOpt] = useState<any>(priceOptions[0] ?? null);

  // Stock total del producto en sucursales
  const stockTotal = useMemo(
    () => (p.stock ?? []).reduce((a, s) => a + (s.cantidad ?? 0), 0),
    [p.stock]
  );

  // 👇 unidades ya en carrito + disponibles remanentes
  const inCart = getInCartQtyProduct(p.id);
  const remaining = Math.max(0, stockTotal - inCart);

  // Ajustar qty si cambian existencias o carrito
  useEffect(() => {
    if (remaining === 0) setQty(1);
    else if (qty > remaining) setQty(remaining);
  }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const image = p.imagenesProducto?.[0]?.url;

  const canAdd =
    !!priceOpt &&
    remaining > 0 &&
    qty >= 1 &&
    Number.isFinite(qty) &&
    qty <= remaining;

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={p.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{p.nombre}</div>
            <div className="text-xs text-muted-foreground truncate">
              {p.codigoProducto}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="font-bold" variant="outline">
                Stock: {stockTotal}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                Disp.: {remaining}
                {inCart ? ` (en carrito: ${inCart})` : ""}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleExpand}
            className="ml-auto"
            aria-label={
              expanded ? "Ocultar presentaciones" : "Mostrar presentaciones"
            }
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Selección rápida: PRODUCTO */}
        <div className="grid grid-cols-3 gap-2">
          <SelectM
            className="col-span-2 text-black"
            placeholder="Precio"
            options={priceOptions}
            value={priceOpt}
            onChange={(o) => setPriceOpt(o)}
            isClearable
          />
          <Input
            type="number"
            min={1}
            // 👇 sugerimos el máximo al navegador (no bloquea, pero ayuda)
            max={remaining || undefined}
            value={qty}
            onChange={(e) => {
              const v = Math.max(1, Number(e.target.value) || 1);
              setQty(remaining > 0 ? Math.min(v, remaining) : 1);
            }}
            disabled={remaining === 0}
            placeholder={remaining === 0 ? "Sin stock" : undefined}
          />

          <Button
            className="col-span-3"
            onClick={() => {
              if (!canAdd) {
                toast.warning(
                  remaining === 0
                    ? "Sin stock disponible para este producto."
                    : "La cantidad supera el stock disponible."
                );
                return;
              }
              const precio = priceOpt ? parsePrecio(priceOpt.raw.precio) : 0;
              onAddProduct({
                producto: p,
                precioId: priceOpt?.value ?? null,
                precio,
                cantidad: qty,
              });
            }}
            disabled={!canAdd}
            title={
              remaining === 0
                ? "Sin stock disponible"
                : !priceOpt
                ? "Seleccione un precio"
                : qty > remaining
                ? "Cantidad supera disponible"
                : undefined
            }
          >
            {remaining === 0 ? "Sin stock" : "Agregar producto"}
          </Button>
        </div>

        {/* Presentaciones */}
        {expanded && p.presentaciones?.length > 0 && (
          <div className="rounded-md border p-2 space-y-2">
            <div className="text-xs font-medium flex items-center gap-1">
              <Layers className="h-4 w-4" />
              Presentaciones
            </div>

            <div className="space-y-2">
              {p.presentaciones.map((pp) => (
                <PresentationRow
                  key={pp.id}
                  p={p}
                  pp={pp}
                  onAddPresentation={onAddPresentation}
                  // 👇 pasar el getter de carrito
                  getInCartQtyPresentation={getInCartQtyPresentation}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PresentationRow({
  p,
  pp,
  onAddPresentation,
  getInCartQtyPresentation,
}: {
  p: ProductoApi;
  pp: PresentacionApi;
  onAddPresentation: Props["onAddPresentation"];
  getInCartQtyPresentation: Props["getInCartQtyPresentation"];
}) {
  const priceOptions =
    pp.precios?.map((pr) => ({
      value: pr.id,
      label: `${pr.rol}: Q ${parsePrecio(pr.precio).toFixed(2)}`,
      raw: pr,
    })) ?? [];
  const [opt, setOpt] = useState<any>(priceOptions[0] ?? null);
  const [qty, setQty] = useState<number>(1);

  const stockTotal = useMemo(
    () =>
      (pp.stockPresentaciones ?? []).reduce((a, s) => a + (s.cantidad ?? 0), 0),
    [pp.stockPresentaciones]
  );

  const inCart = getInCartQtyPresentation(pp.id);
  const remaining = Math.max(0, stockTotal - inCart);

  useEffect(() => {
    if (remaining === 0) setQty(1);
    else if (qty > remaining) setQty(remaining);
  }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAdd =
    !!opt &&
    remaining > 0 &&
    qty >= 1 &&
    Number.isFinite(qty) &&
    qty <= remaining;

  return (
    <div className="grid grid-cols-3 gap-2 items-center">
      <div className="col-span-3">
        <div className="text-sm font-medium truncate">{pp.nombre}</div>
        <div className="text-[12px] text-muted-foreground font-bold">
          Tipo: {pp.tipoPresentacion}
          {pp.sku ? <> · SKU: {pp.sku}</> : null}
          {pp.codigoBarras ? <> · CB: {pp.codigoBarras}</> : null}
          <>
            {" "}
            ·{" "}
            <span className="font-bold text-black text-[12px]">
              Stock: {stockTotal} · Disp.: {remaining}
              {inCart ? ` (carrito: ${inCart})` : ""}
            </span>
          </>
        </div>
      </div>

      <SelectM
        className="col-span-2 text-black"
        placeholder="Precio"
        options={priceOptions}
        value={opt}
        onChange={(o) => setOpt(o)}
        isClearable
      />

      <Input
        type="number"
        min={1}
        max={remaining || undefined}
        value={qty}
        onChange={(e) => {
          const v = Math.max(1, Number(e.target.value) || 1);
          setQty(remaining > 0 ? Math.min(v, remaining) : 1);
        }}
        disabled={remaining === 0}
        placeholder={remaining === 0 ? "Sin stock" : undefined}
      />

      <Button
        className="col-span-3"
        onClick={() => {
          if (!canAdd) {
            toast.warning(
              remaining === 0
                ? "Sin stock disponible para esta presentación."
                : "La cantidad supera el stock disponible."
            );
            return;
          }
          const precio = opt ? parsePrecio(opt.raw.precio) : 0;
          onAddPresentation({
            producto: p,
            presentacion: pp,
            precioId: opt?.value ?? null,
            precio,
            cantidad: qty,
          });
        }}
        disabled={!canAdd}
        title={
          remaining === 0
            ? "Sin stock disponible"
            : !opt
            ? "Seleccione un precio"
            : qty > remaining
            ? "Cantidad supera disponible"
            : undefined
        }
      >
        {remaining === 0 ? "Sin stock" : "Agregar presentación"}
      </Button>
    </div>
  );
}
