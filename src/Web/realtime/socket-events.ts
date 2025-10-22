import { NormalizedSolicitud } from "@/Pages/NewDashboard/credit-authorizations/interfaces/Interfaces.interfaces";

//HELPER PARA DEFINIR EVENTOS
export type WsEventMap = {
  pong: { ts: number };
  whoami: { id: number; rol: string; sucursalId?: number };
  //TEST
  "noti:new": { title: string; body: string; meta?: unknown };
  "credit:request.created": {
    title: string;
    body: string;
    meta?: unknown;
    id: number;
    nuevoPrecio: number;
  };

  "ventas:created": { id: number; sucursalId: number; total: number };
  "ventas:invalidate": { reason: "created" | "updated" | "deleted" };

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

  "debug:hello": { ts: number };
  "credit:authorization.created": NormalizedSolicitud;
};

export type WsEventName = keyof WsEventMap;
