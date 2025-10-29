import { NormalizedSolicitud } from "@/Pages/NewDashboard/credit-authorizations/interfaces/Interfaces.interfaces";
import {
  Solicitud,
  SolicitudTransferencia,
} from "@/Pages/NewDashboard/types/dashboard";

//HELPER PARA DEFINIR EVENTOS
export type WsEventMap = {
  pong: { ts: number };
  whoami: { id: number; rol: string; sucursalId?: number };
  //TEST
  // "noti:new": { title: string; body: string; meta?: unknown };
  "credit:request.created": {
    title: string;
    body: string;
    meta?: unknown;
    id: number;
    nuevoPrecio: number;
  };

  "ventas:created": { id: number; sucursalId: number; total: number };
  "ventas:invalidate": { reason: "created" | "updated" | "deleted" };

  recibirSolicitud: Solicitud;
  recibirSolicitudTransferencia: SolicitudTransferencia;

  "debug:hello": { ts: number };
  // "credit:authorization.created": NormalizedSolicitud;
  //nuevo
  "noti:new": any;
  "solicitud:precio": {
    solicitudId: number;
    comentario?: string;
    vendedorId: number;
  };
  "transferencia:solicitud": {
    id: number;
    monto: number;
    deSucursal: number;
    aSucursal: number;
  };
  "credit:authorization.created": NormalizedSolicitud;
};

export type WsEventName = keyof WsEventMap;
