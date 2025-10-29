"use client";
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UiNotificacionDTO } from "@/Web/realtime/notifications/notifications.type";
import { X, User } from "lucide-react";
import {
  getSeverityStyles,
  getCategoryMeta,
  extractMeta,
} from "./notification-style";

dayjs.extend(relativeTime);
dayjs.locale("es");

interface Props {
  notification: UiNotificacionDTO;
  onDelete?: (id: number) => void | Promise<void>;
}

function MapNotificationCompact({ notification, onDelete }: Props) {
  const sev = useMemo(
    () => getSeverityStyles(notification.severidad),
    [notification.severidad]
  );
  const cat = useMemo(
    () => getCategoryMeta(notification.categoria),
    [notification.categoria]
  );
  const meta = useMemo(() => extractMeta(notification), [notification]);
  const recibido = dayjs(notification.recibidoEn).fromNow();

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, margin: 0, padding: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
    >
      <div
        className={[
          "relative rounded-xl border shadow-sm ring-1 p-3 md:p-3.5",
          "grid grid-cols-[auto,1fr,auto] gap-3 md:gap-4 items-start",
          sev.cardBg,
          sev.ring, // <- ahora sí son clases reales
        ].join(" ")}
        style={{ wordBreak: "break-word" }}
      >
        {/* barra de acento (sin before:) */}
        <span
          className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${sev.accent}`}
          aria-hidden
        />

        {/* ícono severidad (chico) */}
        <div className={`mt-0.5 rounded-md p-1.5 ${sev.accent} text-white`}>
          <sev.Icon className="h-3 w-3" />
        </div>

        {/* contenido */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <cat.Icon className="h-4 w-4 opacity-80 shrink-0" />
            <h3
              className={`text-[13px] font-semibold leading-5 ${sev.title} truncate`}
            >
              {notification.titulo ?? "Notificación"}
            </h3>
          </div>

          <p className={`mt-1 text-[13px] leading-5 ${sev.body}`}>
            {notification.mensaje}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {meta.producto && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                {meta.producto}
              </Badge>
            )}

            {meta.solicitante && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5 flex items-center gap-1"
              >
                <User className="h-3 w-3" /> {meta.solicitante}
              </Badge>
            )}
            {meta.precio && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                {meta.precio}
              </Badge>
            )}
          </div>
        </div>

        {/* tiempo + eliminar (alineado arriba a la derecha) */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-[11px] font-semibold leading-6 text-black dark:text-white">
            {recibido}
          </span>
          <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7 md:h-8 md:w-8"
            onClick={() => onDelete?.(notification.id)}
            title="Eliminar notificación"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.li>
  );
}

export default memo(MapNotificationCompact);
