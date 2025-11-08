export interface PaginatedInventarioResponse {
  data: ProductoInventarioResponse[];
  meta: {
    totalCount: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export interface ProductoInventarioResponse {
  id: number;
  nombre: string;
  precioCosto: string;
  codigoProducto: string;
  descripcion: string;
  image: string | undefined;
  images: ImagesProduct[];
  tipoPresentacion?: TipoEmpaque;
  precios: PrecioProductoNormalized[];
  stocks: StocksProducto[];
  stocksBySucursal: StocksBySucursal;
  type: "PRODUCTO" | "PRESENTACION";
  productoId: number;
}

export interface ImagesProduct {
  url: string | undefined;
}

export interface PrecioProductoNormalized {
  id: number;
  precio: string;
  rol: RolPrecio;
  tipo: TipoPrecio;
  orden: number;
}
export type StocksBySucursal = StockPorSucursal[];

export interface StockPorSucursal {
  sucursalId: number;
  nombre: string;
  cantidad: number;
}

export interface StocksProducto {
  id: number;
  cantidad: number;
  fechaIngreso: string;
  fechaVencimiento: string;
  costoUnitario: number;
  prorrateo: Prorrateo[];
}
export interface Prorrateo {
  id: number;
  costoFacturaUnitario: number;
  costoProrrateadoTotalInversion: number;
  costoUnitarioProrrateado: number;
  costoUnitarioResultante: number;
  creadoEn: Date;
  existenciasPrevias: number;
  gastoUnitarioAplicado: number;
  gastoUnitarioBase: number;
  inversionLinea: number;
  inversionPrevias: number;
  nuevasExistencias: number;
}

export enum RolPrecio {
  PUBLICO = "PUBLICO",
  AGROSERVICIO = "AGROSERVICIO",
  FINCA = "FINCA",
  DISTRIBUIDOR = "DISTRIBUIDOR",
  PROMOCION = "PROMOCION",
}

export enum TipoEmpaque {
  CUBETA = "CUBETA",
  BIDON = "BIDON",
  TAMBOR = "TAMBOR",
  BLISTER = "BLISTER",
  UNIDAD = "UNIDAD",
  BOTELLA = "BOTELLA",
  CAJA = "CAJA",
  PACK = "PACK",
  SACO = "SACO",
}

enum TipoPrecio {
  CREADO_POR_SOLICITUD = "CREADO_POR_SOLICITUD",
  ESTANDAR = "ESTANDAR",
}
