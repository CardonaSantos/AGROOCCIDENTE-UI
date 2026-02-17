export type InteresTipoServer = "NONE" | "SIMPLE" | "COMPUESTO";
export type PlanCuotaModoServer =
  | "IGUALES"
  | "PRIMERA_MAYOR"
  | "CRECIENTES"
  | "DECRECIENTES";

export type CuotaPropuestaPayload = {
  numero: number; // 0 si enganche
  fechaISO: string; // 'YYYY-MM-DD'
  monto: number; // 2 decimales
  etiqueta?: "ENGANCHE" | "NORMAL"; // opcional (server default 'NORMAL')
  // origen/esManual/montoCapital/montoInteres: opcionales → los omitimos; el server pone defaults
};

export type LineaPayload = {
  solicitudId?: number;
  productoId?: number;
  presentacionId?: number;
  cantidad: number;
  precioUnitario: number; // decimal
  precioSeleccionadoId: number; //nuevo
  precioListaRef: number; // decimal
  subtotal: number; // decimal
};

export type BuildPayload = {
  sucursalId: number;
  clienteId: number;

  totalPropuesto: number; // suma productos (principal)
  cuotaInicialPropuesta?: number; // enganche (consistencia con UI)
  cuotasTotalesPropuestas: number;

  interesTipo: InteresTipoServer;
  interesPorcentaje: number; // entero 0..100
  planCuotaModo: PlanCuotaModoServer;
  diasEntrePagos: number; // entero
  fechaPrimeraCuota?: string; // 'YYYY-MM-DD'

  comentario?: string;

  solicitadoPorId: number;

  lineas: LineaPayload[];
  fecha?: string | undefined;
  // ===== NUEVO: calendario propuesto que el server persiste
  cuotasPropuestas: CuotaPropuestaPayload[];
};
