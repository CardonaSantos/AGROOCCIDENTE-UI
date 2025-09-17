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
export type SelectedScope = "PRODUCTO" | "PRESENTACION";
export type SelectedKey = `prod-${number}` | `pres-${number}`;
export type SelectedLine = {
  scope: SelectedScope;
  productoId?: number;
  presentacionId?: number;
  cantidad: number;
  fechaExpiracion: string | null;
  // precio editable (string para no perder precisión; UI acepta número)
  precioCostoUnitario: string;
  actualizarCosto: boolean;
};
export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
export type TipoPresentacion =
  | "CUBETA"
  | "BIDON"
  | "TAMBOR"
  | "BLISTER"
  | "UNIDAD"
  | "BOTELLA"
  | "CAJA"
  | "PACK"
  | "SACO";

export type RequisitionProductCandidate = {
  productoId: number;
  nombre: string;
  codigoProducto: string | null;
  unidadBase: string;
  precioCostoProducto: number | null; // Float? del producto

  // stock y threshold (unidades base)
  stockBase: number;
  stockPresentacionesEq: string; // Decimal string
  stockTotalEq: string; // Decimal string
  stockMinimo: number;
  belowThreshold: boolean;
  faltanteSugerido: number;

  pendientesProductoFolios: string[];

  presentaciones: Array<{
    id: number;
    nombre: string;
    tipoPresentacion: TipoPresentacion;
    factorUnidadBase: string; // Decimal string
    costoReferencialPresentacion: string | null; // Decimal string (precio por presentación)
    sku: string | null;
    codigoBarras: string | null;
    esDefault: boolean;
    activo: boolean;

    stockCantidadPresentacion: number; // unidades de esa presentación
    stockEquivalenteBase: string; // cantidad * factor
    pendientesFolios: string[];
  }>;
};
export const keyForProducto = (id: number): `prod-${number}` => `prod-${id}`;
export const keyForPresentacion = (id: number): `pres-${number}` =>
  `pres-${id}`;
