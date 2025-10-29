// components/ventas/VentaDetalleDialog.tsx
"use client";

import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  User,
  ReceiptText,
  CalendarClock,
  CreditCard,
  Hash,
  PackageSearch,
  Delete,
  FileText,
} from "lucide-react";
import { formattMonedaGT } from "@/utils/formattMoneda";
// ⬇️ Ajusta esta ruta si tu archivo de interfaces está en otro lugar
import {
  VentaResumen,
  VentaItem,
} from "../HistorialVentas/interfaces/VentasHistorialResponse";
import { Link } from "react-router-dom";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venta: VentaResumen | null;
  /** Si lo pasas, aparece el botón "Eliminar" en el footer del diálogo */
  onDeleteClick?: (venta: VentaResumen) => void;
};

export default function VentaDetalleDialog({
  open,
  onOpenChange,
  venta,
  onDeleteClick,
}: Props) {
  const fechaFmt = venta?.fecha ? dayjs(venta.fecha).format("DD/MM/YYYY") : "—";
  const horaFmt = venta?.hora ? dayjs(venta.hora).format("HH:mm") : "—";

  const tipoCompTxt = venta?.tipoComprobante ?? "—";

  const items: VentaItem[] = Array.isArray(venta?.items) ? venta!.items : [];

  const subtotalCalc = items.reduce(
    (acc, it) => acc + Number(it.cantidad || 0) * Number(it.precioVenta || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            Detalle de venta{" "}
            {venta?.id ? <Badge variant="secondary">#{venta.id}</Badge> : null}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Resumen de información de la venta seleccionada.
          </DialogDescription>
        </DialogHeader>

        {/* Encabezado con metadatos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Cliente</div>
              <div className="font-medium truncate">
                {venta?.clienteNombre ?? "CF"}
              </div>
              {venta?.clienteTelefono ? (
                <div className="text-xs text-muted-foreground">
                  {venta.clienteTelefono}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CalendarClock className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Fecha y hora</div>
              <div className="font-medium">
                {fechaFmt} {horaFmt !== "—" ? `• ${horaFmt}` : ""}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">
                Método de pago
              </div>
              <div className="font-medium">
                {venta?.metodoPago.replace("_", "") || "—"}
              </div>
              {venta?.referenciaPago ? (
                <div className="text-xs text-muted-foreground truncate">
                  Ref: {venta.referenciaPago}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Hash className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Comprobante</div>
              <div className="font-medium">{tipoCompTxt}</div>
              {/* Campos opcionales si existen en tu backend */}
              {(venta as any)?.serie ? (
                <div className="text-xs text-muted-foreground">
                  Serie: {(venta as any).serie}
                </div>
              ) : null}
              {(venta as any)?.numero ? (
                <div className="text-xs text-muted-foreground">
                  Número: {(venta as any).numero}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Ítems */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <PackageSearch className="h-5 w-5" />
            <h4 className="font-semibold">Ítems</h4>
          </div>

          <div className="rounded-md border overflow-hidden">
            <div className="grid grid-cols-12 bg-muted/50 px-3 py-2 text-xs font-medium">
              <div className="col-span-6">Nombre</div>
              <div className="col-span-2 text-right">Cant.</div>
              <div className="col-span-2 text-right">P. Venta</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            <div className="divide-y">
              {items.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground">
                  No hay ítems registrados en esta venta.
                </div>
              ) : (
                items.map((it) => {
                  const subtotal =
                    Number(it.cantidad || 0) * Number(it.precioVenta || 0);
                  return (
                    <div
                      key={`${it.type}-${it.ventaProductoId}`}
                      className="grid grid-cols-12 px-3 py-2 text-sm"
                    >
                      <div className="col-span-6 min-w-0">
                        <div className="truncate font-medium">
                          {it.nombre ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {it.type === "PRESENTACION"
                            ? `Presentación • Código: ${it.codigo ?? "—"}`
                            : `Producto • Código: ${it.codigo ?? "—"}`}
                        </div>
                      </div>
                      <div className="col-span-2 text-right tabular-nums">
                        {it.cantidad ?? 0}
                      </div>
                      <div className="col-span-2 text-right tabular-nums">
                        {formattMonedaGT(it.precioVenta ?? 0)}
                      </div>
                      <div className="col-span-2 text-right font-medium tabular-nums">
                        {formattMonedaGT(subtotal)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Totales */}
        <div className="ml-auto w-full sm:w-80 mt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">
              {formattMonedaGT(subtotalCalc)}
            </span>
          </div>

          {(venta as any)?.descuentoTotal ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descuento</span>
              <span className="tabular-nums">
                -{formattMonedaGT((venta as any).descuentoTotal)}
              </span>
            </div>
          ) : null}

          <Separator />

          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">
              {formattMonedaGT(venta?.total ?? subtotalCalc)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>

          <Link
            to={`/venta/generar-factura/${venta?.id}`}
            className="w-full sm:w-auto"
          >
            <Button
              variant="default"
              className="w-full bg-green-500 hover:bg-green-600 gap-2"
              onClick={() => onOpenChange(false)}
            >
              Comprobante
              <FileText className="w-5 h-auto" />
            </Button>
          </Link>

          {venta && onDeleteClick ? (
            <Button
              variant="destructive"
              className="w-full sm:w-auto ml-auto gap-2"
              onClick={() => onDeleteClick(venta)}
            >
              Eliminar venta
              <Delete className="w-5 h-auto" />
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
