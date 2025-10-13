// ===== Enums sugeridos (ajusta a tus enums reales si ya existen) =====

import { MetodoPago } from "@/utils/components/SelectMethodPayment/PurchasePaymentFormDialog";

export type ComprobanteTipo =
  | "DEPOSITO_BOLETA"
  | "TRANSFERENCIA"
  | "CHEQUE"
  | "TARJETA_VOUCHER"
  | "OTRO";

export type MotivoMovimiento =
  | "PAGO_PROVEEDOR_BANCO" // eg. transferencia/cheque/tarjeta desde cuenta bancaria
  | "DEPOSITO_PROVEEDOR"; // eg. depósito en ventanilla/boleta al proveedor (efectivo)

// ===== Detalle de la imputación del pago a cuotas =====
export interface AplicacionCuota {
  cuotaId: number; // CxPCuota.id
  monto: string; // Decimal como string, p.ej. "1500.00"
  expectedSaldo?: string; // Opcional (concurrencia optimista)
}

// ===== Movimiento: base común =====
interface MovimientoBase {
  sucursalId: number;
  usuarioId: number; // quien registra el movimiento (auditoría)
  motivo: MotivoMovimiento;
  proveedorId?: number; // recomendado para reportes
  referencia?: string; // útil para idempotencia (Caja: único por turno)
  comprobanteTipo?: ComprobanteTipo;
  comprobanteNumero?: string;
  comprobanteFecha?: string; // ISO date (YYYY-MM-DD)
  comprobanteUrl?: string;
}

// ===== Movimiento por CAJA (efectivo) =====
export interface MovimientoCaja extends MovimientoBase {
  canal: "CAJA";
  registroCajaId: number; // turno de caja ABIERTO
  deltaCaja: string; // negativo: salida de efectivo, ej. "-800.00"
  esDepositoProveedor?: boolean; // true si es boleta/depósito directo al proveedor
  // (No incluye cuentaBancariaId ni deltaBanco)
}

// ===== Movimiento por BANCO =====
export interface MovimientoBanco extends MovimientoBase {
  canal: "BANCO";
  cuentaBancariaId: number; // nuestra cuenta bancaria
  deltaBanco: string; // negativo: salida de banco, ej. "-1500.00"
  comprobanteTipo: Exclude<ComprobanteTipo, "DEPOSITO_BOLETA">; // típico: TRANSFERENCIA/CHEQUE/TARJETA_VOUCHER/OTRO
  comprobanteNumero: string;
  // (No incluye registroCajaId ni deltaCaja)
}

// ===== Union discriminado =====
export type MovimientoPayload = MovimientoCaja | MovimientoBanco;

// ===== Payload principal =====
export interface PagoCxPPayload {
  documentoId: number; // CxPDocumento.id
  registradoPorId: number; // Usuario.id que crea el CxPPago
  fechaPago?: string; // ISO datetime
  metodoPago: MetodoPago; // EFECTIVO / TRANSFERENCIA / TARJETA / CHEQUE / OTRO
  monto: string; // total del pago; debe = sum(aplicaciones.monto)
  referencia?: string; // referencia del pago (voucher/nota interna)
  observaciones?: string;

  //   aplicaciones: AplicacionCuota[]; // distribución del pago a cuotas del MISMO documento SOLO PAGAR UNA

  //   movimiento: MovimientoPayload; // { canal: "CAJA" | "BANCO", ... } SE DECIDE EN EL SERVIDOR
}
