import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/components/Context/ContextSucursal";
import axios from "axios";
import { toast } from "sonner";
import SelectComponent from "react-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reparacion } from "./RepairRegisType";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Barcode,
  Calendar,
  Coins,
  CreditCard,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  MapPin,
  MapPinIcon,
  MessagesSquare,
  Package,
  Phone,
  Tag,
  User,
  Wrench,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { PageHeader } from "@/utils/components/PageHeaderPos";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale("es");

const formatearFecha = (fecha: string) => {
  // Formateo en UTC sin conversión a local
  return dayjs(fecha).format("DD/MM/YYYY hh:mm A");
};

const API_URL = import.meta.env.VITE_API_URL;

interface Customer {
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  creadoEn: string; // ISO string
  actualizadoEn: string; // ISO string
  municipioId: number | null;
  departamentoId: number | null;
  dpi: string;
  iPInternet: string | null;
}

interface OptionType {
  label: string;
  value: number;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: string;
  creadoEn: string;
  actualizadoEn: string;
  precioCostoActual: number;
}

export default function RepairOrderForm() {
  const usuarioId = useStore((state) => state.userId) ?? 0;
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;

  const [formData, setFormData] = useState({
    usuarioId: usuarioId, // Pre-filled
    sucursalId: sucursalId, // Pre-filled
    clienteId: 0,
    productoId: 0,
    productoExterno: "",
    problemas: "",
    observaciones: "",
    fechaRecibido: new Date().toISOString().split("T")[0],
    estado: "PENDIENTE",
  });

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeProduct = (selectedOption: OptionType | null) => {
    setSelectedOptionProduct(selectedOption);
    setFormData((prevFormData) => ({
      ...prevFormData,
      productoId: selectedOption ? selectedOption.value : 0, // Usa 0 en lugar de null
    }));
  };

  const [isSubmiting, setIsSubmiting] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmiting) return;
    setIsSubmiting(true);
    console.log("Datos del formulario:", formData);
    try {
      const response = await axios.post(`${API_URL}/repair`, formData);

      if (response.status === 201) {
        toast.success("Se registrado correctamente la reparación");
        setTimeout(() => {
          setIsSubmiting(false);
        }, 1000);
        setOpenConfirm(false);
        setFormData({
          usuarioId: usuarioId, // Pre-filled
          sucursalId: sucursalId, // Pre-filled
          clienteId: 0,
          productoId: 0,
          productoExterno: "",
          problemas: "",
          observaciones: "",
          fechaRecibido: new Date().toISOString().split("T")[0],
          estado: "PENDIENTE",
        });
        window.location.reload();
      }
    } catch (error) {
      setIsSubmiting(false);
    }
  };

  const [clientes, setClientes] = useState<Customer[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);

  const fetchProductos = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/products/product-to-warranty`
      );
      if (response.status === 200) {
        setProductos(response.data);
      }
    } catch (error) {
      console.error("Error fetching productos:", error);
      toast.error("Error al cargar los productos");
    }
  };
  const getUsers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/client/customers-to-warranty`
      );
      if (response.status === 200) {
        setClientes(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al cargar los usuarios");
    }
  };

  const fetchReparaciones = async () => {
    try {
      const response = await axios.get(`${API_URL}/repair`);
      if (response.status === 200) {
        setReparaciones(response.data);
      }
    } catch (error) {
      console.error("Error fetching productos:", error);
      toast.error("Error al cargar los productos");
    }
  };

  useEffect(() => {
    getUsers();
    fetchProductos();
    fetchReparaciones();
  }, []);

  const clientesFormatoSelect = clientes.map((client) => ({
    label: `${client.nombre} (${client.telefono}) DPI: ${client?.dpi}`,
    value: client.id,
  }));

  //OPCIONES PARA EL SELECT DE CLIENTES
  const [selectedOptionCustomer, setSelectedOptionCustomer] =
    useState<OptionType | null>(null);
  const [selectedOptionProduct, setSelectedOptionProduct] =
    useState<OptionType | null>(null);

  const handleChangeCliente = (selectedOption: OptionType | null) => {
    setSelectedOptionCustomer(selectedOption);
    setFormData((prevFormData) => ({
      ...prevFormData,
      clienteId: selectedOption ? selectedOption.value : 0, // Usa 0 en lugar de null
    }));
  };

  const productosFormato = productos.map((prod) => ({
    label: `${prod.nombre} (${prod.codigoProducto})`,
    value: prod.id,
  }));

  console.log("El formData es: ", formData);
  //----------------------------------------

  interface RepairRecordsTableProps {
    reparaciones: Reparacion[];
  }

  function RepairRecordsTable({ reparaciones }: RepairRecordsTableProps) {
    const [selectedRepair, setSelectedRepair] = useState<Reparacion | null>(
      null
    );

    const InfoItem = ({
      icon: Icon,
      label,
      value,
    }: {
      icon: React.ComponentType<any>;
      label: string;
      value?: string | null;
    }) => (
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">{label}</p>
          <p
            className={`text-sm ${
              value ? "text-muted-foreground" : "text-red-500 italic"
            }`}
          >
            {value || "No disponible"}
          </p>
        </div>
      </div>
    );

    console.log("Las reparaciones son: ", reparaciones);

    return (
      <div className="">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Recibido</TableHead>
              <TableHead>Acciones</TableHead>
              <TableHead>Comprobante de Ingreso</TableHead>
              <TableHead>Comprobante de Finalización</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reparaciones.map((reparacion) => (
              <TableRow key={reparacion.id}>
                <TableCell>#{reparacion.id}</TableCell>
                <TableCell>{reparacion.cliente.nombre}</TableCell>
                <TableCell>
                  {reparacion.producto
                    ? reparacion.producto.nombre
                    : reparacion.productoExterno}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      reparacion.estado === "PENDIENTE" ? "default" : "outline"
                    }
                  >
                    {reparacion.estado}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatearFecha(reparacion.fechaRecibido)}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRepair(reparacion)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl h-full overflow-y-auto">
                      <div className="">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-center">
                            Detalles de la Reparación
                          </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="pr-4">
                          {selectedRepair && (
                            <div className="space-y-1">
                              {/* Información del Cliente y Producto */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Información del Cliente */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">
                                      Información del Cliente
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <InfoItem
                                      icon={User}
                                      label="Nombre"
                                      value={selectedRepair.cliente.nombre}
                                    />
                                    <InfoItem
                                      icon={Phone}
                                      label="Teléfono"
                                      value={
                                        selectedRepair.cliente.telefono || "N/A"
                                      }
                                    />
                                    <InfoItem
                                      icon={CreditCard}
                                      label="DPI"
                                      value={
                                        selectedRepair.cliente.dpi || "N/A"
                                      }
                                    />

                                    <InfoItem
                                      icon={MapPinIcon}
                                      label="Dirección"
                                      value={
                                        selectedRepair.cliente.direccion ||
                                        "N/A"
                                      }
                                    />
                                  </CardContent>
                                </Card>

                                {/* Información del Producto */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">
                                      Información del Producto
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {selectedRepair.producto ? (
                                      <>
                                        <InfoItem
                                          icon={Package}
                                          label="Nombre"
                                          value={selectedRepair.producto.nombre}
                                        />
                                        <InfoItem
                                          icon={Barcode}
                                          label="Código"
                                          value={
                                            selectedRepair.producto
                                              .codigoProducto
                                          }
                                        />
                                        <InfoItem
                                          icon={FileText}
                                          label="Descripción"
                                          value={
                                            selectedRepair.producto.descripcion
                                          }
                                        />
                                      </>
                                    ) : (
                                      <InfoItem
                                        icon={Wrench}
                                        label="Producto Externo"
                                        value={
                                          selectedRepair.productoExterno ||
                                          "N/A"
                                        }
                                      />
                                    )}
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Detalles de la Reparación */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">
                                    Detalles de la Reparación
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoItem
                                      icon={Calendar}
                                      label="Fecha Recibido"
                                      value={formatearFecha(
                                        selectedRepair.fechaRecibido
                                      )}
                                    />
                                    {selectedRepair.fechaEntregado && (
                                      <InfoItem
                                        icon={Calendar}
                                        label="Fecha Entregado"
                                        value={formatearFecha(
                                          selectedRepair.fechaEntregado
                                        )}
                                      />
                                    )}
                                    <div className="flex items-center space-x-3">
                                      <Tag className="h-5 w-5 text-muted-foreground" />
                                      <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                          Estado
                                        </p>
                                        <Badge
                                          variant={
                                            selectedRepair.estado ===
                                            "PENDIENTE"
                                              ? "default"
                                              : "outline"
                                          }
                                        >
                                          {selectedRepair.estado}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <Separator />
                                  <InfoItem
                                    icon={AlertCircle}
                                    label="Problemas"
                                    value={selectedRepair.problemas}
                                  />
                                  {selectedRepair.observaciones && (
                                    <InfoItem
                                      icon={Eye}
                                      label="Observaciones"
                                      value={selectedRepair.observaciones}
                                    />
                                  )}
                                  {selectedRepair.hojaSolucion && (
                                    <InfoItem
                                      icon={FileCheck}
                                      label="Hoja de Solución"
                                      value={selectedRepair.hojaSolucion}
                                    />
                                  )}
                                </CardContent>
                              </Card>

                              {/* Información Adicional */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">
                                    Información Adicional
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <InfoItem
                                    icon={User}
                                    label="Atendido por"
                                    value={selectedRepair.usuario.nombre}
                                  />
                                  <InfoItem
                                    icon={MapPin}
                                    label="Sucursal"
                                    value={selectedRepair.sucursal.nombre}
                                  />
                                  <InfoItem
                                    icon={MapPin}
                                    label="Dirección"
                                    value={selectedRepair.sucursal.direccion}
                                  />
                                </CardContent>
                              </Card>

                              {/* Historial de Registros */}
                              {selectedRepair.registros.length > 0 && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">
                                      Cierre de reparación
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <ul className="space-y-4">
                                      {selectedRepair.registros.map(
                                        (registro, index) => (
                                          <li
                                            key={index}
                                            className="bg-muted p-4 rounded-lg shadow-sm"
                                          >
                                            <div className="space-y-2">
                                              <InfoItem
                                                icon={Calendar}
                                                label="Fecha de entrega"
                                                value={formatearFecha(
                                                  registro.fechaRegistro
                                                )}
                                              />
                                              <InfoItem
                                                icon={Tag}
                                                label="Estado"
                                                value={registro.estado}
                                              />
                                              <InfoItem
                                                icon={Wrench}
                                                label="Acciones realizadas"
                                                value={
                                                  registro.accionesRealizadas
                                                }
                                              />

                                              <InfoItem
                                                icon={MessagesSquare}
                                                label="Comentario final"
                                                value={registro.comentarioFinal}
                                              />

                                              <InfoItem
                                                icon={Coins}
                                                label="Monto pagado"
                                                value={new Intl.NumberFormat(
                                                  "es-GT",
                                                  {
                                                    style: "currency",
                                                    currency: "GTQ",
                                                  }
                                                )
                                                  .format(registro.montoPagado)
                                                  .toString()}
                                              />

                                              <InfoItem
                                                icon={User}
                                                label="Registrado por"
                                                value={
                                                  registro.usuario?.nombre ||
                                                  null
                                                } // Aquí verificamos si existe registro.usuario
                                              />
                                            </div>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell className="text-center justify-center items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link to={`/reparacion-comprobante/${reparacion.id}`}>
                          <Button variant={"outline"} size={"icon"}>
                            <FileSpreadsheet className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Imprimir</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                {/* OTRO PDF */}
                {reparacion && reparacion.registros.length > 0 ? (
                  <TableCell className="text-center justify-center items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={`/reparacion-comprobante-final/${reparacion.id}`}
                          >
                            <Button variant={"outline"} size={"icon"}>
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Imprimir</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="">
      <PageHeader
        title="Reparaciones"
        subtitle="Administre sus registros de reparaciones"
        sticky={false}
        fallbackBackTo="/"
      />
      <Tabs defaultValue="reparaciones" className="w-full max-w-6xl mx-auto">
        <TabsList className="flex justify-center w-full border-b border-muted">
          <TabsTrigger className="w-full " value="reparaciones">
            Reparaciones
          </TabsTrigger>
          <TabsTrigger className="w-full" value="regist-reparacion">
            Registrar Reparación
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="reparaciones"
          className=" border-t border-muted rounded-b-md  shadow-md"
        >
          <Card className="shadow-xl">
            <CardContent>
              <h2 className="text-center font-bold text-xl p-2">
                Vea sus registros de reparaciones
              </h2>
              <RepairRecordsTable reparaciones={reparaciones} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="regist-reparacion"
          className=" border-t border-muted rounded-b-md shadow-md"
        >
          <Card className="max-w-6xl mx-auto shadow-xl">
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-6 max-w-5xl mx-auto p-8"
              >
                <h1 className="text-2xl font-bold text-center mb-6">
                  Formulario de Orden de Reparación
                </h1>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productoId">Cliente</Label>
                    <SelectComponent
                      className="bg-gray-100 text-black"
                      options={clientesFormatoSelect}
                      isClearable
                      value={selectedOptionCustomer}
                      onChange={handleChangeCliente}
                      placeholder="Selecciona un cliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clienteId">Producto</Label>
                    <SelectComponent
                      className="bg-gray-100 text-black"
                      options={productosFormato}
                      isClearable
                      value={selectedOptionProduct}
                      onChange={handleChangeProduct}
                      placeholder="Selecciona un producto"
                      isDisabled={!!formData.productoExterno}
                    />
                  </div>

                  {!formData.productoId && (
                    <div className="space-y-2">
                      <Label htmlFor="productoExterno">Producto Externo</Label>
                      <Input
                        id="productoExterno"
                        name="productoExterno"
                        value={formData.productoExterno}
                        onChange={handleChange}
                        placeholder="Ingrese el nombre del producto externo"
                        className=""
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="problemas">Problemas Reportados</Label>
                    <Textarea
                      id="problemas"
                      name="problemas"
                      value={formData.problemas}
                      onChange={handleChange}
                      placeholder="Describa los problemas reportados"
                      required
                      className=""
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observaciones">
                      Observaciones (Opcional)
                    </Label>
                    <Textarea
                      id="observaciones"
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleChange}
                      placeholder="Detalles adicionales, accesorios, etc."
                      className="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    onClick={() => setOpenConfirm(true)}
                    type="button"
                    variant="default"
                    className="w-full sm:w-auto"
                  >
                    Enviar Formulario
                  </Button>
                </div>

                <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
                  <DialogContent className="max-w-lg mx-auto">
                    <DialogHeader>
                      <DialogTitle className="text-center">
                        Confirmación de Registro
                      </DialogTitle>
                      <DialogDescription className="text-center text-sm text-muted-foreground">
                        ¿Deseas iniciar este registro de reparación con los
                        datos ingresados? Una vez confirmado, podrás actualizar
                        los detalles más adelante si es necesario.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-4 mt-4">
                      <Button
                        onClick={() => setOpenConfirm(false)}
                        className="w-full"
                        variant="destructive"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        className="w-full"
                        variant="default"
                      >
                        Sí, continuar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
