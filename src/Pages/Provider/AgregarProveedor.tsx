import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// UI (shadcn)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { PageHeader } from "@/utils/components/PageHeaderPos";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import { ProveedorFormData, ProveedorType } from "./ProveedorTypePage";
import { EP, QK } from "./QkProviders";
import { ProvidersTable } from "./ProvidersTable";

// Tipos (si ya existe ProveedorType en tu proyecto, puedes importar y usarlo)

function ProviderCreateCard() {
  const qc = useQueryClient();

  const [openConfirm, setOpenConfirm] = useState(false);
  const [form, setForm] = useState<ProveedorFormData>({
    nombre: "",
    correo: "",
    telefono: "",
    activo: true,
    direccion: "",
    razonSocial: "",
    rfc: "",
    nombreContacto: "",
    telefonoContacto: "",
    emailContacto: "",
    pais: "",
    ciudad: "",
    codigoPostal: "",
    notas: "",
  });

  const createProveedor = useApiMutation<ProveedorType, ProveedorFormData>(
    "post",
    EP.CREATE,
    undefined,
    {
      onSuccess: () => {
        toast.success("Proveedor creado");
        qc.invalidateQueries({ queryKey: QK.PROVEEDORES });
        setForm((f) => ({
          ...f,
          nombre: "",
          correo: "",
          telefono: "",
          direccion: "",
          razonSocial: "",
          rfc: "",
          nombreContacto: "",
          telefonoContacto: "",
          emailContacto: "",
          pais: "",
          ciudad: "",
          codigoPostal: "",
          notas: "",
        }));
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || "No se pudo crear";
        toast.error(msg);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenConfirm(true);
  };

  const onConfirm = async () => {
    await createProveedor.mutateAsync(form);
    setOpenConfirm(false);
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-base sm:text-lg">
          Agregar nuevo proveedor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Mi proveedor"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correo">Correo</Label>
              <Input
                id="correo"
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                placeholder="proveedor@correo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="Ej. 5555-5555"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={form.direccion}
                onChange={(e) =>
                  setForm({ ...form, direccion: e.target.value })
                }
                placeholder="Calle, zona, referencia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón social</Label>
              <Input
                id="razonSocial"
                value={form.razonSocial}
                onChange={(e) =>
                  setForm({ ...form, razonSocial: e.target.value })
                }
                placeholder="Ej. NOVA, S.A."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfc">RFC / NIT</Label>
              <Input
                id="rfc"
                value={form.rfc}
                onChange={(e) => setForm({ ...form, rfc: e.target.value })}
                placeholder="Documento fiscal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreContacto">Nombre de contacto</Label>
              <Input
                id="nombreContacto"
                value={form.nombreContacto}
                onChange={(e) =>
                  setForm({ ...form, nombreContacto: e.target.value })
                }
                placeholder="Persona encargada"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefonoContacto">Teléfono de contacto</Label>
              <Input
                id="telefonoContacto"
                value={form.telefonoContacto}
                onChange={(e) =>
                  setForm({ ...form, telefonoContacto: e.target.value })
                }
                placeholder="Ej. 1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailContacto">Email de contacto</Label>
              <Input
                id="emailContacto"
                type="email"
                value={form.emailContacto}
                onChange={(e) =>
                  setForm({ ...form, emailContacto: e.target.value })
                }
                placeholder="encargado@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                value={form.pais}
                onChange={(e) => setForm({ ...form, pais: e.target.value })}
                placeholder="Guatemala"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={form.ciudad}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                placeholder="Huehuetenango"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigoPostal">Código postal</Label>
              <Input
                id="codigoPostal"
                value={form.codigoPostal}
                onChange={(e) =>
                  setForm({ ...form, codigoPostal: e.target.value })
                }
                placeholder="Ej. 12001"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Observaciones, condiciones de pago, etc."
              className="min-h-[90px]"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="activo"
              checked={form.activo}
              onCheckedChange={(v) => setForm({ ...form, activo: v })}
            />
            <Label htmlFor="activo">Activo</Label>
          </div>
          <div className="pt-2 sm:hidden">
            <Button
              type="submit"
              className="w-full"
              disabled={createProveedor.isPending}
            >
              <Plus className="mr-2 h-4 w-4" /> Crear proveedor
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="hidden sm:flex justify-end">
        <Button
          onClick={() => setOpenConfirm(true)}
          disabled={createProveedor.isPending}
        >
          <Plus className="mr-2 h-4 w-4" /> Crear proveedor
        </Button>
      </CardFooter>

      {/* Confirmación */}
      <AdvancedDialog
        title="Confirmar creación"
        description={`Se creará el proveedor “${
          form.nombre || "(sin nombre)"
        }”. Esta acción no se puede deshacer.`}
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        confirmButton={{
          label: "Sí, crear",
          onClick: onConfirm,
          loading: createProveedor.isPending,
          loadingText: "Creando...",
        }}
        cancelButton={{
          label: "Cancelar",
          disabled: createProveedor.isPending,
        }}
      />
    </Card>
  );
}

export default function ProveedoresPage() {
  const { data, isLoading, isError, refetch } = useApiQuery<ProveedorType[]>(
    QK.PROVEEDORES,
    EP.LIST,
    undefined,
    { staleTime: 60_000 }
  );

  return (
    <div className="container mx-auto px-3 sm:px-4">
      <PageHeader
        title="Proveedores"
        subtitle="Cree, visualice y edite sus proveedores"
        sticky={false}
        fallbackBackTo="/"
      />

      <Tabs defaultValue="add" className="mt-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add">Agregar</TabsTrigger>
          <TabsTrigger value="list">Listado</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="mt-4">
          <ProviderCreateCard />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          {isError ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-red-500">
                  No se pudo cargar la lista.
                </p>
                <Button
                  className="mt-3"
                  variant="outline"
                  onClick={() => refetch()}
                >
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {isLoading ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Cargando proveedores...
                  </CardContent>
                </Card>
              ) : (
                <ProvidersTable providers={data || []} />
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
