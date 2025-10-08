"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Tag, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("es");
import { DetalleRecepcionable } from "../ResumenRecepcionParcial/Interfaces/detalleRecepcionable";
import {
  ItemDetallesPayloadParcial,
  PayloadRecepcionParcial,
} from "./selectedItems";
import { formattMoneda } from "@/Pages/Utils/Utils";

/* -------------------- Helpers -------------------- */

const toInt = (raw: string | number) => {
  const n =
    typeof raw === "number" ? raw : parseFloat(String(raw).replace(",", "."));
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
};
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const toYMD = (v?: string | Date | null) => {
  if (!v) return undefined;
  const d = v instanceof Date ? dayjs(v) : dayjs(v);
  return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
};

export const buildItemFromRow = (
  row: DetalleRecepcionable
): ItemDetallesPayloadParcial => {
  const compraDetalleId = row.id;
  const cantidadSugerida = Math.max(0, row.pendiente ?? row.cantidad ?? 0);
  return {
    compraDetalleId,
    itemId: row.producto.id,
    // si detalle ya trae fecha, úsala como default
    fechaExpiracion: toYMD(row.fechaVencimiento) ?? undefined,
    cantidadRecibida: cantidadSugerida,
    checked: true,
    tipo: row.producto.tipo,
    precioCosto: row.producto.precioCosto,
  };
};

const columnHelper = createColumnHelper<DetalleRecepcionable>();

/* -------------------- Columnas compactas -------------------- */

interface PropsColum {
  selectedIds: Set<number>;
  selectedItems: PayloadRecepcionParcial;
  upsserSelectItems: (
    item: ItemDetallesPayloadParcial,
    checked: boolean
  ) => void;
  updateCantidadDetalle: (
    compraDetalleId: number,
    nuevaCantidad: number
  ) => void;
  updateFechaVencimiento: (
    compraDetalleId: number,
    nuevaFechaVencimiento: string
  ) => void;
}

export const columnsDetallesSelect = ({
  upsserSelectItems,
  selectedIds,
  updateCantidadDetalle,
  selectedItems,
  updateFechaVencimiento,
}: PropsColum) => [
  // SELECT (con select-all)
  columnHelper.display({
    id: "select",
    header: ({ table }) => {
      const rows = table.getRowModel().rows;
      const total = rows.length;
      const selectedOnPage = rows.reduce(
        (acc, r) => (selectedIds.has(r.original.id) ? acc + 1 : acc),
        0
      );
      const allSelected = total > 0 && selectedOnPage === total;

      const toggleAll = (checked: boolean) => {
        rows.forEach((r) =>
          upsserSelectItems(buildItemFromRow(r.original), checked)
        );
      };

      return (
        <div className="flex items-center gap-1">
          <Checkbox
            className="h-4 w-4"
            checked={allSelected}
            aria-label="Seleccionar todas"
            onCheckedChange={(v) => toggleAll(v === true)}
          />
          <Check className="h-4 w-4" />
        </div>
      );
    },
    cell: (info) => {
      const row = info.row.original;
      const compraDetalleId = row.id;
      const isRecibido = row.estadoDetalle === "RECIBIDO";
      const item = buildItemFromRow(row);

      return (
        <Checkbox
          className="h-4 w-4"
          disabled={isRecibido}
          checked={selectedIds.has(compraDetalleId)}
          onCheckedChange={(checked) =>
            upsserSelectItems(item, checked === true)
          }
          aria-label={`Seleccionar ${row.producto.nombre}`}
        />
      );
    },
    enableSorting: false,
  }),

  // NOMBRE (subinfo compacta: código + tipo)
  columnHelper.accessor((row) => row.producto.nombre, {
    id: "nombre",
    header: () => <span>Nombre</span>,
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="max-w-[12rem] sm:max-w-[16rem]">
          <div className="truncate font-medium">{info.getValue()}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 truncate">
              <Tag className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{row.producto.codigo ?? "—"}</span>
            </span>
            <Badge variant="secondary" className="h-5 px-2 text-[10px]">
              {row.producto.tipo}
            </Badge>
          </div>
        </div>
      );
    },
    sortingFn: "alphanumeric",
  }),

  columnHelper.accessor((row) => row.fechaVencimiento, {
    id: "fechaVencimiento",
    header: () => <span>F. Vencimiento</span>,
    cell: (info) => {
      const row = info.row.original;
      const compraDetalleId = row.id;

      const seleccion = selectedItems.lineas.find(
        (l) => l.compraDetalleId === compraDetalleId
      );

      // valor para el input date (YYYY-MM-DD o "")
      const valueYMD =
        seleccion?.fechaExpiracion ??
        (row.fechaVencimiento
          ? dayjs(row.fechaVencimiento).format("YYYY-MM-DD")
          : "");

      // texto legible (DD/MM/YYYY o "—")
      const pretty = valueYMD
        ? dayjs(valueYMD, "YYYY-MM-DD").format("DD/MM/YYYY")
        : "—";

      return (
        <div className="max-w-[12rem] sm:max-w-[16rem]">
          <Input
            type="date"
            value={valueYMD}
            onChange={(e) =>
              updateFechaVencimiento(compraDetalleId, e.currentTarget.value)
            }
            className="h-8"
          />
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {pretty}
          </div>
        </div>
      );
    },
    sortingFn: "alphanumeric", // o pon el sortingFn de fecha si quieres orden real por fecha
  }),

  // CANTIDAD (input angosto)
  columnHelper.display({
    id: "cantidad",
    header: () => <span>Cantidad</span>,
    cell: (info) => {
      const row = info.row.original;
      const compraDetalleId = row.id;
      const maxValue = Math.max(0, row.pendiente ?? row.cantidad ?? 0);

      const seleccion = selectedItems.lineas.find(
        (l) => l.compraDetalleId === compraDetalleId
      );
      const value = seleccion?.cantidadRecibida ?? maxValue;

      return (
        <div className="flex justify-end">
          <Input
            className="h-8 w-16 sm:w-20 text-right"
            type="number"
            inputMode="numeric"
            step={1}
            min={0}
            max={maxValue}
            value={value}
            onChange={(e) => {
              const n = toInt(e.currentTarget.value);
              const next = clamp(Number.isNaN(n) ? 0 : n, 0, maxValue);
              updateCantidadDetalle(compraDetalleId, next);
            }}
            onBlur={(e) => {
              const n = toInt(e.currentTarget.value);
              const next = clamp(Number.isNaN(n) ? 0 : n, 0, maxValue);
              if (next !== value) updateCantidadDetalle(compraDetalleId, next);
            }}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            aria-label={`Cantidad a recibir de ${row.producto.nombre}`}
          />
        </div>
      );
    },
    enableSorting: false,
  }),

  // COSTO UNITARIO
  columnHelper.accessor((row) => row.costoUnitario, {
    id: "costoUnitario",
    header: () => <span>Costo U.</span>,
    cell: (info) => (
      <span className="font-medium">{formattMoneda(info.getValue())}</span>
    ),
    sortingFn: "basic",
  }),

  // CÓDIGO (oculto en móvil; ya se muestra como subinfo del nombre)
  columnHelper.accessor((row) => row.producto.codigo ?? "-", {
    id: "codigo",
    header: () => <span>Código</span>,
    cell: (info) => (
      <span className="truncate text-muted-foreground">{info.getValue()}</span>
    ),
    sortingFn: "alphanumeric",
  }),

  // TIPO (oculto en <lg>; también como badge en Nombre)
  columnHelper.accessor((row) => row.producto.tipo, {
    id: "tipo",
    header: () => <span>Tipo</span>,
    cell: (info) => (
      <Badge variant="outline" className="h-5 px-2 text-[10px]">
        {info.getValue()}
      </Badge>
    ),
    sortingFn: "alphanumeric",
  }),

  // PENDIENTE
  columnHelper.accessor((row) => row.pendiente ?? 0, {
    id: "pendiente",
    header: () => <span>Pendiente</span>,
    cell: (info) => {
      const val = info.getValue<number>() ?? 0;
      return (
        <span
          className={[
            "font-semibold",
            val > 0 ? "text-amber-600 dark:text-amber-400" : "",
          ].join(" ")}
        >
          {val}
        </span>
      );
    },
    sortingFn: "basic",
  }),

  // ESTADO (badge mini)
  columnHelper.accessor((row) => row.estadoDetalle, {
    id: "estado",
    header: () => <span>Estado</span>,
    cell: (info) => {
      const v = info.getValue<string>();
      const map: Record<
        string,
        {
          label: string;
          variant: "default" | "secondary" | "destructive";
          icon: JSX.Element;
        }
      > = {
        RECIBIDO: {
          label: "Recibido",
          variant: "default",
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        },
        PENDIENTE: {
          label: "Pendiente",
          variant: "secondary",
          icon: <Package className="h-3.5 w-3.5" />,
        },
        PARCIAL: {
          label: "Parcial",
          variant: "secondary",
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
        },
      };
      const def = map[v] ?? {
        label: v,
        variant: "secondary" as const,
        icon: <Package className="h-3.5 w-3.5" />,
      };
      return (
        <div className="flex justify-end">
          <Badge variant={def.variant} className="h-5 gap-1 px-2 text-[10px]">
            {def.icon}
            {def.label}
          </Badge>
        </div>
      );
    },
    sortingFn: "alphanumeric",
  }),
];
