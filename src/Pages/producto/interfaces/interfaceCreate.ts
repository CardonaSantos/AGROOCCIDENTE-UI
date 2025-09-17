import { PrecioProductoInventario } from "./preciosCreateInterfaces";

///INTERFACES PARA INVENTARIO
interface Categorias {
  id: number;
  nombre: string;
}
export type PrecioProductoDTO = PrecioProductoInventario;

export interface ProductCreate {
  nombre: string;
  descripcion: string;
  categorias: Categorias[];
  codigoProducto: string;
  codigoProveedor: string;

  precioVenta: PrecioProductoDTO[];
  creadoPorId: number | null;
  precioCostoActual: number | null;
  stockMinimo: number | null;
  imagenes: number[];
}
