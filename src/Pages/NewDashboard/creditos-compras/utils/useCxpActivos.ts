// src/features/cxp/hooks/useCxpCreditosActivos.ts
// ------------------------------------------------
import { useMemo } from "react";
import {
  ApiCxpActivosResponse,
  ApiCxpCuota,
  ApiCxpDocumento,
  UICxpCard,
  UICxpCuota,
} from "../interfaces/credito-cuota";
import { useApiQuery } from "@/hooks/genericoCall/genericoCallHook";

const toNumber = (v: string | number | null | undefined): number =>
  v == null ? 0 : Number(v);

const toDate = (iso: string | null | undefined): Date | null =>
  iso ? new Date(iso) : null;

const mapCuota = (c: ApiCxpCuota): UICxpCuota => ({
  id: c.id,
  numero: c.numero,
  fechaVencimiento: new Date(c.fechaVencimientoISO),
  monto: toNumber(c.monto),
  saldo: toNumber(c.saldo),
  estado: c.estado,
  vencida: !!c.vencida,
  diasRestantes: c.diasRestantes ?? 0,
});

const frecuenciaFromDias = (dias?: number | null): string => {
  if (!dias || dias <= 0) return "—";
  if (dias >= 28 && dias <= 31) return "MENSUAL";
  if (dias === 15) return "QUINCENAL";
  if (dias === 7) return "SEMANAL";
  return `cada ${dias} días`;
};

const mapDoc = (d: ApiCxpDocumento): UICxpCard => {
  const cuotas = Array.isArray(d.cuotas) ? d.cuotas.map(mapCuota) : [];
  const proximaCuota = d.proximaCuota ? mapCuota(d.proximaCuota) : null;

  return {
    id: d.documentoId,
    proveedorId: d.proveedor?.id ?? 0,
    proveedorNombre: d.proveedor?.nombre ?? "—",
    folioProveedor: d.folioProveedor ?? null,
    compraId: d.compra?.id ?? null,

    fechaEmision: new Date(d.fechaEmisionISO),
    fechaVencimiento: toDate(d.fechaVencimientoISO),
    estado: d.estado,

    montoOriginal: toNumber(d.montoOriginal),
    saldoPendiente: toNumber(d.saldoPendiente),

    frecuenciaLabel: frecuenciaFromDias(
      d.condicionPago?.diasEntreCuotas ?? null
    ),
    cuotasPendientes: d.cuotasPendientes ?? 0,
    cuotasVencidas: d.cuotasVencidas ?? 0,
    totalAPagarHoy: toNumber(d.totalAPagarHoy),

    proximaCuota,
    cuotas,
  };
};

export function useCxpCreditosActivos() {
  const query = useApiQuery<ApiCxpActivosResponse>(
    ["cxp-creditos-activos"],
    "/credito-cuota",
    undefined,
    { staleTime: 60_000 }
  );

  const items: UICxpCard[] = useMemo(() => {
    const arr = query.data?.data ?? [];
    return arr.map(mapDoc);
  }, [query.data]);

  return {
    ...query, // isLoading, isError, refetch...
    items,
  };
}
