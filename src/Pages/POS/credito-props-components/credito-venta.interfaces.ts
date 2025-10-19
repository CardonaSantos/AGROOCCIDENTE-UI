export type PlanCuotaModo =
  | "IGUALES"
  | "PRIMERA_MAYOR"
  | "CRECIENTES"
  | "DECRECIENTES";
export type InteresTipoCreditoVenta = "NONE" | "SIMPLE" | "COMPUESTO";

export type PropuestaCuota = {
  numero: number; // 0 para enganche si aplica
  fechaISO: string; // YYYY-MM-DD
  monto: number; // 2 decimales
  etiqueta?: "ENGANCHE" | "NORMAL";
};

export type LineaCarrito = {
  tipo: "PRODUCTO" | "PRESENTACION";
  productoId?: number;
  presentacionId?: number;
  cantidad: number;
  precioUnit: number;
  nombreProductoSnapshot?: string;
  presentacionNombreSnapshot?: string;
  codigoBarrasSnapshot?: string;
};

// Estado del formulario (lo persistiremos como SolicitudCreditoVenta)
export interface FormCreditoState {
  // Contexto
  sucursalId: number;
  solicitadoPorId: number;
  clienteId?: number | undefined;
  nombreCliente?: string;
  telefonoCliente?: string;
  direccionCliente?: string;

  // Económico / plan propuesto
  totalPropuesto: number; // total productos (puede venir del carrito)
  cuotaInicialPropuesta: number; // enganche cuando PRIMERA_MAYOR
  cuotasTotalesPropuestas: number;
  interesTipo: InteresTipoCreditoVenta;
  interesPorcentaje: number; // 0..100
  planCuotaModo: PlanCuotaModo;
  diasEntrePagos: number; // ej 30
  fechaPrimeraCuota?: string; // YYYY-MM-DD

  comentario?: string;
  garantiaMeses: number;
  testigos?: Record<string, any>;

  // Vista previa que mandaremos como planPropuesto (JSON)
  cuotasPropuestas: PropuestaCuota[];

  // Líneas (carrito)
  lineas: Array<{
    productoId?: number;
    presentacionId?: number;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    subtotal?: number;
    nombreProductoSnapshot?: string;
    presentacionNombreSnapshot?: string;
    codigoBarrasSnapshot?: string;
  }>;
}
