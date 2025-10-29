// notification.types.ts
export enum NotiCategory {
  VENTAS = "VENTAS", // Ventas / precios / POS
  INVENTARIO = "INVENTARIO", // Stock, vencimiento, transferencias
  CREDITO = "CREDITO", // Cuentas por cobrar (CxC)
  CUENTAS_POR_PAGAR = "CUENTAS_POR_PAGAR", // CxP
  GARANTIA = "GARANTIA",
  REPARACIONES = "REPARACIONES",
  COMPRAS = "COMPRAS",
  LOGISTICA = "LOGISTICA",
  SISTEMA = "SISTEMA",
  SEGURIDAD = "SEGURIDAD",
  FACTURACION = "FACTURACION",
  OTROS = "OTROS",
}

export enum NotiSeverity {
  INFORMACION = "INFORMACION",
  EXITO = "EXITO",
  ALERTA = "ALERTA", // o "ADVERTENCIA"
  ERROR = "ERROR",
  CRITICO = "CRITICO",
}

export enum NotiAudience {
  USUARIOS = "USUARIOS", // notificaciones dirigidas a usuarios específicos
  ROL = "ROL", // intención a un rol
  SUCURSAL = "SUCURSAL", // intención a una sucursal
  GLOBAL = "GLOBAL", // intención global/sistema
}

export type UiNotificacionDTO = {
  id: number;
  titulo: string | null;
  mensaje: string;
  categoria: NotiCategory;
  subtipo: string | null;
  severidad: NotiSeverity;
  route: string | null;
  actionLabel: string | null;
  meta?: Record<string, any> | null;
  referencia?: { tipo: string | null; id: number | null } | null;
  sucursalId: number | null;

  // estado por usuario
  leido: boolean;
  eliminado: boolean;
  recibidoEn: string; // ISO
  leidoEn: string | null;
  dismissedAt: string | null;

  // emisor minimal
  remitente?: { id: number; nombre: string | null } | null;
};
