"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  CalendarDays,
  UserRound,
  DollarSign,
  Truck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ClipboardList,
  PackageOpen,
} from "lucide-react";

import type { CompraResumenUI } from "./interfaces/recepcionesInterfaces";
import { formattFechaWithMinutes } from "@/Pages/Utils/Utils";
import { formattMonedaGT } from "@/utils/formattMoneda";

interface PropsCompraMain {
  compra: CompraResumenUI;
}

export default function CardCompraMain({ compra }: PropsCompraMain) {
  const { id, fecha, estado, origen, conFactura, total, usuario, totales } =
    compra;

  const pct =
    totales.unidadesOrdenadas > 0
      ? Math.min(
          100,
          Math.round(
            (totales.unidadesRecibidas / totales.unidadesOrdenadas) * 100
          )
        )
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg leading-none">
                Compra #{id}
              </CardTitle>
              <CardDescription>Detalles de la compra principal</CardDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <EstadoBadge estado={estado} />
                <Badge variant="outline" className="gap-1">
                  <Truck className="h-4 w-4" />
                  {origen}
                </Badge>
                <Badge
                  variant={conFactura ? "default" : "secondary"}
                  className="gap-1"
                >
                  <FileText className="h-4 w-4" />
                  {conFactura ? "Con factura" : "Sin factura"}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {formattFechaWithMinutes(fecha)}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <UserRound className="h-4 w-4" />
                  {usuario?.nombre ?? "—"}
                </Badge>
              </div>
            </div>

            <div className="shrink-0 rounded-2xl border bg-card p-4 text-right">
              <div className="text-xs uppercase text-muted-foreground">
                Total
              </div>
              <div className="flex items-center justify-end gap-1">
                <DollarSign className="h-5 w-5" />
                <span className="text-2xl font-semibold leading-none">
                  {formattMonedaGT(total)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          {/* Avance de recepción */}
          <div className="mb-4 rounded-xl border p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">Avance de recepción</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {totales.unidadesRecibidas}/{totales.unidadesOrdenadas} unid.
              </span>
            </div>
            <Progress value={pct} className="h-2" />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {pct}% recibido
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat
              icon={<ClipboardList className="h-5 w-5" />}
              label="Líneas ordenadas"
              value={totales.lineasOrdenadas}
            />
            <Stat
              icon={<PackageOpen className="h-5 w-5" />}
              label="Unid. ordenadas"
              value={totales.unidadesOrdenadas}
            />
            <Stat
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Unid. recibidas"
              value={totales.unidadesRecibidas}
            />
            <Stat
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Pendientes"
              value={totales.unidadesPendientes}
              highlight={totales.unidadesPendientes > 0}
            />
            <Stat
              icon={<Truck className="h-5 w-5" />}
              label="Recepciones"
              value={totales.recepcionesCount}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* -------------------- Subcomponentes & utils -------------------- */

function EstadoBadge({ estado }: { estado: string }) {
  // mapea tu catálogo real de estados si tienes más
  const map: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
      icon: JSX.Element;
    }
  > = {
    RECIBIDO: {
      label: "Recibido",
      variant: "default",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    ESPERANDO_ENTREGA: {
      label: "Esperando entrega",
      variant: "secondary",
      icon: <Truck className="h-4 w-4" />,
    },
    PARCIAL: {
      label: "Recepción parcial",
      variant: "secondary",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    ANULADO: {
      label: "Anulado",
      variant: "destructive",
      icon: <XCircle className="h-4 w-4" />,
    },
  };

  const def = map[estado] ?? {
    label: estado,
    variant: "outline" as const,
    icon: <ClipboardList className="h-4 w-4" />,
  };

  return (
    <Badge variant={def.variant} className="gap-1">
      {def.icon}
      {def.label}
    </Badge>
  );
}

function Stat({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: JSX.Element;
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-3",
        highlight
          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
          : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
