export type RequisitionEstado =
  | "BORRADOR"
  | "PENDIENTE"
  | "APROBADA"
  | "ENVIADA"
  | "RECIBIDA"
  | "COMPLETADA"
  | "CANCELADA"
  | "ENVIADA_COMPRAS";

export interface UsuarioResumen {
  id: number;
  nombre: string;
  rol: "ADMIN" | "USER" | "SUPERVISOR" | string;
}

export interface SucursalResumen {
  id: number;
  nombre: string;
}

export interface ProductoResumen {
  id: number;
  codigoProducto: string;
  nombre: string;
  precioCostoActual: number; // número simple para UI
}

export interface PresentacionResumen {
  id: number;
  nombre: string;
  factorUnidadBase: number; // ya convertido desde Decimal
  sku: string | null;
  codigoBarras: string | null;
  tipoPresentacion: string; // TipoEmpaque
  costoReferencialPresentacion: number | null; // ya convertido desde Decimal
}

export interface RequisitionLineDTO {
  id: number;
  productoId: number;
  presentacionId: number | null;
  esPresentacion: boolean;

  cantidadActual: number;
  stockMinimo: number;
  cantidadSugerida: number;

  precioUnitario: number; // “precio usable” ya resuelto
  subtotal: number;

  fechaExpiracion: string | null; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO

  producto: ProductoResumen;
  presentacion: PresentacionResumen | null;
}

export interface RequisitionResponseDTO {
  id: number;
  folio: string;
  fecha: string; // ISO
  sucursalId: number;
  usuarioId: number;
  estado: RequisitionEstado;
  observaciones: string | null;

  totalLineas: number;
  totalRequisicion: number;

  createdAt: string; // ISO
  updatedAt: string; // ISO
  ingresadaAStock: boolean;

  usuario: UsuarioResumen;
  sucursal: SucursalResumen;
  lineas: RequisitionLineDTO[];
}
