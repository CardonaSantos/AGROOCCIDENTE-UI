export interface QueryTable {
  sucursalId: number;
  productoNombre: string;
  codigoProducto: string;
  fechaVencimiento: string;
  tipoPresentacion?: string[];
  precio?: string;
  categorias: number[];
}
