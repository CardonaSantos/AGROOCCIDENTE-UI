"use client";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

import { FiltersBar } from "./_components/FiltersBar";
import { SucursalCharts } from "./_components/SucursalCharts";
import { GlobalTable, SucursalTable } from "./_components/FlujoTable";
import { GlobalCharts } from "./_components/GlobalCharts";

import useGetSucursales from "@/hooks/getSucursales/use-sucursales";
import { useApiQuery } from "@/hooks/genericoCall/genericoCallHook";
import { useStore } from "@/components/Context/ContextSucursal";
import { toast } from "sonner";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";
import { SucursalOption } from "./interfaces/FlujoCajaHsitoricoTypes";
import { FlujoGlobalDiaUI, FlujoSucursalDiaUI } from "./interfaces/interface2";
import { PageHeader } from "@/utils/components/PageHeaderPos";

// === NUEVOS TYPES ===

// TZ Guatemala
const TZGT = "America/Guatemala";
dayjs.extend(utc);
dayjs.extend(timezone);

export default function FlujoHistoricoPage() {
  // Filtros
  const sucursalIdCtx = useStore((state) => state.sucursalId) ?? 0;
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>(
    () => ({
      from: dayjs().tz(TZGT).subtract(6, "day").startOf("day").toDate(),
      to: dayjs().tz(TZGT).endOf("day").toDate(),
    })
  );
  const [sucursal, setSucursal] = useState<SucursalOption | null>(null);

  // Opciones de sucursal
  const { data: sucursales } = useGetSucursales();
  const optionsSucursales: SucursalOption[] =
    sucursales?.map((s) => ({ label: s.nombre, value: s.id })) ?? [];
  const sucursalID = sucursal?.value ?? sucursalIdCtx;

  // Fechas ISO (con TZ GT)
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

  // Queries (con nuevos tipos)
  const {
    data: flujoGlobalData,
    error: errorGlobal,
    isLoading: isLoadingGlobal,
    refetch: refetchGlobal,
  } = useApiQuery<FlujoGlobalDiaUI[]>(
    ["flujoCajaGlobal", fromISO, toISO, sucursalID],
    "caja-administrativo/global",
    { params: { from: fromISO, to: toISO, sucursalId: sucursalID } },
    { enabled: Boolean(fromISO && toISO) }
  );

  const {
    data: flujoSucursalData,
    error: errorSucursal,
    isLoading: isLoadingSucursal,
    refetch: refetchSucursal,
  } = useApiQuery<FlujoSucursalDiaUI[]>(
    ["cajaSucursal", fromISO, toISO, sucursalID],
    `/caja-administrativo/sucursal/${sucursalID}`,
    { params: { from: fromISO, to: toISO, sucursalId: sucursalID } },
    { enabled: Boolean(fromISO && toISO) }
  );

  const isLoading = isLoadingGlobal || isLoadingSucursal;
  const isError = errorGlobal || errorSucursal;

  const reFetchAll = async (): Promise<void> => {
    await Promise.all([refetchGlobal(), refetchSucursal()]);
  };

  useEffect(() => {
    if (errorSucursal) toast.error(getApiErrorMessageAxios(errorSucursal));
    if (errorGlobal) toast.error(getApiErrorMessageAxios(errorGlobal));
  }, [errorSucursal, errorGlobal]);

  useEffect(() => {
    // si no hay seleccion manual, intenta con el ctx, si no, toma la primera disponible
    if (!sucursal && optionsSucursales.length > 0) {
      const fromCtx =
        sucursalIdCtx && sucursalIdCtx > 0
          ? optionsSucursales.find((o) => o.value === sucursalIdCtx)
          : null;
      setSucursal(fromCtx ?? optionsSucursales[0]);
    }
  }, [sucursal, sucursalIdCtx, optionsSucursales]);

  if (isError) {
    return (
      <div className="p-4 text-destructive flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>Error encontrando registros de flujo de caja</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Cargando datos de flujo de caja…
        </h2>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Flujo de Caja Histórico"
        subtitle="Ingresos y egresos de cajas históricos"
        sticky={false}
        fallbackBackTo="/"
      />

      <FiltersBar
        from={range.from}
        to={range.to}
        onChangeRange={(from, to) => setRange({ from, to })}
        sucursal={sucursal}
        sucursalesOptions={optionsSucursales}
        onChangeSucursal={setSucursal}
        onRefresh={reFetchAll}
      />

      {!isLoading && !isError && (
        <Tabs defaultValue="sucursal" className="w-full">
          <TabsList className="grid grid-cols-2 w-full md:w-auto">
            <TabsTrigger value="sucursal">Por sucursal</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
          </TabsList>

          <TabsContent value="sucursal" className="space-y-4">
            {sucursal ? (
              <>
                <SucursalCharts data={flujoSucursalData ?? []} />
                <SucursalTable rows={flujoSucursalData ?? []} />
              </>
            ) : (
              <Card className="p-6 text-sm text-muted-foreground">
                Seleccione una sucursal para ver el detalle por día.
              </Card>
            )}
          </TabsContent>

          <TabsContent value="global" className="space-y-4">
            <GlobalCharts data={flujoGlobalData ?? []} />
            <GlobalTable rows={flujoGlobalData ?? []} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
