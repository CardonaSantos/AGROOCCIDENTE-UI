"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Package,
  Calendar,
  Eye,
  Building,
  Coins,
  User2Icon,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  PackageIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import { useStore } from "@/components/Context/ContextSucursal";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formateDateWithMinutes } from "@/Crm/Utils/FormateDate";
import { PageHeader } from "@/utils/components/PageHeaderPos";

// Tipos
type Producto = {
  nombre: string;
  codigoProducto: string;
};

type Sucursal = {
  id: number;
  nombre: string;
  direccion: string;
};

type Usuario = {
  id: number;
  nombre: string;
  rol: string;
};

type Proveedor = {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
};

type StockEntregado = {
  id: number;
  productoId: number;
  cantidad: number;
  cantidadInicial: number;
  costoTotal: number;
  creadoEn: string;
  fechaIngreso: string;
  fechaVencimiento: string;
  precioCosto: number;
  entregaStockId: number;
  sucursalId: number;
  producto: Producto;
  sucursal: Sucursal;
};

type EntregaStock = {
  id: number;
  proveedorId: number;
  montoTotal: number;
  fechaEntrega: string;
  recibidoPorId: number;
  sucursalId: number;
  proveedor: Proveedor;
  usuarioRecibido: Usuario;
  stockEntregado: StockEntregado[];
  sucursal: Sucursal;
};
const API_URL = import.meta.env.VITE_API_URL;

export default function EntregasStock() {
  const sucursalID = useStore((state) => state.sucursalId);
  const [entregas, setEntregas] = useState<EntregaStock[]>([]);
  const [selectedEntrega, setSelectedEntrega] = useState<EntregaStock | null>(
    null
  );

  const getEntregasRegist = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/entrega-stock/get-my-delivery-stock/${sucursalID}`
      );

      if (response.status === 200) {
        setEntregas(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir los registros de entregas");
    }
  };

  useEffect(() => {
    if (sucursalID) {
      getEntregasRegist();
    }
  }, [sucursalID]);

  console.log("Las entregas: ", entregas);

  // Funciones helper para manejar datos faltantes
  const safeGet = (obj: any, path: string, defaultValue: any = "N/A") => {
    return obj &&
      obj[path] !== null &&
      obj[path] !== undefined &&
      obj[path] !== ""
      ? obj[path]
      : defaultValue;
  };

  const safeFormatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "Q0.00";
    }
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(amount);
  };

  const safeFormatDate = (date: string | null | undefined) => {
    if (!date) return "Fecha no disponible";
    try {
      return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  // Componente para mostrar los detalles de la entrega
  const EntregaDetails = ({ entrega }: { entrega: EntregaStock }) => (
    <ScrollArea className="h-[calc(100vh-180px)] w-full">
      <div className="p-6 space-y-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium">ID de Entrega</p>
                <p className="text-2xl font-bold">#{entrega.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Monto Total</p>
                <p className="text-2xl font-bold">
                  {safeFormatCurrency(entrega.montoTotal)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium">Fecha de Entrega</p>
                <p className="text-lg flex items-center">
                  <CalendarIcon className="mr-2" size={16} />
                  {safeFormatDate(entrega.fechaEntrega)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold">
                <UserIcon className="mr-2" size={20} />
                Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entrega.proveedor ? (
                <>
                  <p className="font-medium">
                    {safeGet(
                      entrega.proveedor,
                      "nombre",
                      "Proveedor sin nombre"
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Correo: {safeGet(entrega.proveedor, "correo", "Sin correo")}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <PhoneIcon className="mr-2" size={14} />
                    {safeGet(entrega.proveedor, "telefono", "Sin teléfono")}
                  </p>
                </>
              ) : (
                <div className="text-muted-foreground">
                  <p className="font-medium">Proveedor no especificado</p>
                  <p className="text-sm">Sin información de contacto</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold">
                <MapPinIcon className="mr-2" size={20} />
                Sucursal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {safeGet(entrega.sucursal, "nombre", "Sucursal sin nombre")}
              </p>
              <p className="text-sm text-muted-foreground">
                {safeGet(
                  entrega.sucursal,
                  "direccion",
                  "Dirección no disponible"
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <UserIcon className="mr-2" size={20} />
              Recibido Por
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {safeGet(
                entrega.usuarioRecibido,
                "nombre",
                "Usuario no especificado"
              )}
            </p>
            <Badge variant="secondary" className="mt-1">
              {safeGet(entrega.usuarioRecibido, "rol", "Sin rol")}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <PackageIcon className="mr-2" size={20} />
              Stock Entregado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entrega.stockEntregado && entrega.stockEntregado.length > 0 ? (
              <div className="space-y-4">
                {entrega.stockEntregado.map((stock) => (
                  <div key={stock.id} className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      {safeGet(stock.producto, "nombre", "Producto sin nombre")}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <p>
                        <span className="font-medium">Código:</span>{" "}
                        {safeGet(
                          stock.producto,
                          "codigoProducto",
                          "Sin código"
                        )}
                      </p>

                      <p>
                        <span className="font-medium">Cantidad Inicial:</span>{" "}
                        {stock.cantidadInicial || 0}
                      </p>

                      <p>
                        <span className="font-medium">Cantidad:</span>{" "}
                        {stock.cantidad || 0}
                      </p>
                      <p>
                        <span className="font-medium">Costo Total:</span>{" "}
                        {safeFormatCurrency(stock.costoTotal)}
                      </p>
                      <p>
                        <span className="font-medium">Precio Costo:</span>{" "}
                        {safeFormatCurrency(stock.precioCosto)}
                      </p>
                      <p className="col-span-2">
                        <span className="font-medium">Fecha de Ingreso:</span>{" "}
                        {stock.fechaIngreso
                          ? formateDateWithMinutes(stock.fechaIngreso)
                          : "Fecha no disponible"}
                      </p>
                      <p className="col-span-2">
                        <span className="font-medium">
                          Fecha de Vencimiento:
                        </span>{" "}
                        {safeFormatDate(stock.fechaVencimiento)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <PackageIcon className="mx-auto mb-2" size={48} />
                <p className="font-medium">Sin productos registrados</p>
                <p className="text-sm">Esta entrega no tiene stock asociado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(entregas.length / itemsPerPage);

  // Calcular el índice del último elemento de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  // Calcular el índice del primer elemento de la página actual
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Obtener los elementos de la página actual
  const currentItems = entregas.slice(indexOfFirstItem, indexOfLastItem);

  // Cambiar de página
  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto ">
      <PageHeader
        title="Registros de entregas de stock"
        subtitle="Historiales"
        sticky={false}
        fallbackBackTo="/"
      />
      <Card className="shadow-xl">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entrega</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha de Entrega</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Productos</TableHead>

                <TableHead>Monto Total</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems &&
                currentItems.map((entrega) => (
                  <TableRow key={entrega.id}>
                    <TableCell>#{entrega.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User2Icon className="mr-2" size={16} />
                        {entrega.proveedor
                          ? safeGet(
                              entrega.proveedor,
                              "nombre",
                              "Proveedor sin nombre"
                            )
                          : "Sin proveedor"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2" size={16} />
                        {safeFormatDate(entrega.fechaEntrega)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="mr-2" size={16} />
                        {safeGet(
                          entrega.sucursal,
                          "nombre",
                          "Sucursal sin nombre"
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center">
                        <Package className="mr-2" size={16} />
                        {entrega.stockEntregado &&
                        entrega.stockEntregado.length > 0
                          ? entrega.stockEntregado.reduce(
                              (total, prod) => total + (prod.cantidad || 0),
                              0
                            )
                          : 0}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center">
                        <Coins className="mr-2" size={16} />
                        {safeFormatCurrency(entrega.montoTotal)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEntrega(entrega)}
                          >
                            <Eye className="mr-2" size={16} />
                            Ver Detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0">
                          <DialogHeader className="p-6 pb-0">
                            <DialogTitle>
                              Detalles de la Entrega #{entrega.id}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedEntrega && (
                            <EntregaDetails entrega={selectedEntrega} />
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-center py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button onClick={() => onPageChange(1)}>Primero</Button>
                </PaginationItem>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </PaginationPrevious>
                </PaginationItem>

                {/* Sistema de truncado */}
                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => onPageChange(1)}>
                        1
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-muted-foreground">...</span>
                    </PaginationItem>
                  </>
                )}

                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  if (
                    page === currentPage ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={index}>
                        <PaginationLink
                          onClick={() => onPageChange(page)}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                {currentPage < totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <span className="text-muted-foreground">...</span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink onClick={() => onPageChange(totalPages)}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      onPageChange(Math.min(totalPages, currentPage + 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </PaginationNext>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant={"destructive"}
                    onClick={() => onPageChange(totalPages)}
                  >
                    Último
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
