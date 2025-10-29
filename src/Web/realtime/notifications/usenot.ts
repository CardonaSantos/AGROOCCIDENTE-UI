// useNotificationsRealtime.ts
import { useEffect } from "react";
import { toast } from "sonner";
import { useSocketCtx, useSocketEvent } from "../SocketProvider";
import { UiNotificacionDTO } from "./notifications.type";
import { useQueryClient } from "@tanstack/react-query";
import { upsertArrayById } from "./helperUpdate";
import {
  NOTIFICATIONS_BASE_KEY,
  NOTIFICATIONS_QK,
} from "@/components/Layout/NotificationsComponents/Qk";

// Debounce simple para invalidar (opcional)
function createDebounced(fn: () => void, ms = 800) {
  let t: number | undefined;
  return () => {
    window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}

type Options = {
  onNew?: (n: UiNotificacionDTO) => void;
  showToast?: boolean;
  legacyEventNames?: string[];
  userId?: number; // 👈 para saber qué QK tocar
};

function normalizeNoti(p: UiNotificacionDTO): UiNotificacionDTO {
  return { ...p };
}

export function useNotificationsRealtime(opts: Options = {}) {
  const { socket } = useSocketCtx();
  const queryClient = useQueryClient();

  const {
    onNew,
    showToast = true,
    legacyEventNames = [
      "notification:new",
      "enviarNotificacion",
      "notificacion",
    ],
    userId, // 👈 importante
  } = opts;

  // invalidación debounced para reconciliar (opcional)
  const invalidateDebounced = createDebounced(() => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QK(userId) });
    } else {
      // si no hay userId, invalida por prefijo
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_BASE_KEY] });
    }
  }, 800);

  // 🔌 Evento "nuevo" moderno
  useSocketEvent(
    "noti:new",
    (payload) => {
      const n = normalizeNoti(payload as any);
      if (showToast) toast.info(n.titulo, { description: n.mensaje });

      // 1) Actualiza caché inmediato (UX instantánea)
      if (userId) {
        queryClient.setQueryData<UiNotificacionDTO[] | undefined>(
          NOTIFICATIONS_QK(userId),
          (prev) => upsertArrayById(prev, n, { prepend: true })
        );
      } else {
        // Si no tienes userId, actualiza todas las queries por prefijo
        queryClient.setQueriesData<UiNotificacionDTO[] | undefined>(
          { queryKey: [NOTIFICATIONS_BASE_KEY] },
          (prev) => upsertArrayById(prev, n, { prepend: true })
        );
      }

      onNew?.(n);

      // 2) (Opcional) reconciliar contra backend
      invalidateDebounced();
    },
    [onNew, showToast, userId]
  );

  // 🔌 Compatibilidad con nombres viejos
  useEffect(() => {
    if (!socket) return;
    const handlers = legacyEventNames.map((ev) => {
      const h = (raw: any) => {
        const n = normalizeNoti(raw);
        if (showToast)
          toast(n.categoria ?? "Notificación", { description: n.mensaje });

        if (userId) {
          queryClient.setQueryData<UiNotificacionDTO[] | undefined>(
            NOTIFICATIONS_QK(userId),
            (prev) => upsertArrayById(prev, n, { prepend: true })
          );
        } else {
          queryClient.setQueriesData<UiNotificacionDTO[] | undefined>(
            { queryKey: [NOTIFICATIONS_BASE_KEY] },
            (prev) => upsertArrayById(prev, n, { prepend: true })
          );
        }

        onNew?.(n);
        invalidateDebounced();
      };
      socket.on(ev, h);
      return { ev, h };
    });

    return () => {
      handlers.forEach(({ ev, h }) => socket.off(ev, h));
    };
  }, [socket, onNew, showToast, legacyEventNames, userId, queryClient]);
}
