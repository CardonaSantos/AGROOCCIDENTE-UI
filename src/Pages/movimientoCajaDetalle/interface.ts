// src/Pages/CajaRegistros/Interfaces/movimientoCajaDetail.ts

export type EstadoCaja = "ABIERTO" | "CERRADO" | "ARQUEO";

export interface UsuarioSlim {
  id: number;
  nombre: string;
  rol?: string;
  correo: string;
}

enum ComprobanteTipo {
  DEPOSITO_BOLETA = "DEPOSITO_BOLETA",
  TRANSFERENCIA = "TRANSFERENCIA",
  CHEQUE = "CHEQUE",
  TARJETA_VOUCHER = "TARJETA_VOUCHER",
  OTRO = "OTRO",
}

export interface ProveedorSlim {
  id: number;
  nombre: string;
}

export interface SucursalSlim {
  id: number;
  nombre: string;
}

export interface CajaSlimDetail {
  id: number;
  comentario: string | null;
  comentarioFinal: string | null;
  fechaApertura: string; // ISO
  fechaCierre: string | null; // ISO | null
  saldoInicial: number;
  saldoFinal: number;
  estado: EstadoCaja;
  depositado: boolean;
  creadoEn: string; // ISO
  actualizadoEn: string; // ISO
  sucursal: SucursalSlim | null;
  usuarioInicio: UsuarioSlim | null;
  usuarioCierre: UsuarioSlim | null;
}

export interface MovimientoCajaDetail {
  id: number;
  creadoEn: string; // ISO
  actualizadoEn: string; // ISO
  banco: string | null;
  categoria: string | null; // o enum si lo tienes
  descripcion: string | null;
  fecha: string; // ISO
  monto: number;
  numeroBoleta: string | null;
  referencia: string | null;
  tipo: string; // o enum TipoMovimientoCaja
  usadoParaCierre: boolean;

  usuario: UsuarioSlim | null;
  proveedor: ProveedorSlim | null;

  caja: CajaSlimDetail | null; // puede ser null si el movimiento no quedó ligado a una caja

  //comprobante
  comprobanteTipo?: ComprobanteTipo | null;
  comprobanteFecha?: string | null;
  comprobanteNumero?: string | null;

  //nuevo
  clasificacion?: string; // ClasificacionAdmin
  motivo?: string; // MotivoMovimiento
  metodoPago?: string | null;

  deltaCaja?: number; // signo real del impacto en caja
  deltaBanco?: number;

  esDepositoCierre?: boolean;
  esDepositoProveedor?: boolean;

  gastoOperativoTipo?: string | null;
  costoVentaTipo?: string | null;
  afectaInventario?: boolean;

  cuentaBancaria?: {
    id: number;
    banco: string | null;
    alias: string | null;
    numeroMasked: string | null;
  } | null;
}
