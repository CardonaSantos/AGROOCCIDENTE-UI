// ---------- UI types (frontend) ----------
export interface UICreditoCondicionPago {
  id: number;
  nombre: string | null;
  interes: number; // %
  diasCredito: number;
  diasEntreCuotas: number;
  tipoInteres: string | null; // ej: "NONE" | "SIMPLE" | "COMPUESTO"
  modoGeneracion: string | null;
  cantidadCuotas: number;
}

export interface UIMovimientoFinancieroMini {
  id: number;
  clasificacion: string | null;
  motivo: string | null;
  deltaBanco: number; // number
  deltaCaja: number; // number
  descripcion: string | null;
}

export interface UIPagoEnCuota {
  id: number; // id del pago
  fechaPagoISO: string; // ISO
  metodoPago: string | null; // "EFECTIVO" | "TRANSFERENCIA" | etc
  monto: number; // number
  observaciones: string | null;
  referencia: string | null;
  movimiento?: UIMovimientoFinancieroMini;
  registradoPor?: {
    id: number;
    nombre: string | null;
    correo: string | null;
    rol: string | null;
  };
}

export interface UICuota {
  id: number;
  numero: number;
  estado: string; // "PENDIENTE" | "PAGADA" | etc
  fechaVencimientoISO: string; // ISO
  pagadaEnISO: string | null; // ISO o null
  monto: number; // number
  saldo: number; // number (derivado si no existe)
  pagos: UIPagoEnCuota[]; // lista “plana” de pagos de esta cuota
}

export interface UICreditoCompra {
  id: number;
  folioProveedor: string | null;
  estado: string;
  fechaEmisionISO: string;
  fechaVencimientoISO: string | null;

  montoOriginal: number; // number
  interesTotal: number; // number

  condicionPago?: UICreditoCondicionPago;

  // Derivados
  totalCuotas: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  totalPagado: number; // sum pagos
  saldoPendiente: number; // sum saldos (o monto de no pagadas)

  cuotas: UICuota[];

  createdAtISO: string;
  updatedAtISO: string;
}
