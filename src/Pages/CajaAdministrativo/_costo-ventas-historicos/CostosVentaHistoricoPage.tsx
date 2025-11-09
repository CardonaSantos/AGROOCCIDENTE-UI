"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SucursalOption } from "../interfaces/FlujoCajaHsitoricoTypes";
import { getCostosVentaHistorico } from "./API/costosVenta";
import { FiltersBarCV } from "./components/FiltersBarCV";
import { ResumenGrid } from "./components/ResumenGrid";
import { ChartsCV } from "./components/ChartsCV";
import { DetalleTable } from "./components/DetalleTable";
import useGetSucursales from "@/hooks/getSucursales/use-sucursales";
import { CostoVentaResponseUI } from "./costoVentasHistoricosTypes";
import { PageHeader } from "@/utils/components/PageHeaderPos";

const TZGT = "America/Guatemala";
dayjs.extend(utc);
dayjs.extend(timezone);

export default function CostosVentaHistoricoPage() {
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>(
    () => ({
      from: dayjs().tz(TZGT).subtract(6, "day").startOf("day").toDate(),
      to: dayjs().tz(TZGT).endOf("day").toDate(),
    })
  );

  const [sucursal, setSucursal] = useState<SucursalOption | null>(null);

  const { data: sucursales } = useGetSucursales();
  const optionsSucursales: SucursalOption[] =
    sucursales?.map((s) => ({ label: s.nombre, value: s.id })) ?? [];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CostoVentaResponseUI | null>(null);

  // Endpoint actual: seguimos enviando ISO (con TZ GT) como lo tenías
  const fromISO = useMemo(
    () =>
      range.from
        ? dayjs(range.from).tz(TZGT).startOf("day").toISOString()
        : null,
    [range.from]
  );
  const toISO = useMemo(
    () =>
      range.to ? dayjs(range.to).tz(TZGT).endOf("day").toISOString() : null,
    [range.to]
  );

  const fetchData = async () => {
    if (!fromISO || !toISO) return;
    try {
      setLoading(true);
      setError(null);
      const resp = await getCostosVentaHistorico({
        from: fromISO,
        to: toISO,
        sucursalId: sucursal?.value,
      });
      setData(resp);
    } catch (err: any) {
      setError(err?.message ?? "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromISO, toISO, sucursal?.value]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Costos de Ventas Histórico"
        subtitle="Vea sus costos de ventas"
        sticky={false}
        fallbackBackTo="/"
      />

      <FiltersBarCV
        from={range.from}
        to={range.to}
        onChangeRange={(from, to) => setRange({ from, to })}
        sucursal={sucursal}
        sucursalesOptions={optionsSucursales}
        onChangeSucursal={setSucursal}
        onSearch={fetchData}
      />

      {loading && (
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      )}

      {error && (
        <Card className="p-4 flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </Card>
      )}

      {!loading && !error && data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <ResumenGrid resumen={data.resumen} />
          <ChartsCV porDia={data.porDia} />
          <DetalleTable detalle={data.detalle} />
        </motion.div>
      )}
    </div>
  );
}
