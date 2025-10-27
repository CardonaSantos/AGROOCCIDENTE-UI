// src/domain/products.types.ts
// Tipos unificados para Producto / Presentación en UI + payloads al backend

// ===== Utilidades básicas =====
export type ID = number;
export type DecimalString = string; // el server espera strings para decimales

// ===== Enums de dominio (mantén estos valores iguales al backend) =====
export type RolPrecio =
  | "PUBLICO"
  | "AGROSERVICIO"
  | "FINCA"
  | "DISTRIBUIDOR"
  | "PROMOCION";

// ===== Catálogo / maestros =====
export interface Categoria {
  id: ID;
  nombre: string;
}

export interface TipoPresentacion {
  id: ID;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
}

// ===== Imágenes en UI =====
export type ExistingImage = { id?: ID; url: string; name?: string | null };
export type UploadImage = File;
export type UIMedia = UploadImage | ExistingImage;

// ===== Precio (como lo espera el server) =====
export interface PrecioProducto {
  rol: RolPrecio;
  orden: number;
  precio: DecimalString; // ¡en string!
}

// ===== Datos básicos de producto (UI) =====
export interface BasicInfo {
  nombre: string;
  codigoProducto: string;
  codigoProveedor?: string;
  stockMinimo: number;
  precioCostoActual: number;
  categorias: Categoria[];
  // relación flexible nuevo
  tipoPresentacionId: number | null;
  tipoPresentacion?: TipoPresentacion | null; // para mostrar label sin re-fetch
}

// ===== Presentación (UI) =====
// Compatible para crear/editar y para anidar dentro del producto en el editor
export interface Presentacion {
  id?: ID; // presente en edición
  nombre: string;
  codigoBarras?: string;
  tipoPresentacionId: ID | null; // relación flexible
  tipoPresentacion?: TipoPresentacion | null; // opcional para render
  costoReferencialPresentacion?: DecimalString; // string decimal
  descripcion?: string;
  stockMinimo: number; // si usas threshold, mapea al min correspondiente
  precios: PrecioProducto[];
  esDefault: boolean;
  imagenes: UIMedia[]; // archivos nuevos o imágenes existentes
  categorias?: Categoria[]; //nuevo
  activo?: boolean; // ✅ añade esto para coincidir con backend / payload
}

// ===== DTO del editor (UI) =====
export interface ProductFormDTO {
  basicInfo: BasicInfo;
  description: string;
  images: UIMedia[];
  prices: PrecioProducto[];
  presentations: Presentacion[];
}

// Alias para mantener compatibilidad con tu código actual
export type ProductCreateDTO = ProductFormDTO;

// ===== Detalle que retorna API (lectura) =====
// Minimizado a lo que usa el editor y mapeable 1:1 al formulario
export interface ProductDetailDTO {
  id: ID;
  nombre: string;
  descripcion?: string | null;
  codigoProducto: string;
  codigoProveedor?: string | null;

  // ⇨ el UI lo trata como number (input type="number")
  precioCostoActual: number;

  // ⇨ FALTABA: stock mínimo a nivel producto
  stockMinimo: number;

  categorias: Categoria[];

  // relación opcional a nivel producto
  tipoPresentacionId: number | null;
  tipoPresentacion?: TipoPresentacion | null;

  imagenesProducto: ExistingImage[];

  precios: Array<{ rol: RolPrecio; orden: number; precio: DecimalString }>;

  presentaciones: Array<{
    id: ID;
    nombre: string;
    codigoBarras?: string | null;
    tipoPresentacionId?: ID | null;
    tipoPresentacion?: TipoPresentacion | null;
    costoReferencialPresentacion?: DecimalString | null;
    descripcion?: string | null;
    stockMinimo?: number | null;
    precios: Array<{ rol: RolPrecio; orden: number; precio: DecimalString }>;
    imagenesPresentacion: ExistingImage[];
    esDefault: boolean;
    activo: boolean;

    // ⇨ FALTABA: categorías por presentación (tu mapper lo usa)
    categorias: Categoria[];
  }>;
}

// ===== Payloads para crear/actualizar en API =====
export interface PresentacionCreatePayload {
  id?: ID; // incluir al actualizar
  nombre: string;
  codigoBarras?: string | null;
  tipoPresentacionId: ID | null;
  costoReferencialPresentacion?: DecimalString | null;
  descripcion?: string | null;
  stockMinimo?: number;
  precios: PrecioProducto[];
  esDefault: boolean;
  // imágenes van por FormData (se adjuntan aparte)
  categoriaIds?: number[]; //nuevo
}

export interface ProductCreatePayload {
  nombre: string;
  descripcion?: string | null;
  codigoProducto: string;
  codigoProveedor?: string | null;
  stockMinimo: number;
  precioCostoActual?: number | null;
  categoriaIds: ID[];
  precios: PrecioProducto[];
  presentaciones: PresentacionCreatePayload[];
  // imágenes van por FormData
}

//NUEVO
// EDICION DE PRESENTACION
export interface PresentationDetailDTO {
  id: number;
  productoId: number; // útil para breadcrumbs o volver al producto

  nombre: string;
  codigoBarras?: string | null;

  tipoPresentacionId: number | null;
  tipoPresentacion: TipoPresentacion | null;

  costoReferencialPresentacion: DecimalString;
  descripcion?: string | null;
  stockMinimo: number | null;

  // precios: PrecioSalida[];
  precios: PrecioProducto[];

  esDefault: boolean;
  imagenesPresentacion: ExistingImage[];
  activo: boolean;

  categorias: Categoria[];
}
