import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
//================================================================>
import { useState, useEffect } from "react";
import {
  X,
  Bell,
  User,
  LogOut,
  AtSign,
  CalendarClock,
  Info,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import axios from "axios";
import { Sucursal } from "@/Types/Sucursal/Sucursal_Info";
import { toast } from "sonner";
import { Card, CardContent } from "../ui/card";
import { useSocket } from "../Context/SocketContext";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import logo from "@/assets/Agroservicio.png";
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale("es");
const formatearFecha = (fecha: string) => {
  let nueva_fecha = dayjs(fecha).format("DD MMMM YYYY, hh:mm A");
  return nueva_fecha;
};

const API_URL = import.meta.env.VITE_API_URL;

interface LayoutProps {
  children?: React.ReactNode;
}

enum TipoNotificacion {
  SOLICITUD_PRECIO = "SOLICITUD_PRECIO",
  TRANSFERENCIA = "TRANSFERENCIA",
  VENCIMIENTO = "VENCIMIENTO",
  STOCK_BAJO = "STOCK_BAJO",
  OTRO = "OTRO",
}

interface Notificacion {
  id: number;
  mensaje: string;
  remitenteId: number;
  tipoNotificacion: TipoNotificacion;
  referenciaId: number | null;
  fechaCreacion: string;
}

export default function Layout2({ children }: LayoutProps) {
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
  const userID = useStore((state) => state.userId);

  // Local state
  const socket = useSocket();
  const [sucursalInfo, setSucursalInfo] = useState<Sucursal>();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

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

  // Obtener datos de usuario del backend cuando cambie el userID

  useEffect(() => {
    if (!sucursalId) return;
    axios
      .get<Sucursal>(`${API_URL}/sucursales/get-info-sucursal/${sucursalId}`)
      .then((res) => setSucursalInfo(res.data))
      .catch((err) => console.error("Error fetching sucursal info:", err));
  }, [sucursalId]);

  const getNotificaciones = async () => {
    if (!userID) return;
    try {
      const { data } = await axios.get<Notificacion[]>(
        `${API_URL}/notification/get-my-notifications/${userID}`
      );
      setNotificaciones(data);
    } catch (err) {
      console.error("Error loading notificaciones:", err);
      toast.error("Error al conseguir notificaciones");
    }
  };

  // Cargar notificaciones cuando cambie userID
  useEffect(() => {
    getNotificaciones();
  }, [userID]);

  // Escuchar nuevas notificaciones via socket
  useEffect(() => {
    if (!socket) return;
    const handler = (nueva: Notificacion) => {
      setNotificaciones((prev) => [nueva, ...prev]);
    };
    socket.on("recibirNotificacion", handler);
    return () => {
      socket.off("recibirNotificacion", handler);
    };
  }, [socket]);

  // Eliminar notificación
  const deleteNoti = async (id: number) => {
    try {
      await axios.delete(
        `${API_URL}/notification/delete-my-notification/${id}/${userID}`
      );
      toast.success("Notificación eliminada");
      getNotificaciones();
    } catch (err) {
      console.error("Error deleting notificacion:", err);
      toast.error("Error al eliminar notificación");
    }
  };

  // Logout POS
  const handleLogout = () => {
    localStorage.removeItem("authTokenPos");
    toast.info("Sesión cerrada");
    window.location.reload();
  };

  // util para iniciales
  function getInitials(name?: string | null) {
    if (!name) return "??";
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "??";
    const a = words[0]?.[0] ?? "";
    const b = words[1]?.[0] ?? words[0]?.[1] ?? ""; // si no hay 2da palabra, toma 2da letra de la 1ra
    const initials = (a + b).toUpperCase();
    return initials || "??";
  }

  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-col w-full">
          <header className="sticky top-0 z-10 h-16 w-full bg-background border-b shadow-sm flex items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <Link to="/">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-10 w-10 md:h-14 md:w-14"
                />
              </Link>
              <p className="text-xs font-semibold text-foreground sm:text-sm md:text-base">
                {sucursalInfo?.nombre || ""}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <ModeToggle />
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative">
                    <Button variant="outline" size="icon">
                      <Bell className="h-6 w-6" />
                    </Button>
                    {notificaciones.length > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-primary-foreground bg-rose-500 rounded-full">
                        {notificaciones.length}
                      </span>
                    )}
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold">
                      Notificaciones
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4 overflow-y-auto max-h-96">
                    {notificaciones.length > 0 ? (
                      notificaciones.map((not) => {
                        // Determine icon and color based on notification type
                        let icon;
                        let bgColor;
                        let borderColor;

                        switch (not.tipoNotificacion) {
                          case TipoNotificacion.SOLICITUD_PRECIO:
                            icon = <DollarSign className="h-5 w-5" />;
                            bgColor = "bg-amber-50 dark:bg-amber-950/30";
                            borderColor = "border-l-amber-500";
                            break;
                          case TipoNotificacion.TRANSFERENCIA:
                            icon = <ArrowRightLeft className="h-5 w-5" />;
                            bgColor = "bg-emerald-50 dark:bg-emerald-950/30";
                            borderColor = "border-l-emerald-500";
                            break;
                          case TipoNotificacion.VENCIMIENTO:
                            icon = <Clock className="h-5 w-5" />;
                            bgColor = "bg-rose-50 dark:bg-rose-950/30";
                            borderColor = "border-l-rose-500";
                            break;
                          case TipoNotificacion.STOCK_BAJO:
                            icon = <AlertTriangle className="h-5 w-5" />;
                            bgColor = "bg-orange-50 dark:bg-orange-950/30";
                            borderColor = "border-l-orange-500";
                            break;
                          default:
                            icon = <Info className="h-5 w-5" />;
                            bgColor = "bg-sky-50 dark:bg-sky-950/30";
                            borderColor = "border-l-sky-500";
                            break;
                        }

                        return (
                          <Card
                            key={not.id}
                            className={`m-2 shadow-sm transition-all hover:shadow-md ${bgColor} border-l-4 ${borderColor}`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 text-foreground/80">
                                  {icon}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <Badge
                                      variant="outline"
                                      className="mb-1 font-medium"
                                    >
                                      {not.tipoNotificacion.replace(/_/g, " ")}
                                    </Badge>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => deleteNoti(not.id)}
                                      aria-label="Eliminar notificación"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <p className="text-sm font-medium break-words">
                                    {not.mensaje}
                                  </p>
                                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                    <CalendarClock className="h-3.5 w-3.5 mr-1" />
                                    {formatearFecha(not.fechaCreacion)}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">
                          No hay notificaciones.
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full p-0"
                    aria-label="User menu"
                  >
                    <Avatar className="h-8 w-8">
                      {" "}
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

          <main className="flex-1 overflow-y-auto p-1 lg:p-8">
            <SidebarTrigger />
            {children || <Outlet />}
          </main>

          <footer className="bg-background py-4 text-center text-sm text-muted-foreground border-t">
            <p>&copy; 2024 Novas Sistemas. Todos los derechos reservados</p>
          </footer>
        </div>
      </SidebarProvider>
    </div>
  );
}
