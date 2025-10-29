export interface ProductosResponse {
  data: ProductoData[];
  meta: MetaData;
}

export interface ProductoData {
  id: number;
  nombre: string;
  codigoProducto: string;
  descripcion: string;
  precioCosto: string;
  precios: Precio[];
  stocks: Stock[];
  globalStocks: Stock[];
  stocksBySucursal: StockBySucursal[];
  images: Image[]; // vacío, pero tipado para futuro uso
  __source: string;
}

export interface Precio {
  id: number;
  orden: number;
  precio: string;
  rol: string;
  tipo: string;
}

export interface Stock {
  id: number;
  cantidad: number;
  fechaIngreso: string;
  fechaVencimiento: string;
}

export interface StockBySucursal {
  sucursalId: number;
  nombre: string;
  cantidad: number;
}

export interface Image {
  // de momento vacío, puedes ampliarlo según tu modelo de imágenes
  id?: number;
  url?: string;
  descripcion?: string;
}

export interface MetaData {
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
  totals: {
    productos: number;
    presentaciones: number;
  };
}
