// -----------------------------
// Dialogo: Editar proveedor

import { useApiMutation } from "@/hooks/genericoCall/genericoCallHook";
import { ProveedorFormData, ProveedorType } from "./ProveedorTypePage";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { EP, QK } from "./QkProviders";

export function ProviderEditDialog({ provider }: { provider: ProveedorType }) {
  const qc = useQueryClient();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [local, setLocal] = useState<ProveedorFormData>({
    nombre: provider.nombre,
    correo: provider.correo,
    telefono: provider.telefono,
    direccion: provider.direccion ?? "",
    razonSocial: provider.razonSocial ?? "",
    rfc: provider.rfc ?? "",
    nombreContacto: provider.nombreContacto ?? "",
    telefonoContacto: provider.telefonoContacto ?? "",
    emailContacto: provider.emailContacto ?? "",
    pais: provider.pais ?? "",
    ciudad: provider.ciudad ?? "",
    codigoPostal: provider.codigoPostal ?? "",
    activo: provider.activo,
    notas: provider.notas ?? "",
  });

  const updateProveedor = useApiMutation<ProveedorType, ProveedorFormData>(
    "patch",
    EP.UPDATE(provider.id),
    undefined,
    {
      onSuccess: () => {
        toast.success("Proveedor editado");
        qc.invalidateQueries({ queryKey: QK.PROVEEDORES });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || "No se pudo editar";
        toast.error(msg);
      },
    }
  );

  const onConfirm = async () => {
    await updateProveedor.mutateAsync(local);
    setOpenConfirm(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" title="Editar">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[95vh] h-auto overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>Editar proveedor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={local.nombre}
                onChange={(e) => setLocal({ ...local, nombre: e.target.value })}
                placeholder="Nombre"
              />
            </div>
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input
                type="email"
                value={local.correo}
                onChange={(e) => setLocal({ ...local, correo: e.target.value })}
                placeholder="Correo"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={local.telefono}
                onChange={(e) =>
                  setLocal({ ...local, telefono: e.target.value })
                }
                placeholder="Teléfono"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Dirección</Label>
              <Textarea
                value={local.direccion}
                onChange={(e) =>
                  setLocal({ ...local, direccion: e.target.value })
                }
                placeholder="Dirección"
              />
            </div>
            <div className="space-y-2">
              <Label>Razón social</Label>
              <Input
                value={local.razonSocial}
                onChange={(e) =>
                  setLocal({ ...local, razonSocial: e.target.value })
                }
                placeholder="Razón social"
              />
            </div>
            <div className="space-y-2">
              <Label>RFC / NIT</Label>
              <Input
                value={local.rfc}
                onChange={(e) => setLocal({ ...local, rfc: e.target.value })}
                placeholder="RFC / NIT"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre de contacto</Label>
              <Input
                value={local.nombreContacto}
                onChange={(e) =>
                  setLocal({ ...local, nombreContacto: e.target.value })
                }
                placeholder="Nombre de contacto"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono de contacto</Label>
              <Input
                value={local.telefonoContacto}
                onChange={(e) =>
                  setLocal({ ...local, telefonoContacto: e.target.value })
                }
                placeholder="Teléfono de contacto"
              />
            </div>
            <div className="space-y-2">
              <Label>Email de contacto</Label>
              <Input
                type="email"
                value={local.emailContacto}
                onChange={(e) =>
                  setLocal({ ...local, emailContacto: e.target.value })
                }
                placeholder="Email de contacto"
              />
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Input
                value={local.pais}
                onChange={(e) => setLocal({ ...local, pais: e.target.value })}
                placeholder="País"
              />
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                value={local.ciudad}
                onChange={(e) => setLocal({ ...local, ciudad: e.target.value })}
                placeholder="Ciudad"
              />
            </div>
            <div className="space-y-2">
              <Label>Código postal</Label>
              <Input
                value={local.codigoPostal}
                onChange={(e) =>
                  setLocal({ ...local, codigoPostal: e.target.value })
                }
                placeholder="Código postal"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id={`activo-${provider.id}`}
              checked={local.activo}
              onCheckedChange={(v) => setLocal({ ...local, activo: v })}
            />
            <Label htmlFor={`activo-${provider.id}`}>Activo</Label>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={local.notas}
              onChange={(e) => setLocal({ ...local, notas: e.target.value })}
              placeholder="Notas"
            />
          </div>

          <div className="pt-2">
            <Button
              className="w-full"
              onClick={() => setOpenConfirm(true)}
              disabled={updateProveedor.isPending}
            >
              Guardar cambios
            </Button>
          </div>
        </div>

        {/* Confirmación */}
        <AdvancedDialog
          title="Confirmar edición"
          description={`Se actualizará el proveedor “${provider.nombre}”. Esta acción no se puede deshacer.`}
          open={openConfirm}
          onOpenChange={setOpenConfirm}
          confirmButton={{
            label: "Sí, guardar",
            onClick: onConfirm,
            loading: updateProveedor.isPending,
            loadingText: "Guardando...",
          }}
          cancelButton={{
            label: "Cancelar",
            disabled: updateProveedor.isPending,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
