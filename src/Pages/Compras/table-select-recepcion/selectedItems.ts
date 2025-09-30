export type ItemKind = "PRESENTACION" | "PRODUCTO";

export interface PayloadRecepcionParcial {
  compraId: number;
  sucursalId: number;
  fecha: string | undefined;
  usuarioId: number;
  observaciones: string | undefined;
  lineas: ItemDetallesPayloadParcial[];
}

export interface ItemDetallesPayloadParcial {
  compraDetalleId: number;
  itemId: number; //puede ser producto o presentacion
  cantidadRecibida: number;
  precioCosto: number;
  fechaExpiracion: string | undefined;
  checked: boolean;
  tipo: "PRESENTACION" | "PRODUCTO";
}
