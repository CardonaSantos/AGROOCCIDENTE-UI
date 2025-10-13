// src/utils/credito.helpers.ts

import { UICreditoCompra } from "./interfaces/interfaces";

export function makeEmptyCredito(): UICreditoCompra {
  const epoch = new Date(0).toISOString();
  return {
    id: 0,
    folioProveedor: null,
    estado: "DESCONOCIDO",
    fechaEmisionISO: epoch,
    fechaVencimientoISO: null,

    montoOriginal: 0,
    interesTotal: 0,

    // Si prefieres evitar checks opcionales, puedes setear un objeto por defecto.
    // Si no, cámbialo a `condicionPago: undefined` y tu UI usa `?.`
    condicionPago: {
      id: 0,
      nombre: null,
      interes: 0,
      diasCredito: 0,
      diasEntreCuotas: 0,
      tipoInteres: null,
      modoGeneracion: null,
      cantidadCuotas: 0,
    },

    totalCuotas: 0,
    cuotasPagadas: 0,
    cuotasPendientes: 0,
    totalPagado: 0,
    saldoPendiente: 0,

    cuotas: [],

    createdAtISO: epoch,
    updatedAtISO: epoch,
  };
}

/** Útil para saber si ya hay data real o seguimos en el estado inicial */
export function isCreditoLoaded(c: UICreditoCompra): boolean {
  return c.id > 0 || c.totalCuotas > 0 || c.saldoPendiente > 0;
}
