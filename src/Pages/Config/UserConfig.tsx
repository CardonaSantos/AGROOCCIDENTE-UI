import React, { useEffect, useState } from "react";
import axios from "axios";
import { useStore } from "@/components/Context/ContextSucursal";
import { toast } from "sonner";
import {
  AtSign,
  Building,
  ChartNoAxesColumn,
  Ghost,
  Edit2,
  Trash2,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_URL = import.meta.env.VITE_API_URL;

// --- Interfaces ---
interface User {
  id: number;
  nombre: string;
  activo: boolean;
  correo: string;
  rol: string;
  contrasena?: string;
  contrasenaConfirm?: string;
  telefono?: string;
  sucursal?: { id: number; nombre: string }; // Unificado
  totalVentas?: number; // Unificado
}

// --- Componente 1: Formulario de "Mi Perfil" ---
const MyProfileForm = ({ userId }: { userId: number | null }) => {
  const [user, setUser] = useState<User>({
    id: 0,
    nombre: "",
    correo: "",
    activo: true,
    rol: "",
    telefono: "",
    contrasena: "",
    contrasenaConfirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchUser = async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(`${API_URL}/user/fin-my-user/${userId}`);
      setUser({ ...data, contrasena: "", contrasenaConfirm: "" });
    } catch (error) {
      toast.error("Error al cargar perfil");
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (user.contrasena && !user.contrasenaConfirm) {
      return toast.info(
        "Requerido: Contraseña actual para confirmar cambio de contraseña",
      );
    }
    setLoading(true);
    try {
      await axios.patch(`${API_URL}/user/update-user/${userId}`, user);
      toast.success("Perfil actualizado");
      setConfirmOpen(false);
      fetchUser();
    } catch (error) {
      toast.error("Error al actualizar. Verifique credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-0 shadow-sm md:border">
      <CardHeader>
        <CardTitle>Mi Perfil</CardTitle>
        <CardDescription>
          Gestiona tu información personal y seguridad.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              name="nombre"
              value={user.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="correo">Correo</Label>
            <Input
              id="correo"
              name="correo"
              value={user.correo}
              onChange={handleChange}
              placeholder="usuario@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              value={user.telefono}
              onChange={handleChange}
              placeholder="5555-5555"
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-3 text-muted-foreground">
            Seguridad
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contrasena">Nueva Contraseña (Opcional)</Label>
              <Input
                id="contrasena"
                name="contrasena"
                type="password"
                value={user.contrasena}
                onChange={handleChange}
                placeholder="••••••"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="contrasenaConfirm"
                className="text-primary font-semibold"
              >
                Confirmar con contraseña actual
              </Label>
              <Input
                id="contrasenaConfirm"
                name="contrasenaConfirm"
                type="password"
                value={user.contrasenaConfirm}
                onChange={handleChange}
                placeholder="Requerido para guardar"
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full sm:w-auto ml-auto"
          onClick={() => setConfirmOpen(true)}
        >
          Guardar Cambios
        </Button>
      </CardFooter>

      {/* Dialogo Confirmación */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmar cambios?</DialogTitle>
            <DialogDescription>
              Esta acción actualizará tus datos inmediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Guardando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const EditUserDialog = ({
  open,
  onClose,
  userToEdit,
  onSave,
  currentUserRol,
}: {
  open: boolean;
  onClose: (v: boolean) => void;
  userToEdit: User;
  onSave: (u: User, adminPass: string) => void;
  currentUserRol: string | null;
}) => {
  const [formData, setFormData] = useState<User>(userToEdit);

  useEffect(() => {
    setFormData(userToEdit);
  }, [userToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Usuario: {formData.nombre}</DialogTitle>
          <DialogDescription>
            Modificar datos como administrador.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input
                name="correo"
                value={formData.correo}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nueva Contraseña (Usuario)</Label>
            <Input
              name="contrasena"
              type="password"
              value={formData.contrasena || ""}
              onChange={handleChange}
              placeholder="Dejar vacío para mantener"
            />
          </div>

          {currentUserRol === "SUPER_ADMIN" && (
            <div className="flex items-center justify-between border p-3 rounded-md">
              <Label htmlFor="activo-switch" className="cursor-pointer">
                Usuario Activo
              </Label>
              <Switch
                id="activo-switch"
                checked={formData.activo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, activo: checked })
                }
              />
            </div>
          )}

          <div className="space-y-2 bg-muted/30 p-3 rounded-md border border-dashed">
            <Label className="text-xs uppercase text-muted-foreground">
              Confirmación de Admin
            </Label>
            <Input
              name="contrasenaConfirm"
              type="password"
              value={formData.contrasenaConfirm || ""}
              onChange={handleChange}
              placeholder="Tu contraseña de administrador"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onSave(formData, formData.contrasenaConfirm || "")}
          >
            Actualizar Usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UsersGrid = ({
  currentUserRol,
  currentUserId,
}: {
  currentUserRol: string | null;
  currentUserId: number | null;
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/user/fin-all-users`);
      setUsers(data);
    } catch {
      toast.error("Error al cargar usuarios");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveEdit = async (updatedUser: User, adminPass: string) => {
    if (!adminPass) return toast.info("Contraseña de admin requerida");

    try {
      const payload = {
        userId: updatedUser.id,
        nombre: updatedUser.nombre,
        correo: updatedUser.correo,
        rol: updatedUser.rol,
        telefono: updatedUser.telefono,
        activo: updatedUser.activo,
        nuevaContrasena: updatedUser.contrasena || undefined,
        adminPassword: adminPass,
      };

      await axios.patch(
        `${API_URL}/user/update-user/as-admin/${currentUserId}`,
        payload,
      );
      toast.success("Usuario actualizado");
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error("Error al editar. Verifica permisos.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">
          Directorio de Usuarios
        </h2>
        <span className="text-sm text-muted-foreground">
          {users.length} registros
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((u) => (
          <Card
            key={u.id}
            className="group hover:shadow-md transition-all duration-200 border-l-4"
            style={{ borderLeftColor: u.activo ? "#10b981" : "#ef4444" }}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {u.nombre}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <AtSign className="w-3 h-3" /> {u.correo}
                  </CardDescription>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${u.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {u.activo ? "Activo" : "Inactivo"}
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="w-4 h-4" />
                  <span className="truncate">
                    {u.sucursal?.nombre || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Ghost className="w-4 h-4" />
                  <span>{u.rol}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <ChartNoAxesColumn className="w-4 h-4" />
                  <span>
                    Ventas: <strong>{u.totalVentas || 0}</strong>
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setEditingUser(u)}
              >
                <Edit2 className="w-3 h-3 mr-2" /> Editar
              </Button>
              {currentUserRol === "SUPER_ADMIN" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          userToEdit={editingUser}
          onSave={handleSaveEdit}
          currentUserRol={currentUserRol}
        />
      )}
    </div>
  );
};

export default function UserConfig() {
  const userId = useStore((state) => state.userId);
  const userRol = useStore((state) => state.userRol);

  return (
    <div className="container mx-auto py-6 px-4 md:px-8 max-w-7xl">
      <Tabs defaultValue="usuario" className="w-full space-y-6">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="usuario">Mi Usuario</TabsTrigger>
            <TabsTrigger value="usuarios">Gestión Usuarios</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="usuario"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <MyProfileForm userId={userId} />
        </TabsContent>

        <TabsContent
          value="usuarios"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <UsersGrid currentUserRol={userRol} currentUserId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
