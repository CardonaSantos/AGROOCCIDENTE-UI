// types/creditos.ts

/** ISO-8601 date string (ej. "2025-10-23T21:15:00.000Z") */
export type ISODate = string;

/** Estados posibles de una cuota (ajusta a tus enums reales si los conoces) */
export type EstadoCuota =
  | "PENDIENTE"
  | "PAGADA"
  | "VENCIDA"
  | "PARCIAL"
  | string; // fallback para no acoplar a Prisma directamente

/** Frecuencia de pago (ajusta a tus enums reales si los conoces) */
export type FrecuenciaPago =
  | "DIARIA"
  | "SEMANAL"
  | "QUINCENAL"
  | "MENSUAL"
  | string;

export interface SimpleCuota {
  id: number;
  monto: number;
  fechaVencimiento: ISODate;
  fechaPago: ISODate | null;
  numero: number;
  montoInteres: number;
  estado: EstadoCuota;
}

export interface SimpleCliente {
  id: number;
  /** nombre + apellidos concatenados desde el normalizer */
  nombre: string;
  telefono: string | null;
  direccion: string | null;
}

export interface SimpleCredit {
  id: number;
  comentario: string | null;
  fechaInicio: ISODate;
  frecuenciaPago: FrecuenciaPago;
  cliente: SimpleCliente;
  cuotas: SimpleCuota[];
}

/** Respuesta del endpoint getSimpleCredits */
export type SimpleCreditResponse = SimpleCredit[];
