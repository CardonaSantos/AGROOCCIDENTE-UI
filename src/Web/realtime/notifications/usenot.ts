// useNotificationsRealtime.ts
import { useEffect } from "react";
import { toast } from "sonner";
import { useSocketCtx, useSocketEvent } from "../SocketProvider";

// Payloads compatibles (nuevo y legacy)
type NotiNew = { title?: string; body?: string; meta?: unknown };
type LegacyNoti = {
  id?: number;
  mensaje?: string;
  remitenteId?: number | null;
  tipoNotificacion?: string;
  referenciaId?: number | null;
  fechaCreacion?: string;
};

export type UiNotification = {
  id?: number;
  title: string;
  body?: string;
  meta?: unknown;
  at?: string;
};

type Options = {
  onNew?: (n: UiNotification) => void; // si quieres guardarlas en estado global/local
  showToast?: boolean; // por defecto true
  legacyEventNames?: string[]; // por si el gateway todavía emite nombres viejos
};

/** Normaliza cualquier forma de notificación a un objeto UI */
function normalizeNoti(p: NotiNew | LegacyNoti | string): UiNotification {
  if (typeof p === "string")
    return { title: "Notificación", body: p, at: new Date().toISOString() };

  // Nuevo formato { title, body, meta }
  if ("title" in p || "body" in p) {
    return {
      title: p.title ?? "Notificación",
      body: p.body,
      meta: p.meta,
      at: new Date().toISOString(),
    };
  }

  // Legacy { mensaje, ... }
  if ("mensaje" in p) {
    return {
      id: (p as LegacyNoti).id,
      title: "Notificación",
      body: (p as LegacyNoti).mensaje ?? "",
      meta: {
        remitenteId: (p as LegacyNoti).remitenteId,
        tipoNotificacion: (p as LegacyNoti).tipoNotificacion,
        referenciaId: (p as LegacyNoti).referenciaId,
      },
      at: (p as LegacyNoti).fechaCreacion ?? new Date().toISOString(),
    };
  }

  // Fallback seguro
  return {
    title: "Notificación",
    body: JSON.stringify(p),
    at: new Date().toISOString(),
  };
}

export function useNotificationsRealtime(opts: Options = {}) {
  const { socket } = useSocketCtx();
  const {
    onNew,
    showToast = true,
    legacyEventNames = [
      "notification:new",
      "enviarNotificacion",
      "notificacion",
    ],
  } = opts;

  // 1) Nuevo evento tipado por tu WsEventMap
  useSocketEvent(
    "noti:new",
    (payload) => {
      const n = normalizeNoti(payload as any);
      if (showToast) toast(n.title, { description: n.body });
      onNew?.(n);
    },
    [onNew, showToast]
  );

  // 2) Compatibilidad con eventos legacy (si tu gateway aún no emite "noti:new")
  useEffect(() => {
    if (!socket) return;
    const handlers = legacyEventNames.map((ev) => {
      const h = (raw: any) => {
        const n = normalizeNoti(raw);
        if (showToast) toast(n.title, { description: n.body });
        onNew?.(n);
      };
      socket.on(ev, h);
      return { ev, h };
    });

    return () => {
      handlers.forEach(({ ev, h }) => socket.off(ev, h));
    };
  }, [socket, onNew, showToast, legacyEventNames]);
}
