// types/responses.ts

// 🔹 Enum local para tipar el tipo de empaque de la presentación
export type TipoPresentacionUI =
  | "CUBETA"
  | "BIDON"
  | "TAMBOR"
  | "BLISTER"
  | "UNIDAD"
  | "BOTELLA"
  | "CAJA"
  | "PACK"
  | "SACO";

// 🔹 Bloque mínimo de presentación que llega en los detalles
export interface PresentacionMinimalUI {
  id: number;
  nombre: string; // e.g., "500 ml", "1 L", "Saco 46 kg"
  sku: string | null;
  codigoBarras: string | null;
  tipoPresentacion: TipoPresentacionUI | null;
  factorUnidadBase: number; // ya viene mapeado a number en el server
  costoReferencialPresentacion: number; // number (server lo normaliza)
}

// ⬇️ Ajuste: añadimos `presentacion` al detalle (nullable para compatibilidad)
export interface CompraDetalleUI {
  id: number;
  cantidad: number;
  costoUnitario: number; // costo por PRESENTACIÓN
  subtotal: number;
  creadoEn: string | null;
  actualizadoEn: string | null;

  producto: {
    id: number | null;
    nombre: string;
    codigo: string;
    precioCostoActual: number | null;
  };

  // NUEVO ✅: presente cuando el detalle viene por presentación
  presentacion?: PresentacionMinimalUI | null;
}

// (Sin cambios)
export interface CompraFacturaUI {
  numero: string | null;
  fecha: string | null;
}

export interface CompraProveedorUI {
  id: number | null;
  nombre: string;
}

export interface CompraUsuarioUI {
  id: number | null;
  nombre: string;
  correo: string;
}

export interface CompraRequisicionUI {
  id: number;
  folio: string;
  estado: string;
  fecha: string | null;
  totalLineas: number;
  usuario: CompraUsuarioUI;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CompraResumenUI {
  items: number;
  cantidadTotal: number;
  subtotal: number;
}

interface Pedido {
  id: number;
  folio: string;
}

export interface CompraListItem {
  folioOrigen: string;
  tipoOrigen: string;
  id: number;
  estado: "RECIBIDO" | "CANCELADO" | "RECIBIDO_PARCIAL" | "ESPERANDO_ENTREGA";
  total: number;
  fecha: string | null;
  conFactura: boolean;
  proveedor: CompraProveedorUI | null;
  factura: CompraFacturaUI | null;
  usuario: CompraUsuarioUI;
  requisicion: CompraRequisicionUI | null;
  creadoEn: string | null;
  actualizadoEn: string | null;

  // ⬇️ Cada detalle ahora puede traer su presentación
  detalles: CompraDetalleUI[];

  resumen: CompraResumenUI;
  pedido: Pedido;
}

// ⚠️ Si más adelante usas la respuesta agrupada por proveedor del server,
// podríamos añadir una interfaz opcional como esta:
//
// export interface PaginatedComprasGroupedByProveedor {
//   total: number;
//   page: number;
//   limit: number;
//   pages: number;
//   itemsByProveedor: Array<{
//     proveedor: CompraProveedorUI;
//     registros: CompraListItem[];
//   }>;
// }
//
// ...y mantener PaginatedComprasResponse tal cual para el listado normal.
export interface PaginatedComprasResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: CompraListItem[];
}
