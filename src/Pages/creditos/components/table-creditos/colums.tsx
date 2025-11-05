"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Banknote,
  Wallet,
  Store,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Clock,
  ReceiptText,
  Trash,
} from "lucide-react";
import {
  EstadoCuotaCredito,
  NormalizedCredito,
} from "../../interfaces/CreditoResponse";
import { Link } from "react-router-dom";

declare module "@tanstack/table-core" {
  interface TableMeta<TData extends unknown> {
    onOpenCredit?: (c: NormalizedCredito) => void;
    onRegisterPayment?: (c: NormalizedCredito) => void;
    onOpenHistory?: (c: NormalizedCredito) => void;

    /** NUEVO: dispara el diálogo de confirmar eliminación */
    onRequestDelete?: (c: NormalizedCredito) => void;
    /** NUEVO: permiso para ver el botón eliminar */
    canDelete?: boolean;
  }
  interface ColumnMeta<TData extends unknown, TValue> {
    /** Clase opcional para <th> (ancho, etc.) */
    thClass?: string;
  }
}

// ====== Utils locales ======
const Q = (n: number | null | undefined) =>
  `Q${Number(n ?? 0).toLocaleString("es-GT", { maximumFractionDigits: 2 })}`;

const fmt = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("es-GT", { dateStyle: "medium" })
    : "—";

const estadoColor: Record<EstadoCuotaCredito, string> = {
  ACTIVA: "bg-emerald-100 text-emerald-800",
  COMPLETADA: "bg-blue-100 text-blue-800",
  CANCELADA: "bg-rose-100 text-rose-800",
  EN_MORA: "bg-amber-100 text-amber-900",
  REPROGRAMADA: "bg-violet-100 text-violet-800",
  PAUSADA: "bg-slate-200 text-slate-800",
};

const estadoIcon: Record<EstadoCuotaCredito, React.ReactNode> = {
  ACTIVA: <CheckCircle2 className="h-3.5 w-3.5" />,
  COMPLETADA: <ReceiptText className="h-3.5 w-3.5" />,
  CANCELADA: <XCircle className="h-3.5 w-3.5" />,
  EN_MORA: <AlertTriangle className="h-3.5 w-3.5" />,
  REPROGRAMADA: <Clock className="h-3.5 w-3.5" />,
  PAUSADA: <PauseCircle className="h-3.5 w-3.5" />,
};

const columnHelper = createColumnHelper<NormalizedCredito>();

export const creditColumns: ColumnDef<NormalizedCredito, any>[] = [
  // ===== Columna principal: Cliente + número de crédito =====
  columnHelper.display({
    id: "cliente",
    header: () => <span className="whitespace-nowrap">Crédito / Cliente</span>,
    meta: { thClass: "w-[30%] min-w-[220px]" },
    cell: ({ row }) => {
      const c = row.original;
      const numero = c.numeroCredito ?? `#${c.id}`;
      const fullName = [c.cliente?.nombre, c.cliente?.apellidos]
        .filter(Boolean)
        .join(" ");

      return (
        <div className="flex items-start gap-2">
          <div className="mt-0.5">
            <Wallet className="h-4 w-4 text-slate-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="font-semibold truncate"
                title={`Crédito ${numero}`}
              >
                {numero}
              </span>
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {c.plan.frecuenciaPago}
              </Badge>
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                {c.plan.cuotasTotales} cuotas
              </Badge>
            </div>
            <div className="text-xs text-slate-600 truncate" title={fullName}>
              {fullName || "—"}
            </div>
            {c.cliente?.dpi && (
              <div className="text-[11px] text-slate-500">
                DPI: {c.cliente.dpi}
              </div>
            )}
          </div>
        </div>
      );
    },
  }),

  // ===== Sucursal =====
  columnHelper.display({
    id: "sucursal",
    header: () => <span className="whitespace-nowrap">Sucursal</span>,
    meta: { thClass: "w-[16%] min-w-[160px]" },
    cell: ({ row }) => {
      const s = row.original.sucursal;
      return (
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-slate-500" />
          <div className="min-w-0">
            <div className="truncate font-medium" title={s.nombre}>
              {s.nombre}
            </div>
            <div className="text-[11px] text-slate-500">{s.tipoSucursal}</div>
          </div>
        </div>
      );
    },
  }),

  // ===== Montos (venta, pagado, saldo) =====
  columnHelper.display({
    id: "montos",
    header: () => <span className="whitespace-nowrap">Montos</span>,
    meta: { thClass: "w-[18%] min-w-[180px]" },
    cell: ({ row }) => {
      const { venta, totalPagado } = row.original.montos;
      const saldo = (venta ?? 0) - (totalPagado ?? 0);
      return (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1" title="Venta">
            <Banknote className="h-3.5 w-3.5" /> {Q(venta)}
          </div>
          <div className="flex items-center gap-1" title="Pagado">
            <CheckCircle2 className="h-3.5 w-3.5" /> {Q(totalPagado)}
          </div>
          <div className="flex items-center gap-1" title="Saldo">
            <Wallet className="h-3.5 w-3.5" /> {Q(saldo)}
          </div>
        </div>
      );
    },
  }),

  // ===== Estado del crédito =====
  columnHelper.accessor("estado", {
    id: "estado",
    header: () => <span className="whitespace-nowrap">Estado</span>,
    meta: { thClass: "w-[12%] min-w-[120px]" },
    cell: ({ getValue }) => {
      const value = getValue() as EstadoCuotaCredito;
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${estadoColor[value]}`}
        >
          {estadoIcon[value]}
          {value}
        </span>
      );
    },
    sortingFn: (a, b, id) =>
      String(a.getValue(id)).localeCompare(String(b.getValue(id))),
  }),

  // ===== Fechas =====
  columnHelper.display({
    id: "fechas",
    header: () => <span className="whitespace-nowrap">Fechas</span>,
    meta: { thClass: "w-[18%] min-w-[200px]" },
    cell: ({ row }) => {
      const f = row.original.fechas;
      return (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
          <div>
            <div className="font-medium">Inicio</div>
            <div>{fmt(f.inicioISO)}</div>
          </div>
          <div>
            <div className="font-medium">Contrato</div>
            <div>{fmt(f.contratoISO)}</div>
          </div>
        </div>
      );
    },
  }),

  // ===== Acciones =====
  columnHelper.display({
    id: "acciones",
    header: () => <span className="sr-only">Acciones</span>,
    meta: { thClass: "w-[6%] min-w-[88px] text-right" },
    cell: ({ table, row }) => {
      const creditId = row.original.id;
      const onOpen = table.options.meta?.onOpenCredit;
      const onPay = table.options.meta?.onRegisterPayment;
      const canDelete = table.options.meta?.canDelete;
      const onRequestDelete = table.options.meta?.onRequestDelete;

      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Ver detalle"
            onClick={() => onOpen?.(row.original)}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Link to={`/credito-details/${creditId}`}>
            <Button
              variant="ghost"
              size="icon"
              title="Registrar abono"
              onClick={() => onPay?.(row.original)}
              className="h-8 w-8"
            >
              <Banknote className="h-4 w-4" />
            </Button>
          </Link>

          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              title="Eliminar"
              onClick={() => onRequestDelete?.(row.original)}
              className="h-8 w-8"
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      );
    },
  }),
];
