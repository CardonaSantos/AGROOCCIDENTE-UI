export interface QueryTable {
  sucursalId: number;
  productoNombre: string;
  codigoProducto: string;
  fechaVencimiento: string;
  tiposPresentacion: number[];
  precio?: string;
  categorias: number[];
}
