// types/compra-registro.ts
export type EstadoCompra =
  | "RECIBIDO"
  | "CANCELADO"
  | "RECIBIDO_PARCIAL"
  | "ESPERANDO_ENTREGA";

export interface CompraProductoUI {
  id: number | null;
  nombre: string;
  codigo: string;
  precioCostoActual: number | null;
}

export interface CompraPedidoUI {
  id: number;
  folio: string;
  estado: string;
  fecha: string | null; // ISO
  prioridad: string;
  tipo: string;
  observaciones: string;
  usuario: CompraUsuarioUI;
  cliente: SimpleEntityUI | null;
}

export type OrigenCompra = "DIRECTA" | "REQUISICION" | "PEDIDO";

export interface CompraRegistroUI {
  id: number;
  estado: EstadoCompra;
  fecha: string | null;
  total: number;
  conFactura: boolean;
  factura: CompraFacturaUI | null;
  proveedor: SimpleEntityUI | null;
  sucursal: SimpleEntityUI | null;
  usuario: CompraUsuarioUI;

  requisicion: CompraRequisicionUI | null;
  pedido: CompraPedidoUI | null;

  origen: OrigenCompra; // 👈 directo desde DB
  folioOrigen: string | null; // 👈 dinámico (folio de req/pedido)

  creadoEn: string | null;
  actualizadoEn: string | null;
  detalles: CompraDetalleUI[];
  resumen: CompraResumenUI;
}

export interface CompraDetalleUI {
  id: number;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  creadoEn: string | null; // ISO
  actualizadoEn: string | null; // ISO
  producto: CompraProductoUI;
  presentacion?: Presentacion | null;
}

export interface Presentacion {
  codigoBarras: string;
  costoReferencialPresentacion: number;
  factorUnidadBase: number;
  id: number;
  nombre: string;
  sku: string;
  tipoPresentacion: string;
}

export interface CompraFacturaUI {
  numero: string | null;
  fecha: string | null; // ISO
}

export interface SimpleEntityUI {
  id: number | null;
  nombre: string;
}

export interface CompraUsuarioUI {
  id: number | null;
  nombre: string;
  correo: string;
}

export interface CompraRequisicionUI {
  id: number;
  folio: string;
  estado: string;
  fecha: string | null; // ISO
  totalLineas: number;
  createdAt: string | null; // ISO
  updatedAt: string | null; // ISO
  usuario: CompraUsuarioUI;
}

export interface CompraResumenUI {
  items: number;
  cantidadTotal: number;
  subtotal: number;
}

// export interface CompraRegistroUI {
//   id: number;
//   estado: EstadoCompra;
//   fecha: string | null; // ISO
//   total: number;
//   conFactura: boolean;
//   factura: CompraFacturaUI | null;
//   proveedor: SimpleEntityUI | null;
//   sucursal: SimpleEntityUI | null;
//   usuario: CompraUsuarioUI;
//   requisicion: CompraRequisicionUI | null;
//   creadoEn: string | null; // ISO
//   actualizadoEn: string | null; // ISO
//   detalles: CompraDetalleUI[];
//   resumen: CompraResumenUI;
// }
