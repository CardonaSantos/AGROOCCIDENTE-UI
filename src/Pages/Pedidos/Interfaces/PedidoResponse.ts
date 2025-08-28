// /Pages/Pedidos/Interfaces/pedidoDetalle.interface.ts

import { PedidoPrioridad, TipoPedido } from "./createPedido.interfaces";

export interface PedidoDetalleUI {
  id: number;
  folio: string;
  fecha: string;
  estado: string;
  tipo: TipoPedido;
  prioridad: PedidoPrioridad;
  observaciones?: string | null;
  totalLineas: number;
  totalPedido: number;
  creadoEn: string;
  actualizadoEn: string;

  cliente?: {
    id: number;
    nombre: string;
    telefono: string;
    direccion: string;
    observaciones: string;
    apellidos?: string | null;
  } | null;

  sucursal: {
    id: number;
    nombre: string;
  };

  usuario: {
    id: number;
    nombre: string;
    correo: string;
  };

  lineas: Array<{
    id: number;
    pedidoId: number;
    productoId: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    notas?: string | null;
    creadoEn: string;
    actualizadoEn: string;
    producto: {
      id: number;
      nombre: string;
      codigoProducto: string;
      codigoProveedor?: string | null;
      descripcion?: string | null;
      precioCostoActual: number;
      categorias: Array<{
        id: number;
        nombre: string;
      }>;
      imagenesProducto?: Array<{ url: string }>;
      imagenUrl?: string | null;
    };
  }>;
}
