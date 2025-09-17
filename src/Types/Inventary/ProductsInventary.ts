import { RolPrecio } from "@/Pages/Edit/EditProduct";
import { TipoPrecio } from "@/Pages/producto/interfaces/preciosCreateInterfaces";

type Proveedor = {
  nombre: string;
};

type EntregaStock = {
  proveedor: Proveedor;
};

type Sucursal = {
  id: number;
  nombre: string;
};

type Stock = {
  id: number;
  cantidad: number;
  fechaIngreso: string; // En formato ISO
  fechaVencimiento: string; // En formato ISO
  entregaStock: EntregaStock;
  sucursal: Sucursal;
};

type Categoria = {
  id: number;
  nombre: string;
};

type Precios = {
  id: number;
  precio: number;
  orden: number;
  rol: RolPrecio;
  tipo: TipoPrecio;
  usado: boolean;
};

type stockThresholds = {
  id: number;
  stockMinimo: number;
};

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  codigoProducto: string;
  creadoEn: string; // En formato ISO
  actualizadoEn: string; // En formato ISO
  categorias: Categoria[];
  stock: Stock[];
  precios: Precios[];
  precioCostoActual: number;
  stockThreshold: stockThresholds;
};

export type ProductsInventary = Producto;

export type Producto2 = Producto;
