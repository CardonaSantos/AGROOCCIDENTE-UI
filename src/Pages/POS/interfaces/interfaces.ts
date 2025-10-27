export interface NewQueryDTO {
  nombreItem: string;
  tipoEmpaque: number[];
  codigoItem: string;
  codigoProveedor: string;
  cats: number[];
  priceRange: string;
  sucursalId: number;
  limit: number;
  page: number;
}
