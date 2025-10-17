// =========================
// Genérico de paginación
// =========================
export interface PaginationMeta {
  page: number; // 1-based
  limit: number; // tamaño de página
  total: number; // total de registros
  totalPages: number; // total de páginas
  hasNext: boolean;
  hasPrev: boolean;
  // El backend puede enviar "fechaVenta" aunque el campo en data sea "fecha".
  // Lo dejamos abierto para no romper si cambia.
  sortBy: string;
  sortDir: "asc" | "desc";
}

export interface ApiPage<T> {
  data: T[];
  meta: PaginationMeta;
}

// =========================
// Tipos comunes
// =========================
export type TipoComprobante = "RECIBO" | "FACTURA" | string;

// =========================
// Items de la venta (union discriminada)
// =========================
interface VentaItemBase {
  type: "PRODUCTO" | "PRESENTACION";
  ventaProductoId: number;
  codigo: string;
  nombre: string;
  descripcion: string; // según payload, viene string
  cantidad: number;
  precioVenta: number;
}

export interface VentaItemProducto extends VentaItemBase {
  type: "PRODUCTO";
  productoId: number;
  presentacionId?: never;
}

export interface VentaItemPresentacion extends VentaItemBase {
  type: "PRESENTACION";
  presentacionId: number;
  productoId?: never;
}

export type VentaItem = VentaItemProducto | VentaItemPresentacion;

// =========================
// Fila/registro que retorna el servidor en el listado
// =========================
export interface VentaResumen {
  id: number;

  // OJO: el backend devuelve 'fecha' y 'hora' (no 'fechaVenta'/'horaVenta')
  fecha: string; // ISO
  hora: string; // ISO

  // OJO: el backend devuelve 'total' (no 'totalVenta')
  total: number;

  clienteNombre: string;
  clienteTelefono: string | null;
  metodoPago: string;
  // OJO: ya no es objeto; es un string resumen
  metodoPagoResumen: string;

  referenciaPago: string | null;
  tipoComprobante: TipoComprobante;

  itemsCount: number;
  items: VentaItem[];
}

// =========================
// Respuesta del endpoint
// =========================
export type VentasApiResponse = ApiPage<VentaResumen>;

// =========================
// Helpers opcionales
// =========================
export const isPresentacionItem = (i: VentaItem): i is VentaItemPresentacion =>
  i.type === "PRESENTACION";

export const isProductoItem = (i: VentaItem): i is VentaItemProducto =>
  i.type === "PRODUCTO";
