// Enums (ajusta/expande si en tu schema hay más valores)
export enum TipoMovimientoCaja {
  INGRESO = "INGRESO",
  EGRESO = "EGRESO",
  DEPOSITO_BANCO = "DEPOSITO_BANCO",
  VENTA = "VENTA", // opcional: por si tu API lo usa en otros casos
  ABONO = "ABONO",
  RETIRO = "RETIRO",
  CHEQUE = "CHEQUE",
  TRANSFERENCIA = "TRANSFERENCIA",
  AJUSTE = "AJUSTE",
  DEVOLUCION = "DEVOLUCION",
  OTRO = "OTRO",
}

export enum CategoriaMovimiento {
  DEPOSITO_CIERRE = "DEPOSITO_CIERRE",
  GASTO_OPERATIVO = "GASTO_OPERATIVO",
  COSTO_VENTA = "COSTO_VENTA",
  DEPOSITO_PROVEEDOR = "DEPOSITO_PROVEEDOR",
  INGRESO = "INGRESO",
}

export enum EstadoCaja {
  ABIERTO = "ABIERTO",
  CERRADO = "CERRADO",
  ARQUEO = "ARQUEO",
  AJUSTADO = "AJUSTADO",
  ANULADO = "ANULADO",
}

// Slims
export interface UsuarioSlim {
  id: number;
  nombre: string;
  rol: string;
  correo: string;
}

export interface ProveedorSlim {
  id: number;
  nombre: string;
}

export interface SucursalSlim {
  id: number;
  nombre: string;
}

// Caja (resumen que llega incrustado en cada movimiento)
export interface CajaSlim {
  id: number;
  comentario: string | null;
  comentarioFinal: string | null;
  fechaApertura: string; // ISO
  fechaCierre: string | null; // puede venir null si aún abierta
  saldoInicial: number;
  saldoFinal: number;
  estado: EstadoCaja;
  depositado: boolean;
  creadoEn: string; // ISO
  actualizadoEn: string; // ISO
  sucursal: SucursalSlim;
}

// Item principal del array `items`
export interface MovimientoCajaItem {
  id: number;
  creadoEn: string; // ISO
  actualizadoEn: string; // ISO
  banco: string | null;
  categoria: CategoriaMovimiento | (string & {}) | null;
  descripcion: string | null;
  fecha: string; // ISO
  monto: number;
  numeroBoleta: string | null;
  referencia: string | null;
  tipo: TipoMovimientoCaja | (string & {}); // por si aparece otro tipo
  usadoParaCierre: boolean;
  usuario: UsuarioSlim | null;
  proveedor: ProveedorSlim | null;
  caja: (CajaSlim & { estado: EstadoCaja; depositado: boolean }) | null;
}

// Respuesta paginada
export interface PagedResponseMovimientos {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: MovimientoCajaItem[];
}
