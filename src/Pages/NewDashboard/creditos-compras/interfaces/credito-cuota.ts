// src/features/cxp/types.ts
// -------------------------

export type CxPEstado = "PENDIENTE" | "PARCIAL" | "PAGADO" | "ANULADO";
export type CuotaEstado = "PENDIENTE" | "PARCIAL" | "PAGADA" | "VENCIDA";

// ====== Tipos que vienen del API ======
export interface ApiCxpCuota {
  id: number;
  numero: number;
  fechaVencimientoISO: string;
  monto: string;
  saldo: string;
  estado: CuotaEstado;
  vencida: boolean;
  diasRestantes: number;
}

export interface ApiCxpDocumento {
  documentoId: number;
  proveedor: { id: number; nombre: string; rfc: string | null };
  compra: { id: number } | null;
  folioProveedor: string | null;
  fechaEmisionISO: string;
  fechaVencimientoISO: string | null;
  estado: CxPEstado;
  montoOriginal: string;
  saldoPendiente: string;
  condicionPago: {
    id: number;
    nombre: string;
    diasCredito: number | null;
    cantidadCuotas: number | null;
    diasEntreCuotas: number | null;
    interes: string | null;
    tipoInteres: string;
    modoGeneracion: string;
  } | null;
  cuotasPendientes: number;
  cuotasVencidas: number;
  totalAPagarHoy: string;
  proximaCuota: ApiCxpCuota | null;
  cuotas: ApiCxpCuota[];
}

export interface ApiCxpActivosResponse {
  data: ApiCxpDocumento[];
}

// ====== Tipos que usará la UI ======
export interface UICxpCuota {
  id: number;
  numero: number;
  fechaVencimiento: Date;
  monto: number;
  saldo: number;
  estado: CuotaEstado;
  vencida: boolean;
  diasRestantes: number;
}

export interface UICxpCard {
  id: number; // documentoId
  proveedorId: number;
  proveedorNombre: string;
  folioProveedor: string | null;
  compraId: number | null;

  fechaEmision: Date;
  fechaVencimiento: Date | null;
  estado: CxPEstado;

  montoOriginal: number;
  saldoPendiente: number;

  frecuenciaLabel: string; // "MENSUAL", "QUINCENAL", "SEMANAL" o "cada N días"
  cuotasPendientes: number;
  cuotasVencidas: number;
  totalAPagarHoy: number;

  proximaCuota: UICxpCuota | null;
  cuotas: UICxpCuota[];
}
