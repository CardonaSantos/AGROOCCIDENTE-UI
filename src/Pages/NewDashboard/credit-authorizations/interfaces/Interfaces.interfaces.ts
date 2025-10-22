// types/credit-authorization.ts
type NormalizedLinea = {
  id: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  precioListaRef: number;
  item: {
    type: "PRODUCTO" | "PRESENTACION";
    id: number;
    nombre: string;
    codigo?: string;
    descripcion?: string | null;
    imagenes: string[];
  };
};

type NormalizedCuota = {
  id: number;
  numero: number; // 0 si enganche
  fechaISO: string; // ISO
  monto: number;
  etiqueta: "ENGANCHE" | "NORMAL";
  origen: "AUTO" | "MANUAL";
  esManual: boolean;
  montoCapital: number | null;
  montoInteres: number | null;
};
export type NormalizedSolicitud = {
  id: number;
  estado: string;
  fechas: {
    solicitudISO: string;
    primeraCuotaISO: string | null;
  };
  economico: {
    totalPropuesto: number;
    cuotaInicialPropuesta: number | null;
    cuotasTotalesPropuestas: number;
    interesTipo: string;
    interesPorcentaje: number;
    planCuotaModo: string;
    diasEntrePagos: number;
  };
  sucursal: { id: number; nombre: string; direccion?: string | null };
  cliente: {
    id: number;
    nombre: string;
    apellidos?: string | null;
    telefono?: string | null;
    direccion?: string | null;
  };
  solicitadoPor: {
    id: number;
    nombre: string;
    correo?: string | null;
    rol?: string | null;
  };
  aprobadoPor?: {
    id: number;
    nombre: string;
    correo?: string | null;
    rol?: string | null;
  } | null;
  comentario?: string | null;

  lineas: NormalizedLinea[];

  schedule: {
    cuotas: NormalizedCuota[];
    sumaCuotas: number; // suma de todos los montos (enganche + normales)
    tieneEnganche: boolean;
    proximoVencimientoISO: string | null; // min(fecha) de cuotas NORMAL futuras/iguales a hoy
  };

  metrics: {
    items: number;
    subtotalLineas: number;
    tienePresentaciones: boolean;
  };
};

// Si quieres tipar "estado" más estricto, ajusta este union a tus estados reales
export type EstadoSolicitud =
  | "PENDIENTE"
  | "APROBADA"
  | "RECHAZADA"
  | "CANCELADA";

export type SortDir = "asc" | "desc";

// OJO: En tu ejemplo los filtros vienen como string o null (p.ej. "sucursalId": "1")
// Si tu API luego envía números, cambia a number | string | null según convenga.
export interface CreditAuthorizationFilters {
  estado: string | null; // o EstadoSolicitud | null si quieres más estricto
  sucursalId: string | null;
  clienteId: string | null;
  q: string | null;
  fechaDesde: string | null; // ISO o 'YYYY-MM-DD' según tu API
  fechaHasta: string | null; // ISO o 'YYYY-MM-DD' según tu API
}

export interface PaginatedMeta<F = Record<string, unknown>> {
  total: number;
  page: number;
  pages: number;
  limit: number;
  sortBy: string; // si tienes claves fijas puedes usar un union literal
  sortDir: SortDir;
  filters: F;
}

export interface PaginatedResponse<T, F = Record<string, unknown>> {
  meta: PaginatedMeta<F>;
  data: T[];
}

// Respuesta específica para tus autorizaciones normalizadas
export type CreditAuthorizationListResponse = PaginatedResponse<
  NormalizedSolicitud,
  CreditAuthorizationFilters
>;
