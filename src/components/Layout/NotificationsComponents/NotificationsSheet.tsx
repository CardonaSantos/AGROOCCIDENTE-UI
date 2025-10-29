"use client";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import NotificationList from "./NotificationList";
import { UiNotificacionDTO } from "@/Web/realtime/notifications/notifications.type";

interface Props {
  notifications: UiNotificacionDTO[];
  isLoading?: boolean;
  onDelete?: (id: number) => void | Promise<void>;
  countBadge?: number;
}

export default function NotificationsSheet({
  notifications,
  isLoading,
  onDelete,
  countBadge,
}: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="relative">
          <Button variant="outline" size="icon">
            <Bell className="h-6 w-6" />
          </Button>
          {(countBadge ?? 0) > 0 && (
            <span
              className="absolute -top-1 -right-1 inline-flex items-center justify-center
              h-5 min-w-5 px-1 rounded-full text-[10px] font-bold text-white bg-rose-500"
            >
              {countBadge}
            </span>
          )}
        </div>
      </SheetTrigger>

      {/* derecha y más ancho en desktop */}
      <SheetContent
        side="right"
        className="w-[92vw] sm:w-[480px] md:w-[560px] lg:w-[640px] p-0"
      >
        <div className="flex h-full flex-col">
          <div className="px-6 py-4 border-b">
            <SheetTitle className="text-2xl font-bold text-center">
              Notificaciones
            </SheetTitle>
          </div>

          {/* El espacio restante se usa para la lista; sin zonas blancas */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <NotificationList
              notifications={notifications}
              isLoading={isLoading}
              onDelete={onDelete}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
