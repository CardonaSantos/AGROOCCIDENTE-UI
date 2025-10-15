export type TipoItemRecepcion = "PRESENTACION" | "PRODUCTO";

export interface CreateRecepcionItem {
  compraDetalleId: number;
  refId: number;
  tipo: TipoItemRecepcion;
  cantidad: number;
  fechaVencimientoISO?: string | null;
}

export interface CreateRecepcionBlock {
  compraId: number;
  items: CreateRecepcionItem[];
}

export interface CreatePagoConRecepcionPayload {
  // canal
  cuentaBancariaId?: number;
  cajaId?: number;

  // pago
  documentoId: number;
  sucursalId: number;
  cuotaId: number;
  registradoPorId: number;
  fechaPago?: string; // ISO
  metodoPago:
    | "EFECTIVO"
    | "TRANSFERENCIA"
    | "TARJETA"
    | "CHEQUE"
    | "CREDITO"
    | "OTRO";
  monto: string; // "100.00"
  expectedCuotaSaldo?: string;
  referencia?: string;
  observaciones?: string;

  // opcional
  comprobanteTipo?: string;
  comprobanteNumero?: string;
  comprobanteFecha?: string;
  comprobanteUrl?: string;

  // NUEVO
  recepcion?: CreateRecepcionBlock;
}
