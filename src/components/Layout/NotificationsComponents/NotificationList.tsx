"use client";
import { AnimatePresence, motion } from "framer-motion";
import dayjs from "dayjs";
import "dayjs/locale/es";
import relativeTime from "dayjs/plugin/relativeTime";
import { UiNotificacionDTO } from "@/Web/realtime/notifications/notifications.type";
import { Inbox } from "lucide-react";
import MapNotifications from "./MapNotifications";

dayjs.extend(relativeTime);
dayjs.locale("es");

interface Props {
  notifications: UiNotificacionDTO[];
  isLoading?: boolean;
  onDelete?: (id: number) => void | Promise<void>;
}

function NotificationList({ notifications, isLoading, onDelete }: Props) {
  const ordered = (Array.isArray(notifications) ? notifications : [])
    .slice()
    .sort(
      (a, b) => dayjs(b.recibidoEn).valueOf() - dayjs(a.recibidoEn).valueOf()
    );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border p-3">
            <div className="h-3.5 w-1/3 bg-muted rounded mb-2" />
            <div className="h-3 w-2/3 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!ordered.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
        <Inbox className="h-8 w-8 mb-2 opacity-70" />
        <p className="font-medium">No hay notificaciones por ver</p>
        <p className="text-xs">Te avisaremos cuando llegue algo nuevo.</p>
      </div>
    );
  }

  return (
    <motion.ul layout className="space-y-2 pr-1">
      <AnimatePresence initial={false}>
        {ordered.map((n) => (
          <MapNotifications key={n.id} notification={n} onDelete={onDelete} />
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}

export default NotificationList;
