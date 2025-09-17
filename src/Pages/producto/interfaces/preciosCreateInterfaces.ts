export interface PrecioProductoInventario {
  precio: string;
  orden: number;
  rol: RolPrecio;
}

export enum RolPrecio {
  PUBLICO = "PUBLICO",
  AGROSERVICIO = "AGROSERVICIO",
  FINCA = "FINCA",
  DISTRIBUIDOR = "DISTRIBUIDOR",
  PROMOCION = "PROMOCION",
}

export enum TipoPrecio {
  CREADO_POR_SOLICITUD = "CREADO_POR_SOLICITUD",
  ESTANDAR = "ESTANDAR",
}

export enum TipoEmpaque {
  CUBETA = "CUBETA",
  BIDON = "BIDON",
  TAMBOR = "TAMBOR",
  BLISTER = "BLISTER",
  UNIDAD = "UNIDAD",
  BOTELLA = "BOTELLA",
  CAJA = "CAJA",
  PACK = "PACK",
  SACO = "SACO",
}

export const TIPO_EMPAQUE_VALUES = Object.values(TipoEmpaque);

export interface PreciosPresentacion extends PrecioProductoInventario {}
//COMPUESTA GENERAL A USAR:
export interface Presentacion {
  nombre: string; // "1 L", "500 ml", "Saco 46 kg"
  factorUnidadBase: string; // "1000", "0.5", etc.
  sku?: string;
  codigoBarras?: string;
  esDefault?: boolean; // si true, forzará a ser la default
  precios: PreciosPresentacion[]; //precios con formato igual al de precio
  //nuevo
  tipoPresentacion: TipoEmpaque;
  costoReferencialPresentacion: string;
}
