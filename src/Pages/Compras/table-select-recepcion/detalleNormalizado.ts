export interface DetalleNormalizado {
  id: number;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  creadoEn: string | null;
  actualizadoEn: string | null;
  producto: {
    id: number;
    nombre: string;
    codigo?: string;
    sku?: string;
    precioCosto: number;
    tipo: "PRESENTACION" | "PRODUCTO";
  };
}
