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
import {
  DollarSign,
  PackageOpen,
  ClipboardList,
  BadgeDollarSign,
  Box,
  Package,
  CalendarClock,
} from "lucide-react";

import type {
  ItemDetallesPayloadParcial,
  PayloadRecepcionParcial,
} from "../../table-select-recepcion/selectedItems";
import { formattFechaWithMinutes, formattMoneda } from "@/Pages/Utils/Utils";

interface PropsSummaryTable {
  selectedItems: PayloadRecepcionParcial;
}

export default function CardSummary({ selectedItems }: PropsSummaryTable) {
  const lineas = selectedItems?.lineas ?? [];

  const total = lineas.reduce(
    (acc: number, item: ItemDetallesPayloadParcial) =>
      acc + (item.cantidadRecibida ?? 0) * (item.precioCosto ?? 0),
    0
  );

  const unidades = lineas.reduce(
    (acc, item) => acc + (item.cantidadRecibida ?? 0),
    0
  );

  const lineasCount = lineas.length;

  const costoPromedio = unidades > 0 ? total / unidades : 0;

  // Desglose por tipo (PRODUCTO / PRESENTACION)
  const productosCount = lineas.filter((l) => l.tipo === "PRODUCTO").length;
  const presentacionesCount = lineas.filter(
    (l) => l.tipo === "PRESENTACION"
  ).length;

  // Vencimiento más próximo (si alguno viene definido)
  const proximasFechas = lineas
    .map((l) =>
      l.fechaExpiracion ? new Date(l.fechaExpiracion).getTime() : null
    )
    .filter((t): t is number => Number.isFinite(t))
    .sort((a, b) => a - b);
  const fechaMasProxima = proximasFechas.length
    ? new Date(proximasFechas[0])
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                Resumen de recepción parcial
              </CardTitle>
              <CardDescription>Totales de lo seleccionado</CardDescription>
            </div>
            <Badge variant="secondary" className="h-6 px-2 text-[11px]">
              Líneas: {lineasCount}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat
              icon={<DollarSign className="h-5 w-5" />}
              label="Total"
              value={formattMoneda(total)}
            />
            <Stat
              icon={<PackageOpen className="h-5 w-5" />}
              label="Unidades"
              value={unidades}
            />
            <Stat
              icon={<ClipboardList className="h-5 w-5" />}
              label="Líneas"
              value={lineasCount}
            />
            <Stat
              icon={<BadgeDollarSign className="h-5 w-5" />}
              label="Costo prom."
              value={formattMoneda(costoPromedio)}
              hint="Por unidad"
            />
            <Stat
              icon={<Box className="h-5 w-5" />}
              label="Productos"
              value={productosCount}
            />
            <Stat
              icon={<Package className="h-5 w-5" />}
              label="Presentaciones"
              value={presentacionesCount}
            />
          </div>

          {fechaMasProxima ? (
            <div className="mt-3 rounded-xl border p-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                <span className="uppercase">Vencimiento más próximo</span>
                <Badge variant="outline" className="ml-auto">
                  {formattFechaWithMinutes(fechaMasProxima)}
                </Badge>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* -------------------- Subcomponente -------------------- */

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: JSX.Element;
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] uppercase">{label}</span>
        {hint ? <span className="ml-auto text-[10px]">{hint}</span> : null}
      </div>
      <div className="mt-1 text-lg font-semibold">{String(value ?? "—")}</div>
    </div>
  );
}

/* -------------------- Utils -------------------- */
