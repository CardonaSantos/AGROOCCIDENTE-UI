// detalleRecepcionable.ts
export type TipoItem = "PRESENTACION" | "PRODUCTO";

export interface ProductoMini {
  id: number;
  nombre: string;
  codigo?: string | null;
  precioCosto: number; // viene del server para esa línea
  tipo: TipoItem;
}

export interface DetalleRecepcionable {
  id: number; // compraDetalleId
  cantidad: number;
  costoUnitario: number;
  producto: ProductoMini;
  fechaVencimiento: string | undefined;
  recibida: number; // acumulada
  pendiente: number; // server-calculado
  estadoDetalle: "PENDIENTE" | "PARCIAL" | "RECIBIDO";
}

export interface CompraRecepcionableResponse {
  id: number;
  estado: string;
  estadoCalculado: "ESPERANDO_ENTREGA" | "RECIBIDO" | "RECIBIDO_PARCIAL";
  detalles: DetalleRecepcionable[];
}
