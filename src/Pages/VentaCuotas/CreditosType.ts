interface Testigo {
  nombre: string;
  telefono: string;
  direccion: string;
}

export interface PresentacionesCreditoResponse {
  id: number;
  nombre: string;
  sku?: string;
  codigoBarras?: string;
}

export interface ProductoCreditoResponse {
  id: number;
  nombre: string;
  codigoProducto: string;
}

export interface ProductoVenta {
  id: number;
  ventaId: number;
  productoId: number | null; // <- acepta null
  presentacionId: number | null; // <- nuevo
  cantidad: number;
  creadoEn: string;
  precioVenta: number;
  producto?: ProductoCreditoResponse | null; // <- opcional/null
  presentacion?: PresentacionesCreditoResponse | null; // <- opcional/null
}

interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  dpi: string;
}

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
}

interface Usuario {
  id: number;
  nombre: string;
}
export interface Cuotas {
  id: number;
  creadoEn: string;
  estado: string;
  fechaPago: string | null;
  monto: number;
  montoEsperado?: number;
  comentario: string;
  usuario: { id: number; nombre: string } | null;
}

export interface PresentacionesCreditoResponse {
  id: number;
  nombre: string;
  sku?: string;
  codigoBarras?: string;
}

export interface ProductoCreditoResponse {
  id: number;
  nombre: string;
  codigoProducto: string;
}
export interface CreditoRegistro {
  id: number;
  clienteId: number;
  usuarioId: number;
  sucursalId: number;
  totalVenta: number;
  cuotaInicial: number;
  cuotasTotales: number;
  fechaInicio: string;
  estado: string;
  creadoEn: string;
  actualizadoEn: string;
  dpi: string;
  testigos: Testigo[];
  fechaContrato: string;
  montoVenta: number;
  garantiaMeses: number;
  totalPagado: number;
  cliente: Cliente;
  productos: ProductoVenta[];
  presentaciones: PresentacionesCreditoResponse[];
  sucursal: Sucursal;
  usuario: Usuario;
  cuotas: Cuotas[];
  diasEntrePagos: number;
  interes: number;
  comentario: string;
  montoTotalConInteres: number;
}
