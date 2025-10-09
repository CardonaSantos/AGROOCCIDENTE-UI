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
