// /Creditos/components/CreditCart.tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
// import SelectM from "react-select";
import { CartLine } from "./CreateVentaCuotaForm";

type Props = {
  cart: CartLine[];
  setQty: (index: number, qty: number) => void;
  setPrice: (index: number, price: number, priceId: number | null) => void;
  removeItem: (productID: number) => void;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(
    n
  );

export default function CreditCart({
  cart,
  setQty,
  // setPrice,
  removeItem,
}: Props) {
  const total = useMemo(
    () => cart.reduce((s, x) => s + x.cantidad * x.precioUnit, 0),
    [cart]
  );

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div className="text-sm font-semibold">Carrito</div>

        {cart.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No hay productos en el carrito
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {cart.map((l, i) => (
              <div
                key={`${l.tipo}-${l.productoId}-${
                  "presentacionId" in l ? l.presentacionId : "p"
                }`}
                className="grid grid-cols-6 gap-2 items-center rounded-md border p-2"
              >
                <div className="col-span-6">
                  <div className="font-medium truncate">{l.nombre}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {l.tipo === "PRESENTACION" ? "Presentación" : "Producto"}
                  </div>
                </div>

                <Input
                  disabled
                  type="number"
                  min={1}
                  value={l.cantidad}
                  onChange={(e) => setQty(i, Number(e.target.value))}
                  className="col-span-2 h-8 text-center"
                  aria-label="Cantidad"
                />

                {/* Precio editable manual: dejamos un input simple para flexibilidad */}

                <div className="col-span-2 text-right font-medium">
                  {fmt(l.cantidad * l.precioUnit)}
                </div>

                <div className="col-span-6 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(l.productoId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="font-semibold">{fmt(total)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
