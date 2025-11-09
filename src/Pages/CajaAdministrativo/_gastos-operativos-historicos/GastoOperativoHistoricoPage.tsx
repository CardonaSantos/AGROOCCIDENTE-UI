"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { AlertCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SucursalOption } from "../interfaces/FlujoCajaHsitoricoTypes";
import { GastoOperativoResponseUI } from "./Interfaces/gastosOperativosInterfaces";
import { getGastosOperativos } from "./API/gastosOperativos";
import { FiltersBarGO } from "./_components/FiltersBarGO";
import { ResumenGridGO } from "./_components/ResumenGridGO";
import { ChartsGO } from "./_components/ChartsGO";
import { DetalleTableGO } from "./_components/DetalleTableGO";
import useGetSucursales from "@/hooks/getSucursales/use-sucursales";
import { PageHeader } from "@/utils/components/PageHeaderPos";

const TZGT = "America/Guatemala";
dayjs.extend(utc);
dayjs.extend(timezone);

export default function GastoOperativoHistoricoPage() {
  // Por defecto: mes en curso
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>(
    () => ({
      from: dayjs().tz(TZGT).startOf("month").toDate(),
      to: dayjs().tz(TZGT).endOf("day").toDate(),
    })
  );

  const [sucursal, setSucursal] = useState<SucursalOption | null>(null);

  const { data: sucursales } = useGetSucursales();
  const optionsSucursales: SucursalOption[] =
    sucursales?.map((s) => ({ label: s.nombre, value: s.id })) ?? [];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GastoOperativoResponseUI | null>(null);

  // Controller espera YYYY-MM-DD (TZ GT)
  const fromYMD = useMemo(
    () =>
      range.from ? dayjs(range.from).tz(TZGT).format("YYYY-MM-DD") : undefined,
    [range.from]
  );
  const toYMD = useMemo(
    () =>
      range.to ? dayjs(range.to).tz(TZGT).format("YYYY-MM-DD") : undefined,
    [range.to]
  );

  const fetchData = async () => {
    if (!fromYMD || !toYMD) return;
    try {
      setLoading(true);
      setError(null);
      const resp = await getGastosOperativos({
        from: fromYMD,
        to: toYMD,
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
  }, [fromYMD, toYMD, sucursal?.value]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gastos Operativos Históricos"
        subtitle="Vea sus gastos operativos"
        sticky={false}
        fallbackBackTo="/"
      />

      <FiltersBarGO
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
        <div className="space-y-4">
          <ResumenGridGO resumen={data.resumen} />
          <ChartsGO porDia={data.porDia} />
          <DetalleTableGO detalle={data.detalle} />
        </div>
      )}
    </div>
  );
}
