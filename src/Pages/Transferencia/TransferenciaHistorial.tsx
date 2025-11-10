"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  UserIcon,
  Eye,
  Building,
  BoxIcon,
  ClockIcon,
  BringToFront,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { useStore } from "@/components/Context/ContextSucursal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PageHeader } from "@/utils/components/PageHeaderPos";
const API_URL = import.meta.env.VITE_API_URL;

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  codigoProducto: string;
  creadoEn: string;
  actualizadoEn: string;
}

interface Usuario {
  id: number;
  nombre: string;
  rol: string;
  activo: boolean;
  correo: string;
  sucursalId: number;
}

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  tipoSucursal: string;
  estadoOperacion: boolean;
}

interface Transferencia {
  id: number;
  productoId: number;
  cantidad: number;
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  fechaTransferencia: string;
  usuarioEncargadoId: number;
  producto: Producto;
  usuarioEncargado: Usuario;
  sucursalDestino: Sucursal;
  sucursalOrigen: Sucursal;
}

export default function TransferenciaProductosHistorial() {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sucursalId = useStore((state) => state.sucursalId);
  console.log("Las transferencias de sucursales son:", transferencias);

  dayjs.extend(localizedFormat);
  dayjs.extend(customParseFormat);
  dayjs.locale("es");
  const formatearFecha = (fecha: string) => {
    let nueva_fecha = dayjs(fecha).format("DD MMMM YYYY, hh:mm:ss A");
    return nueva_fecha;
  };

  useEffect(() => {
    const fetchTransferencias = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/transferencia-producto/get-my-translates/${sucursalId}`
        );
        setTransferencias(response.data);
      } catch (err) {
        setError(
          "Hubo un error al cargar los datos. Por favor, intenta de nuevo."
        );
      }
    };

    if (sucursalId) {
      fetchTransferencias();
    }
  }, [sucursalId]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(transferencias.length / itemsPerPage);

  // Calcular el índice del último elemento de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  // Calcular el índice del primer elemento de la página actual
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Obtener los elementos de la página actual
  const currentItems = transferencias.slice(indexOfFirstItem, indexOfLastItem);

  // Cambiar de página
  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const InfoItem = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
  }) => (
    <div className="flex items-start space-x-3 p-2">
      <div className="flex-shrink-0 text-primary">{icon}</div>
      <div>
        <p className="font-medium text-sm text-muted-foreground">{label}</p>
        <p className="text-sm">{value || "No especificado"}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Historiales de transferencias"
        subtitle="Tranfiera sus stocks entre sus sucursales"
        sticky={false}
        fallbackBackTo="/"
      />
      <Card className="shadow-xl">
        <CardContent>
          <div className="">
            {/* {transferencias.map((transferencia) => ( */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Sucursal Origen</TableHead>
                  <TableHead>Sucursal Destino</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems &&
                  currentItems.map((transferencia) => (
                    <TableRow>
                      <TableCell>{transferencia.producto.nombre}</TableCell>
                      <TableCell>
                        {transferencia.sucursalOrigen.nombre}
                      </TableCell>
                      <TableCell>
                        {transferencia.sucursalDestino.nombre}
                      </TableCell>
                      <TableCell>
                        {formatearFecha(transferencia.fechaTransferencia)}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2" size={16} />
                              Ver Detalles
                            </Button>
                          </DialogTrigger>

                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="text-center">
                                Tranferencia de producto
                              </DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh] pr-4">
                              <Card className="mt-4 border-none shadow-none">
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <InfoItem
                                    icon={<BoxIcon className="h-5 w-5" />}
                                    label="Producto"
                                    value={
                                      transferencia.producto.nombre ?? undefined
                                    }
                                  />
                                  <InfoItem
                                    icon={<BringToFront className="h-5 w-5" />}
                                    label="Cantidad trasladada"
                                    value={
                                      String(transferencia.cantidad) ??
                                      undefined
                                    }
                                  />
                                  <InfoItem
                                    icon={<Building className="h-5 w-5" />}
                                    label="Sucursal de origen"
                                    value={
                                      transferencia.sucursalOrigen.nombre ??
                                      undefined
                                    }
                                  />
                                  <InfoItem
                                    icon={<Building className="h-5 w-5" />}
                                    label="Sucursal de destino"
                                    value={
                                      transferencia.sucursalDestino.nombre ??
                                      undefined
                                    }
                                  />
                                  <InfoItem
                                    icon={<UserIcon className="h-5 w-5" />}
                                    label="Encargado"
                                    value={
                                      transferencia.usuarioEncargado.nombre ??
                                      undefined
                                    }
                                  />

                                  <InfoItem
                                    icon={<ClockIcon className="h-5 w-5" />}
                                    label="Producto"
                                    value={
                                      formatearFecha(
                                        transferencia.fechaTransferencia
                                      ) ?? undefined
                                    }
                                  />
                                </CardContent>
                              </Card>

                              {/* <Card className="mt-6 border-none shadow-none">
                            <CardHeader>
                              <CardTitle className="text-xl font-semibold text-primary">
                                Información de Contacto
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <InfoItem
                                icon={<User className="h-5 w-5" />}
                                label="Nombre del Contacto"
                                value={providerView.nombreContacto ?? undefined}
                              />
                              <InfoItem
                                icon={<Phone className="h-5 w-5" />}
                                label="Teléfono de Contacto"
                                value={
                                  providerView.telefonoContacto ?? undefined
                                }
                              />
                              <InfoItem
                                icon={<Mail className="h-5 w-5" />}
                                label="Email de Contacto"
                                value={providerView.emailContacto ?? undefined}
                              />
                            </CardContent>
                          </Card> */}
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {/* ))} */}
          </div>
          <CardFooter className="flex justify-center items-center">
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
                        <PaginationLink
                          onClick={() => onPageChange(totalPages)}
                        >
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
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  );
}
