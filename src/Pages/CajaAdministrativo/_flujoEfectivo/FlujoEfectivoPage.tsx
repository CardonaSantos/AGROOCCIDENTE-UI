"use client";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SucursalOption } from "../interfaces/FlujoCajaHsitoricoTypes";
import { FlujoEfectivoResponseUI } from "./Interface/flujoEfectivo";
import { getFlujoEfectivo } from "./API/flujoEfectivo";
import { FiltersBarFE } from "./_components/FiltersBarFE";
import { ResumenGridFE } from "./_components/ResumenGridFE";
import { ChartsFE } from "./_components/ChartsFE";
import { DetalleTableFE } from "./_components/DetalleTableFE";
import useGetSucursales from "@/hooks/getSucursales/use-sucursales";

const TZGT = "America/Guatemala";
dayjs.extend(utc);
dayjs.extend(timezone);

export default function FlujoEfectivoPage() {
  // Por defecto: mes en curso
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>(
    () => ({
      from: dayjs().tz(TZGT).startOf("month").toDate(),
      to: dayjs().tz(TZGT).endOf("day").toDate(),
    })
  );

  const [sucursal, setSucursal] = useState<SucursalOption | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FlujoEfectivoResponseUI | null>(null);

  // Controller espera YYYY-MM-DD (TZ Guatemala)
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

  const { data: sucursales = [] } = useGetSucursales();

  const optionsSucursales: SucursalOption[] = sucursales.map((s) => ({
    label: s.nombre,
    value: s.id,
  }));

  const fetchData = async () => {
    if (!fromYMD || !toYMD) return;
    try {
      setLoading(true);
      setError(null);
      const resp = await getFlujoEfectivo({
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Flujo de Efectivo</h1>
      </div>

      <FiltersBarFE
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
          <ResumenGridFE resumen={data.resumen} />
          <ChartsFE porDia={data.porDia} resumen={data.resumen} />
          <DetalleTableFE detalle={data.detalle} />
        </div>
      )}
    </div>
  );
}
