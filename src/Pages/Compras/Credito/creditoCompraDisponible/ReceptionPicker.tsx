// ReceptionPicker.tsx
"use client";

import * as React from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import customParseFormat from "dayjs/plugin/customParseFormat";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

dayjs.extend(customParseFormat);
dayjs.locale("es");

// -----------------------------
// Tipos
// -----------------------------
export interface DetalleNormalizado {
  id: number; // compraDetalleId
  cantidad: number; // cantidad pedida
  costoUnitario: number;
  subtotal: number;
  creadoEn: string | null;
  actualizadoEn: string | null;

  // (opcionales para calcular pendiente si los tienes)
  recibido?: number; // ya recepcionado
  pendiente?: number; // si lo traes directo

  producto: {
    id: number; // id de producto o presentación (según "tipo")
    nombre: string;
    codigo?: string;
    sku?: string;
    precioCosto: number;
    tipo: "PRESENTACION" | "PRODUCTO";
    // NUEVO: fecha de vencimiento que venga de la compra (si aplica)
    fechaVencimiento?: string | null;
  };
}

export type PickedItem = {
  compraDetalleId: number; // == DetalleNormalizado.id
  tipo: "PRESENTACION" | "PRODUCTO";
  refId: number; // productoId o presentacionId (DetalleNormalizado.producto.id)
  cantidad: number; // a recepcionar
  fechaVencimientoISO?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  normalizados: DetalleNormalizado[];
  picked: PickedItem[];
  setPicked: (v: PickedItem[]) => void;
  // al confirmar devolvemos el arreglo final + si fue “total”
  onConfirm: (items: PickedItem[], wasTotal: boolean) => void;
};

// -----------------------------
// Helpers
// -----------------------------
function ymdToISO(ymd: string | undefined) {
  if (!ymd) return undefined;
  const d = dayjs(ymd, "YYYY-MM-DD", true);
  if (!d.isValid()) return undefined;
  return d.startOf("day").toDate().toISOString();
}

function isoToYMD(iso?: string | null): string {
  if (!iso) return "";
  const d = dayjs(iso);
  return d.isValid() ? d.format("YYYY-MM-DD") : "";
}

function getPendiente(l: DetalleNormalizado): number {
  if (typeof l.pendiente === "number") return Math.max(0, l.pendiente);
  const recibido = typeof l.recibido === "number" ? l.recibido : 0;
  return Math.max(0, (l.cantidad ?? 0) - recibido);
}

// -----------------------------
// Componente
// -----------------------------
export default function ReceptionPicker({
  open,
  onOpenChange,
  normalizados,
  picked,
  setPicked,
  onConfirm,
}: Props) {
  // upsert: agrega o reemplaza una línea en picked
  const upsert = React.useCallback(
    (item: PickedItem) => {
      setPicked([
        ...picked.filter((x) => x.compraDetalleId !== item.compraDetalleId),
        item,
      ]);
    },
    [picked, setPicked]
  );

  const remove = React.useCallback(
    (compraDetalleId: number) => {
      setPicked(picked.filter((x) => x.compraDetalleId !== compraDetalleId));
    },
    [picked, setPicked]
  );

  const getPicked = React.useCallback(
    (compraDetalleId: number) =>
      picked.find((x) => x.compraDetalleId === compraDetalleId),
    [picked]
  );

  const handleCantidad = (row: DetalleNormalizado, value: number) => {
    const max = getPendiente(row);
    const cantidad = Math.max(0, Math.min(Number(value || 0), max));
    const prev = getPicked(row.id);
    if (cantidad === 0) {
      // si era 0, quítalo de la lista
      remove(row.id);
      return;
    }
    upsert({
      compraDetalleId: row.id,
      tipo: row.producto.tipo,
      refId: row.producto.id,
      cantidad,
      fechaVencimientoISO:
        prev?.fechaVencimientoISO ?? row.producto.fechaVencimiento ?? null,
    });
  };

  const handleFecha = (row: DetalleNormalizado, ymd: string) => {
    const prev = getPicked(row.id);
    if (!prev) {
      // si aún no está seleccionado, crearlo con cantidad=1 por UX?
      // mejor no: solo guarda si ya hay cantidad
      return;
    }
    upsert({
      ...prev,
      fechaVencimientoISO: ymdToISO(ymd) ?? null,
    });
  };

  const handleRecibirTodo = () => {
    const all: PickedItem[] = normalizados
      .map((l) => {
        const max = getPendiente(l);
        if (max <= 0) return null;
        return {
          compraDetalleId: l.id,
          tipo: l.producto.tipo,
          refId: l.producto.id,
          cantidad: max,
          fechaVencimientoISO: l.producto.fechaVencimiento ?? null,
        } as PickedItem;
      })
      .filter(Boolean) as PickedItem[];
    setPicked(all);
  };

  const handleLimpiar = () => setPicked([]);

  const totalLineas = normalizados.length;
  const totalSeleccionadas = picked.length;
  const algoPendiente = normalizados.some((l) => getPendiente(l) > 0);

  // ReceptionPicker.tsx
  React.useEffect(() => {
    if (!open) return;
    if (picked.length > 0) return;

    const defaults: PickedItem[] = normalizados
      .map((l) => {
        const max = getPendiente(l);
        if (max <= 0) return null;
        return {
          compraDetalleId: l.id,
          tipo: l.producto.tipo,
          refId: l.producto.id,
          cantidad: max, // 👈 prefill con el máximo pendiente
          fechaVencimientoISO: l.producto.fechaVencimiento ?? null,
        } as PickedItem;
      })
      .filter(Boolean) as PickedItem[];

    setPicked(defaults);
  }, [open, normalizados, setPicked, picked.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Seleccionar productos a recepcionar</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            Líneas: {totalLineas} · Seleccionadas: {totalSeleccionadas}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleLimpiar}>
              Limpiar
            </Button>
            <Button
              size="sm"
              onClick={handleRecibirTodo}
              disabled={!algoPendiente}
            >
              Recibir todo lo pendiente
            </Button>
          </div>
        </div>

        <Separator />

        <ScrollArea className="max-h-[50vh] rounded-md border">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Pedido</TableHead>
                <TableHead className="text-right">Recibido</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead className="text-right">Recibir ahora</TableHead>
                <TableHead className="text-right">F. Vencimiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {normalizados.map((row) => {
                const max = getPendiente(row);
                const sel = getPicked(row.id);
                const ymd = isoToYMD(
                  sel?.fechaVencimientoISO ??
                    row.producto.fechaVencimiento ??
                    undefined
                );

                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.producto.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.producto.codigo ?? "—"}{" "}
                        {row.producto.sku ? `· ${row.producto.sku}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px]">
                      {row.producto.tipo === "PRESENTACION"
                        ? "Presentación"
                        : "Producto"}
                    </TableCell>
                    <TableCell className="text-right">{row.cantidad}</TableCell>
                    <TableCell className="text-right">
                      {row.recibido ?? 0}
                    </TableCell>
                    <TableCell className="text-right">{max}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        aria-label={`Cantidad a recibir de ${row.producto.nombre}`}
                        className="w-24 text-right"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={max}
                        value={sel?.cantidad ?? 0}
                        onChange={(e) =>
                          handleCantidad(row, Number(e.target.value))
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        aria-label={`Fecha de vencimiento de ${row.producto.nombre}`}
                        className="w-[170px]"
                        type="date"
                        value={ymd}
                        onChange={(e) => handleFecha(row, e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              // si picked coincide con “recibir todo” de todas las líneas pendientes lo marcamos como total
              const wasTotal = normalizados
                .filter((l) => getPendiente(l) > 0)
                .every((l) => {
                  const sel = picked.find((x) => x.compraDetalleId === l.id);
                  return !!sel && sel.cantidad === getPendiente(l);
                });
              onConfirm(picked, wasTotal);
            }}
            disabled={picked.length === 0}
          >
            Continuar
          </Button>
        </div>

        <div className="text-[11px] text-muted-foreground">
          <Separator className="my-2" />
          <p>
            La recepción no modifica el monto de las cuotas. Solo ingresa stock
            y (si continúas) podrás registrar el pago de esta cuota con la
            recepción vinculada.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
