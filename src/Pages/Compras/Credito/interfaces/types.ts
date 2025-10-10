export enum InteresTipo {
  NONE = "NONE",
  SIMPLE = "SIMPLE",
  COMPUESTO = "COMPUESTO",
}

export enum PlanCuotaModo {
  IGUALES = "IGUALES",
  PRIMERA_MAYOR = "PRIMERA_MAYOR",
}

export interface CreditoCompra {
  proveedorId: number;
  compraId: number;
  interesTipo: InteresTipo;
  planCuotaModo: PlanCuotaModo;
  diasEntrePagos: string;
  diasCredito: string;
  cantidadCuotas: string;
  interes: string;
}

export type PlanCuotaFila = {
  numero: number;
  fechaISO: string;
  monto: number;
  id: string;
};
export type PlanPreview = {
  cuotas: PlanCuotaFila[];
  interesTotal: number;
  principalFinanciado: number; // total - enganche
  totalAPagar: number; // suma de cuotas
};
//

export type GeneracionModo = "POR_COMPRA" | "POR_RECEPCION";

export type EngancheInput = { tipo: "Q" | "%"; valor: number } | null;

export interface CreditoCompraForm {
  usuarioId: number;
  proveedorId: number;
  compraId: number;
  modo: GeneracionModo;
  recepcionId?: number;
  montoOriginal?: number; // por defecto: total de compra o valor de recepción
  fechaEmisionISO: string; // ISO
  diasCredito: number; // Net X
  diasEntrePagos: number; // frecuencia entre cuotas
  cantidadCuotas: number; // n total (incluye la #1 si hay enganche)
  interesTipo: InteresTipo;
  interes: number; // tasa por periodo (ej. 0, 0.02)
  planCuotaModo: PlanCuotaModo;
  enganche: EngancheInput; // si modo PRIMERA_MAYOR
  registrarPagoEngancheAhora: boolean;
  cuentaBancariaId: number;
  cuotas: PlanCuotaFila[];
}

export interface ProveedorOption {
  id: number;
  nombre: string;
}
export interface RecepcionValorada {
  id: number;
  valor: number;
  folio?: string;
  fechaISO?: string;
}

//
export type CrearCreditoCompraPayload = {
  // Identificación
  compraId: number;
  proveedorId: number;
  usuarioId: number;

  // Modo de generación
  modo: "POR_COMPRA" | "POR_RECEPCION";
  recepcionId?: number; // requerido si modo === 'POR_RECEPCION'

  // Cabecera
  fechaEmisionISO: string; // ISO (ej. "2025-10-09T00:00:00.000Z")
  montoOriginal?: number; // default: total compra o valor recepción
  folioProveedor?: string; // opcional

  // Condición / plan
  diasCredito: number; // Net X (1ª cuota = emision + diasCredito)
  diasEntrePagos: number; // frecuencia (quincenal=15, mensual=30)
  cantidadCuotas: number; // n total (incluye #1 si hay enganche)
  interesTipo: "NONE" | "SIMPLE" | "COMPUESTO";
  interes: number; // tasa por periodo (0.02 = 2% por periodo)
  planCuotaModo: "IGUALES" | "PRIMERA_MAYOR";

  // Plan definitivo (lo que muestra la UI)
  cuotas: Array<{
    numero: number; // la UI puede mandarlo, el back reindexa
    fechaISO: string; // ISO de vencimiento
    monto: number; // importe de la cuota
    id?: string; // id temporal UI (ignorado por back)
  }>;

  // Enganche (si PRIMERA_MAYOR)
  enganche?: number; // == cuotas[0].monto

  // Pago inmediato del enganche (opcional)
  registrarPagoEngancheAhora: boolean;
  metodoPago?: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | string; // requerido si registrarPagoEngancheAhora
  sucursalId?: number; // requerido si registrarPagoEngancheAhora
  cuentaBancariaId?: number; // requerido si registrarPagoEngancheAhora && afecta banco
  descripcion?: string; // opcional para MF/pago
};
