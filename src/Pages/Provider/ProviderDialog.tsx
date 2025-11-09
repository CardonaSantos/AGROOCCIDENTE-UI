import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { place, ProveedorType } from "./ProveedorTypePage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Building,
  Eye,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
export function ProviderViewDialog({ provider }: { provider: ProveedorType }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Ver detalles">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {provider.nombre}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-2">
          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-base text-primary">
                Información general
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <InfoItem
                icon={<Mail className="h-5 w-5" />}
                label="Correo"
                value={provider.correo}
              />
              <InfoItem
                icon={<Phone className="h-5 w-5" />}
                label="Teléfono"
                value={provider.telefono}
              />
              <InfoItem
                icon={<MapPin className="h-5 w-5" />}
                label="Dirección"
                value={provider.direccion}
              />
              <InfoItem
                icon={<Building className="h-5 w-5" />}
                label="Razón social"
                value={provider.razonSocial}
              />
              <InfoItem
                icon={<FileText className="h-5 w-5" />}
                label="RFC / NIT"
                value={provider.rfc}
              />
              <InfoItem
                icon={<Globe className="h-5 w-5" />}
                label="Ubicación"
                value={place(provider.pais, provider.ciudad)}
              />
              <InfoItem
                icon={<MapPin className="h-5 w-5" />}
                label="Código postal"
                value={provider.codigoPostal}
              />
            </CardContent>
          </Card>

          <Card className="mt-4 border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-base text-primary">Contacto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <InfoItem
                icon={<User className="h-5 w-5" />}
                label="Nombre"
                value={provider.nombreContacto}
              />
              <InfoItem
                icon={<Phone className="h-5 w-5" />}
                label="Teléfono"
                value={provider.telefonoContacto}
              />
              <InfoItem
                icon={<Mail className="h-5 w-5" />}
                label="Email"
                value={provider.emailContacto}
              />
            </CardContent>
          </Card>

          {provider.notas ? (
            <Card className="mt-4 border-none shadow-none">
              <CardHeader>
                <CardTitle className="text-base text-primary">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{provider.notas}</p>
              </CardContent>
            </Card>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

//SUBCOMPONENTE

// Item reutilizable para mostrar info + icono
function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 p-2">
      <div className="text-primary shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm break-words">{value || "No especificado"}</p>
      </div>
    </div>
  );
}
