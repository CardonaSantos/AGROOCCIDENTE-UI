// Pages/Pedidos/Interfaces/productsList.interfaces.ts

// === Enums/Unions UI (alineados con Prisma) ===
export type TipoEmpaqueUI =
  | "CUBETA"
  | "BIDON"
  | "TAMBOR"
  | "BLISTER"
  | "UNIDAD"
  | "BOTELLA"
  | "CAJA"
  | "PACK"
  | "SACO";

// === Reutilizable para agregados por sucursal ===
export interface StockSucursal {
  sucursalId: number;
  sucursalNombre: string;
  cantidad: number; // unidades base (para producto) o # presentaciones (para presentaciones)
}

// === Presentaciones del producto (para pedidos) ===
export interface ProductoPresentacionToPedido {
  id: number;
  nombre: string;
  /** Cantidad de unidades base contenidas en 1 presentación. */
  factorUnidadBase: number;
  esDefault: boolean;
  activo: boolean;
  sku: string | null;
  codigoBarras: string | null;
  tipoPresentacion: TipoEmpaqueUI;
  /** Costo referencial por presentación (si aplica). */
  costoReferencialPresentacion: number | null;

  /** Stock por sucursal en CANTIDAD DE PRESENTACIONES (no unidades base). */
  stockPorSucursal: StockSucursal[];
}

// === Producto para listado de pedidos ===
export interface ProductoToPedidoList {
  id: number;
  nombre: string;
  codigoProducto: string;
  codigoProveedor: string | null;
  descripcion: string | null;
  /** Precio costo actual del producto (unidad base). */
  precioCostoActual: number;
  /** Unidad base del producto (ej. "unidades", "ml", "g"). */
  unidadBase: string;

  /** Stock por sucursal en UNIDADES BASE (acumulado). */
  stockPorSucursal: StockSucursal[];

  /** Presentaciones disponibles del producto (puede venir vacío). */
  presentaciones: ProductoPresentacionToPedido[];
}

// === Respuesta paginada del endpoint /pedidos/productos-to-pedido ===
export interface ProductsResponse {
  data: ProductoToPedidoList[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
