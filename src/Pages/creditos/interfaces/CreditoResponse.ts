// ==============================
// Enums (mirrors del schema.prisma)
// ==============================
export type TipoSucursal =
  | "TIENDA"
  | "ALMACEN"
  | "CENTRO_DISTRIBUCION"
  | "TALLER"
  | "OFICINA";

export type MetodoPago =
  | "CONTADO"
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "TARJETA"
  | "CHEQUE"
  | "CREDITO"
  | "OTRO";

export type TipoComprobante = "FACTURA" | "RECIBO";

export type FrecuenciaPago = "SEMANAL" | "QUINCENAL" | "MENSUAL";

export type InteresTipo = "NONE" | "SIMPLE" | "COMPUESTO";

export type PlanCuotaModo =
  | "IGUALES"
  | "PRIMERA_MAYOR"
  | "CRECIENTES"
  | "DECRECIENTES";

// OJO: el estado del CRÉDITO (VentaCuota.estado) es EstadoCuota en el schema
export type EstadoCuotaCredito =
  | "ACTIVA"
  | "COMPLETADA"
  | "CANCELADA"
  | "EN_MORA"
  | "REPROGRAMADA"
  | "PAUSADA";

// El estado de CADA CUOTA (VentaCuotaDetalle.estado) es CuotaEstado en el schema
export type CuotaEstado = "PENDIENTE" | "PARCIAL" | "PAGADA" | "VENCIDA";

export type AccionCredito =
  | "CREADO"
  | "CAMBIO_ESTADO"
  | "ABONO"
  | "REPROGRAMADO"
  | "MORA_REGISTRADA"
  | "MORA_CONDONADA"
  | "AJUSTE_MANUAL";

// ==============================
// Tipos de la respuesta normalizada
// ==============================
export type NormLineaVenta = {
  id: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  item: {
    // metadatos (si quieres tratar todo “como producto”, en la UI usa solo `nombre`)
    type: "PRODUCTO" | "PRESENTACION";
    source: "producto" | "presentacion";
    uid: string;

    productoId?: number;
    presentacionId?: number;

    // nombre unificado (si hay presentación, es el nombre de la presentación; si no, el del producto)
    nombre: string;

    // códigos correctos según el tipo
    codigoProducto?: string | null;
    codigoBarras?: string | null;

    imagen?: string | null;
  };
};

export type NormCuota = {
  id: number;
  numero: number;
  fechaVencimientoISO: string | null;
  fechaPagoISO: string | null;
  estado: string;
  monto: number; // monto "programado" de la cuota (capital+interés)
  pagado: number; // total pagado aplicado a la cuota (cualquier concepto)
  saldoPendiente: number; // respaldo (si el servidor aún no separa conceptos)
  moraAcumulada: number; // mora almacenada e/o calculada
  // NUEVO
  diasAtraso: number; // >0 si pasó fechaVencimiento + diasGracia
  capitalPendiente: number; // montoCapital - sum(abonos.capital)
  interesPendiente: number; // montoInteres - sum(abonos.interes)
  moraPendiente: number; // moraAcumulada "al día" (ver cálculo)
  pagoSugerido: {
    mora: number;
    interes: number;
    capital: number;
    total: number;
  };
  abonos: { count: number; lastPagoISO: string | null };
};

export type NormAbono = {
  id: number;
  fechaISO: string;
  metodoPago: MetodoPago;
  referencia?: string | null;
  montoTotal: number;
  usuario: { id: number; nombre: string };
  sucursal: { id: number; nombre: string };
  desglose: Array<{
    cuotaId: number;
    capital: number;
    interes: number;
    mora: number;
    total: number;
  }>;
};

export type NormalizedCredito = {
  id: number;
  numeroCredito?: string | null;
  estado: EstadoCuotaCredito; // 'ACTIVA' | ...
  fechas: {
    inicioISO: string;
    proximoPagoISO: string | null;
    contratoISO: string;
    creadoISO: string;
    actualizadoISO: string;
  };
  sucursal: {
    id: number;
    nombre: string;
    tipoSucursal: TipoSucursal;
  };
  cliente: {
    id: number;
    nombre: string;
    apellidos?: string | null;
    dpi?: string | null;
    telefono?: string | null;
    direccion?: string | null;
  };
  usuario: { id: number; nombre: string };
  plan: {
    cuotasTotales: number;
    frecuenciaPago: FrecuenciaPago;
    modo: PlanCuotaModo;
    interesTipo: InteresTipo;
    interesTasa?: number; // entero en tu backend
    cuotaInicial: number;
    diasGracia: number;
    moraDiaria: number;
    diasEntrePagos: number;
  };
  montos: {
    venta: number;
    totalPagado: number;
    totalProgramado: number | null;
    moraAcumulada: number;
  };
  venta: {
    id: number;
    fechaISO: string;
    total: number;
    referenciaPago?: string | null;
    tipoComprobante: TipoComprobante;
    imei?: string | null;
    vendedor?: { id: number; nombre: string } | null;
    metodoPago?: {
      id: number;
      metodoPago: MetodoPago;
      monto: number;
      fechaISO: string;
    } | null;
    lineas: NormLineaVenta[];
    // si en el futuro vuelves a incluir "solicitudOrigen", tipéalo aquí
    solicitudOrigen?: null; // ahora mismo viene null en tu payload
  } | null;
  cuotas: {
    resumen: {
      total: number;
      pagadas: number;
      pendientes: number;
      atrasadas: number; // nota: “atrasadas” en tu normalizador corresponde a VENCIDA
      parcial: number;
    };
    proxima?: NormCuota | null;
    items: NormCuota[];
  };
  abonos: {
    count: number;
    ultimoISO: string | null;
    items: NormAbono[];
  };
  historial: Array<{
    id: number;
    accion: AccionCredito;
    comentario?: string | null;
    fechaISO: string;
    usuario?: { id: number; nombre: string } | null;
  }>;
};

// ==============================
// Envelope de paginación
// ==============================
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  sortBy:
    | "fechaInicio"
    | "fechaProximoPago"
    | "creadoEn"
    | "totalVenta"
    | "totalPagado"
    | "numeroCredito"
    | "estado";
  sortOrder: "asc" | "desc";
  hasMore: boolean;
};

export type CreditListResponse = {
  data: NormalizedCredito[];
  meta: PaginationMeta;
};
