// creditos-query.types.ts
// ===== Enums (mirrors del schema.prisma, sin importar @prisma/client en el FE)
export type EstadoCuota =
  | "ACTIVA"
  | "COMPLETADA"
  | "CANCELADA"
  | "EN_MORA"
  | "REPROGRAMADA"
  | "PAUSADA";

export type FrecuenciaPago = "SEMANAL" | "QUINCENAL" | "MENSUAL";
export type InteresTipo = "NONE" | "SIMPLE" | "COMPUESTO";
export type PlanCuotaModo =
  | "IGUALES"
  | "PRIMERA_MAYOR"
  | "CRECIENTES"
  | "DECRECIENTES";

export type CreditoSortBy =
  | "fechaInicio"
  | "fechaProximoPago"
  | "creadoEn"
  | "totalVenta"
  | "totalPagado"
  | "numeroCredito"
  | "estado";

// ===== Interface para el estado en la UI
export interface CreditoQueryState {
  // paginación
  page?: number; // default 1
  limit?: number; // default 20

  // orden
  sortBy?: CreditoSortBy; // default 'fechaInicio'
  sortOrder?: "asc" | "desc"; // default 'desc'

  // búsqueda global
  q?: string;

  // filtros directos
  sucursalId?: number;
  clienteId?: number;
  usuarioId?: number;

  estado?: EstadoCuota;
  frecuenciaPago?: FrecuenciaPago;
  interesTipo?: InteresTipo;
  planCuotaModo?: PlanCuotaModo;

  // rangos de fechas
  fechaInicioFrom?: Date | string; // puedes usar Date o 'YYYY-MM-DD'
  fechaInicioTo?: Date | string;
  proximoPagoFrom?: Date | string;
  proximoPagoTo?: Date | string;

  // flags
  enMora?: boolean;
  vencidas?: boolean;

  numeroCredito?: string;
  ventaId?: number;
}

// ===== Defaults recomendados (alineados con tu DTO)
export const DEFAULT_CREDITO_QUERY: CreditoQueryState = {
  page: 1,
  limit: 20,
  sortBy: "fechaInicio",
  sortOrder: "desc",
};

// ===== Helpers
const isBlank = (v: unknown) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "");

const toISOorDateOnly = (v?: Date | string) => {
  if (!v) return undefined;
  if (v instanceof Date) return v.toISOString(); // el DTO acepta ISO
  // si te gusta mandar 'YYYY-MM-DD', también es válido para @Type(() => Date)
  return v; // asume que ya viene 'YYYY-MM-DD' o ISO
};

export function buildCreditoQueryParams(
  q: CreditoQueryState,
  omitDefaults = true
): string {
  const merged: Required<
    Pick<CreditoQueryState, "page" | "limit" | "sortBy" | "sortOrder">
  > &
    Omit<CreditoQueryState, "page" | "limit" | "sortBy" | "sortOrder"> = {
    page: q.page ?? DEFAULT_CREDITO_QUERY.page!,
    limit: q.limit ?? DEFAULT_CREDITO_QUERY.limit!,
    sortBy: q.sortBy ?? DEFAULT_CREDITO_QUERY.sortBy!,
    sortOrder: q.sortOrder ?? DEFAULT_CREDITO_QUERY.sortOrder!,
    ...q,
  };

  const params = new URLSearchParams();

  const push = (k: string, v: any) => {
    if (isBlank(v)) return;
    params.set(k, String(v));
  };

  // paginación / orden (omite si son defaults y omitDefaults = true)
  if (!omitDefaults || merged.page !== DEFAULT_CREDITO_QUERY.page)
    push("page", merged.page);
  if (!omitDefaults || merged.limit !== DEFAULT_CREDITO_QUERY.limit)
    push("limit", merged.limit);
  if (!omitDefaults || merged.sortBy !== DEFAULT_CREDITO_QUERY.sortBy)
    push("sortBy", merged.sortBy);
  if (!omitDefaults || merged.sortOrder !== DEFAULT_CREDITO_QUERY.sortOrder)
    push("sortOrder", merged.sortOrder);

  // texto
  push("q", merged.q);

  // ids
  push("sucursalId", merged.sucursalId);
  push("clienteId", merged.clienteId);
  push("usuarioId", merged.usuarioId);
  push("ventaId", merged.ventaId);

  // enums
  push("estado", merged.estado);
  push("frecuenciaPago", merged.frecuenciaPago);
  push("interesTipo", merged.interesTipo);
  push("planCuotaModo", merged.planCuotaModo);

  // fechas (el DTO usa @Type(() => Date))
  push("fechaInicioFrom", toISOorDateOnly(merged.fechaInicioFrom));
  push("fechaInicioTo", toISOorDateOnly(merged.fechaInicioTo));
  push("proximoPagoFrom", toISOorDateOnly(merged.proximoPagoFrom));
  push("proximoPagoTo", toISOorDateOnly(merged.proximoPagoTo));

  // flags (Transform a boolean en tu DTO ya soporta 'true'/'false')
  if (merged.enMora !== undefined) push("enMora", merged.enMora);
  if (merged.vencidas !== undefined) push("vencidas", merged.vencidas);

  // otros
  push("numeroCredito", merged.numeroCredito);

  return params.toString();
}

// ===== Setter utilitario para React (opcional)
export function updateCreditoQuery<K extends keyof CreditoQueryState>(
  setState: React.Dispatch<React.SetStateAction<CreditoQueryState>>,
  key: K,
  value: CreditoQueryState[K]
) {
  setState((prev) => ({ ...prev, [key]: value }));
}
