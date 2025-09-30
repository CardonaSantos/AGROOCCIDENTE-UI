// Enums reusables
enum TipoPagoRecepcion {
  PREPAGO = "PREPAGO",
  NINGUNO = "NINGUNO",
  CONTADO = "CONTADO",
  CREDITO = "CREDITO",
}

enum MetodoPagoContado {
  EFECTIVO = "EFECTIVO",
  TRANSFERENCIA = "TRANSFERENCIA",
  TARJETA = "TARJETA",
  CHEQUE = "CHEQUE",
}

// DTO principal
export type CrearRecepcionDto = {
  usuarioId: number;
  observaciones?: string;
  // Una o más líneas de la compra que vas a recepcionar:
  lineas: Array<{
    compraDetalleId: number;
    lotes: Array<{
      cantidad: number;
      fechaExpiracion?: string | null;
      presentacionId?: number | null;
    }>;
  }>;
  // Manejo del pago de esta recepción
  pago:
    | { tipo: TipoPagoRecepcion.PREPAGO }
    | { tipo: TipoPagoRecepcion.NINGUNO }
    | {
        tipo: TipoPagoRecepcion.CONTADO;
        metodo: MetodoPagoContado;
        //registroCajaId?: number; // requerido si EFECTIVO (SE BUSCA CAJA EN EL SERVIDOR)
        cuentaBancariaId?: number; // requerido si TRANSFERENCIA/TARJETA/CHEQUE
      }
    | {
        tipo: TipoPagoRecepcion.CREDITO;
        condicionPagoId?: number;
        paramsPlanPago?: {
          cantidadCuotas: number;
          diasEntrePagos: number;
          interes?: string; // ej. "2.50"
          tipoInteres?: "NONE" | "SIMPLE" | "COMPUESTO";
          fechaInicio?: string; // ISO
        };
      };
};
