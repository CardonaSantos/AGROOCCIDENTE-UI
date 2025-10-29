import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
//================================================================>
import { useEffect } from "react";
import { User, LogOut, AtSign } from "lucide-react";

import { Link, Outlet } from "react-router-dom";
import { ModeToggle } from "../mode-toggle";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { UserToken } from "@/Types/UserToken/UserToken";
import { jwtDecode } from "jwt-decode";
import { useStore } from "../Context/ContextSucursal";
import { Sucursal } from "@/Types/Sucursal/Sucursal_Info";
import { toast } from "sonner";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Avatar, AvatarFallback } from "../ui/avatar";
import logo from "@/assets/AGROOCCIDENTE-LOGO-PNG.png";
import { useNotificationsRealtime } from "@/Web/realtime/notifications/usenot";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import { UiNotificacionDTO } from "@/Web/realtime/notifications/notifications.type";
import { useQueryClient } from "@tanstack/react-query";
import NotificationsSheet from "./NotificationsComponents/NotificationsSheet";
import { NOTIFICATIONS_QK } from "./NotificationsComponents/Qk";
import { getApiErrorMessageAxios } from "@/Pages/Utils/UtilsErrorApi";

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale("es");

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout2({ children }: LayoutProps) {
  const queryClient = useQueryClient();
  // Store POS (Zustand) setters
  const setUserNombre = useStore((state) => state.setUserNombre);
  const setUserCorreo = useStore((state) => state.setUserCorreo);
  const setUserId = useStore((state) => state.setUserId);
  const setActivo = useStore((state) => state.setActivo);
  const setRol = useStore((state) => state.setRol);
  const setSucursalId = useStore((state) => state.setSucursalId);

  // Store POS values
  const posNombre = useStore((state) => state.userNombre);
  const posCorreo = useStore((state) => state.userCorreo);
  const sucursalId = useStore((state) => state.sucursalId);
  const userID = useStore((state) => state.userId) ?? 0;

  // Local state

  // Decodificar y setear datos del POS al iniciar
  useEffect(() => {
    const token = localStorage.getItem("authTokenPos");
    if (!token) return;
    try {
      const decoded = jwtDecode<UserToken>(token);
      setUserNombre(decoded.nombre);
      setUserCorreo(decoded.correo);
      setActivo(decoded.activo);
      setRol(decoded.rol);
      setUserId(decoded.sub);
      setSucursalId(decoded.sucursalId);
    } catch (error) {
      console.error("Error decoding authTokenPos:", error);
    }
  }, [
    setUserNombre,
    setUserCorreo,
    setActivo,
    setRol,
    setUserId,
    setSucursalId,
  ]);
  const { data: sucursalInfo } = useApiQuery<Sucursal>(
    ["sucursal-info", sucursalId],
    `sucursales/get-info-sucursal/${sucursalId}`,
    undefined,
    { enabled: !!sucursalId }
  );

  const { data: notifications, isLoading: isLoadingNotis } = useApiQuery<
    UiNotificacionDTO[]
  >(
    NOTIFICATIONS_QK(userID),
    `notification/get-my-notifications/${userID}`,
    undefined,
    { staleTime: 0, enabled: !!userID }
  );

  const secureNotifications = Array.isArray(notifications) ? notifications : [];

  const deleteNoti = async (id: number) => {
    try {
      const { mutateAsync: deleteNotification } = useApiMutation(
        "delete",
        `notification/delete-noti-one-user/${userID}/${id}`
      );

      toast.promise(deleteNotification(id), {
        loading: "Eliminando notifiación...",
        success: "Notificación Eliminada",
        error: (error) => getApiErrorMessageAxios(error),
      });

      await queryClient.invalidateQueries({
        queryKey: NOTIFICATIONS_QK(userID),
      });
      toast.success("Notificación eliminada");
    } catch (err) {
      console.error("Error deleting notificacion:", err);
      toast.error("Error al eliminar notificación");
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authTokenPos");
    toast.info("Sesión cerrada");
    window.location.reload();
  };

  function getInitials(name?: string | null) {
    if (!name) return "??";
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "??";
    const a = words[0]?.[0] ?? "";
    const b = words[1]?.[0] ?? words[0]?.[1] ?? ""; // si no hay 2da palabra, toma 2da letra de la 1ra
    const initials = (a + b).toUpperCase();
    return initials || "??";
  }

  useNotificationsRealtime({
    showToast: true,
    onNew: () => {},
  });

  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-col w-full">
          <header className="sticky top-0 z-10 h-12 w-full bg-background border-b shadow-sm flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8 -ml-1" />
              <Link to="/">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-10 w-10 sm:h-16 sm:w-16"
                />
              </Link>
              <p className="text-sm ">{sucursalInfo?.nombre || ""}</p>
            </div>

            <div className="flex items-center space-x-2">
              <ModeToggle />

              <NotificationsSheet
                notifications={secureNotifications}
                isLoading={isLoadingNotis}
                onDelete={deleteNoti}
                countBadge={secureNotifications.length}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full p-0"
                    aria-label="User menu"
                  >
                    <Avatar className="h-8 w-8">
                      {/* Si tuvieras imagen, la pones aquí con <AvatarImage src="..." /> */}
                      <AvatarFallback className="h-8 w-8 bg-[#29daa5] text-white font-semibold uppercase flex items-center justify-center">
                        {getInitials(posNombre)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>{posNombre}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <AtSign className="mr-2 h-4 w-4" />
                    <span>{posCorreo}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-2 md:px-3 lg:px-0 py-2 lg:py-1">
            {children || <Outlet />}
          </main>

          <footer className="bg-background py-4 text-center text-sm text-muted-foreground border-t">
            <p>&copy; 2025 Nova Sistemas. Todos los derechos reservados</p>
          </footer>
        </div>
      </SidebarProvider>
    </div>
  );
}
