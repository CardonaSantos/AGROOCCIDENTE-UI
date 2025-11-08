import {
  ClasificacionAdmin,
  CostoVentaTipo,
  MotivoMovimiento,
} from "../Caja/Movimientos/movimientos-financieros";
import { MetodoPagoMainPOS } from "../POS/interfaces/methodPayment";

export type CajaConSaldoOption = {
  id: number;
  label?: string;
  saldoInicial?: number | string;
  disponibleEnCaja: number | string;
};

export type CuentaBancariaOption = {
  id: number;
  nombre: string;
};

// Payload que espera tu DTO: dto.mf
export interface MovimientoFinancieroDraft {
  sucursalId?: number;
  motivo: MotivoMovimiento; // COMPRA_MERCADERIA | COSTO_ASOCIADO
  clasificacionAdmin?: ClasificacionAdmin; // COSTO_VENTA (por defecto)
  metodoPago: MetodoPagoMainPOS;
  descripcion: string;
  proveedorId?: number;
  afectaInventario: boolean; // true → prorratea al costo de inventario
  monto: number; // Q
  costoVentaTipo: CostoVentaTipo; // MERCADERIA, FLETE, ENCOMIENDA, TRANSPORTE, OTROS
  cuentaBancariaId?: number;
  registroCajaId?: number;
}

// Metadatos opcionales de prorrateo (frontend → backend)
export interface ProrrateoMeta {
  aplicar: boolean;
  base: "COSTO" | "CANTIDAD"; // cómo distribuir el costo asociado
  incluirAntiguos?: boolean; // <= NUEVO
}

export interface CostosAsociadosDialogResult {
  mf: MovimientoFinancieroDraft;
  prorrateo?: ProrrateoMeta;
}
