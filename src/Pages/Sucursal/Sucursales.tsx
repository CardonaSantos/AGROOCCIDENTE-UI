import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  Building2,
  Phone,
  MapPin,
  Users,
  Package,
  Calendar,
  PenSquare,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { PageHeader } from "@/utils/components/PageHeaderPos";
const API_URL = import.meta.env.VITE_API_URL;

type Sucursal = {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  pbx: string;
  creadoEn: string;
  actualizadoEn: string;
  tipoSucursal: "TIENDA" | "BODEGA";
  estadoOperacion: boolean;
  usuarios: { id: number; nombre: string; rol: string }[];
  _count: { productos: number };
};

export default function Sucursales() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Log para verificar la URL de la API
  console.log("API_URL:", API_URL);

  const getSucursales = async () => {
    setLoading(true);
    console.log("Cargando sucursales...");

    try {
      const response = await axios.get(
        `${API_URL}/sucursales/info/sucursales-infor`
      );
      console.log("Respuesta de la API:", response);

      if (response.status === 200) {
        setSucursales(response.data);
        console.log("Sucursales cargadas:", response.data);
      } else {
        console.log("Error al recuperar sucursales. Status:", response.status);
      }
    } catch (error) {
      console.error("Error en getSucursales:", error);
      toast.error("Error al recuperar sucursales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSucursales();
  }, []);

  const handleEdit = async () => {
    if (!editingSucursal) {
      console.log("No hay sucursal en edición");
      return;
    }

    try {
      const response = await axios.patch(
        `${API_URL}/sucursales/editar-sucursal/${editingSucursal.id}`,
        editingSucursal
      );
      console.log("Respuesta de edición:", response);

      if (response.status === 200) {
        toast.success("Sucursal Actualizada");
        getSucursales();
      } else {
        console.log(
          "Error al actualizar la sucursal. Status:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error en handleEdit:", error);
      toast.error("Error al editar sucursal");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingSucursal) {
      const newSucursal = {
        ...editingSucursal,
        [e.target.name]: e.target.value,
      };
      setEditingSucursal(newSucursal);
      console.log("Sucursal actualizada en edición:", newSucursal);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title="Sucursales"
        subtitle="Administre sus sucursales"
        sticky={false}
        fallbackBackTo="/"
      />

      {/* Renderiza un spinner o algún indicador de carga */}
      {loading && <div>Cargando sucursales...</div>}

      {/* Tabla para pantallas grandes */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>

              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Usuarios</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sucursales.map((sucursal) => (
              <TableRow key={sucursal.id}>
                <TableCell>{sucursal.id}</TableCell>

                <TableCell>{sucursal.nombre}</TableCell>
                <TableCell>{sucursal.direccion}</TableCell>
                <TableCell>{sucursal.telefono}</TableCell>
                <TableCell>{sucursal.tipoSucursal}</TableCell>
                <TableCell>
                  {sucursal.estadoOperacion ? "Activo" : "Inactivo"}
                </TableCell>
                <TableCell>{sucursal.usuarios.length}</TableCell>
                <TableCell>{sucursal._count.productos}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingSucursal(sucursal);
                        }}
                      >
                        <PenSquare className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Editar Sucursal</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="nombre" className="text-right">
                            Nombre
                          </Label>
                          <Input
                            id="nombre"
                            name="nombre"
                            value={editingSucursal?.nombre || ""}
                            onChange={handleInputChange}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="direccion" className="text-right">
                            Dirección
                          </Label>
                          <Input
                            id="direccion"
                            name="direccion"
                            value={editingSucursal?.direccion || ""}
                            onChange={handleInputChange}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="telefono" className="text-right">
                            Teléfono
                          </Label>
                          <Input
                            id="telefono"
                            name="telefono"
                            value={editingSucursal?.telefono || ""}
                            onChange={handleInputChange}
                            className="col-span-3"
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="telefono" className="text-right">
                            PBX
                          </Label>
                          <Input
                            id="pbx"
                            name="pbx"
                            value={editingSucursal?.pbx || ""}
                            onChange={handleInputChange}
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <Button onClick={handleEdit}>Guardar cambios</Button>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Tarjetas para pantallas pequeñas */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {sucursales.map((sucursal) => (
          <Card key={sucursal.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                {sucursal.nombre}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {sucursal.direccion}
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  {sucursal.telefono}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {sucursal.usuarios.length} usuarios
                </div>
                <div className="flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  {sucursal._count.productos} productos
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Creado: {new Date(sucursal.creadoEn).toLocaleDateString()}
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      sucursal.estadoOperacion
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {sucursal.estadoOperacion ? "Activo" : "Inactivo"}
                  </span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit()}
                      >
                        <PenSquare className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Editar Sucursal</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="nombre" className="text-right">
                            Nombre
                          </Label>
                          <Input
                            id="nombre"
                            name="nombre"
                            value={editingSucursal?.nombre || ""}
                            onChange={handleInputChange}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="direccion" className="text-right">
                            Dirección
                          </Label>
                          <Input
                            id="direccion"
                            name="direccion"
                            value={editingSucursal?.direccion || ""}
                            onChange={handleInputChange}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="telefono" className="text-right">
                            Teléfono
                          </Label>
                          <Input
                            id="telefono"
                            name="telefono"
                            value={editingSucursal?.telefono || ""}
                            onChange={handleInputChange}
                            className="col-span-3"
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="pbx" className="text-right">
                            PBX
                          </Label>
                          <Input
                            id="pbx"
                            name="pbx"
                            value={editingSucursal?.pbx || ""}
                            onChange={handleInputChange}
                            className="col-span-3"
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="estadoOperacion"
                            className="text-right"
                          >
                            Estado
                          </Label>
                        </div>
                      </div>
                      <Button onClick={handleEdit}>Guardar cambios</Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
