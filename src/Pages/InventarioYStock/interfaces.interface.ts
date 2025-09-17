export type Provider = {
  id: number;
  nombre: string;
};

export type StockEntry = {
  productoId: number;
  cantidad: number;
  costoTotal: number;
  fechaIngreso: string;
  fechaVencimiento?: string;
  precioCosto: number;
  proveedorId: number;
};

export interface GroupedStock {
  nombre: string; // Name of the branch
  cantidad: number; // Total quantity of stock
}

export interface SucursalProductSelect {
  id: number;
  nombre: string;
}

export interface StockProductoSelect {
  cantidad: number;
  id: number;
  sucursal: SucursalProductSelect;
}
export interface ProductoSelect {
  id: number;
  nombreProducto: string;
  precioCostoActual: number;
  stock: StockProductoSelect[];
}

export interface GroupedStock {
  nombre: string; // Name of the branch
  cantidad: number; // Total quantity of stock
}

///INTERFACES PARA INVENTARIO
export interface ProductCreate {
  nombre: string;
  descripcion: string;
  categorias: number[];
  codigoProducto: string;
  codigoProveedor: string;

  precioVenta: number[];
  creadoPorId: number | null;
  precioCostoActual: number | null;
  stockMinimo: number | null;
  imagenes: number[];
}

export interface Categorias {
  id: number;
  nombre: string;
}

//INTERFACES PARA CATEGORIAS
export interface Category {
  id: number;
  nombre: string;
}
