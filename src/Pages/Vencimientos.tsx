import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VencimientoResponse } from "@/Types/Vencimientos/VencimientoR";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Barcode,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  MapPin,
  Package2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
type DialogState = {
  isOpen: boolean;
  vencimiento: VencimientoResponse | null;
};

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale("es");
const formatearFecha = (fecha: string) => {
  return dayjs(fecha).format("DD MMMM YYYY ");
};

function Vencimientos() {
  const [vencimientos, setVencimientos] = useState<VencimientoResponse[]>([]);
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    vencimiento: null,
  });

  const getVencimientos = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/vencimientos/get-all-regist-expiration`
      );

      if (response.status === 200) {
        setVencimientos(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir registros de vencimientos");
    }
  };

  useEffect(() => {
    getVencimientos();
  }, []);

  const openDialog = (vencimiento: VencimientoResponse) => {
    setDialogState({ isOpen: true, vencimiento });
  };

  const closeDialog = () => {
    setDialogState({ isOpen: false, vencimiento: null });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return <Badge variant="destructive">Pendiente</Badge>;
      case "RESUELTO":
        return <Badge variant="default">Resuelto</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  console.log("El dialog state es: ", dialogState);

  //=============PAGINACION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(vencimientos.length / itemsPerPage);

  // Calcular el índice del último elemento de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  // Calcular el índice del primer elemento de la página actual
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Obtener los elementos de la página actual
  const currentItems = vencimientos.slice(indexOfFirstItem, indexOfLastItem);

  // Cambiar de página
  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  console.log("los venciminetos son: ", vencimientos);

  return (
    <div className="container mx-auto ">
      <PageHeader
        title="Vencimientos"
        subtitle="Vea sus vencimientos próximos"
        sticky={false}
        fallbackBackTo="/"
      />

      <div className="rounded-md border">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle></CardTitle>
            <CardDescription></CardDescription>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>

                    <TableHead>Producto</TableHead>
                    <TableHead>Fecha de Vencimiento</TableHead>
                    <TableHead>Notificado el día</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems &&
                    currentItems.map((vencimiento) => (
                      <TableRow key={vencimiento.id}>
                        <TableCell>#{vencimiento.id}</TableCell>

                        <TableCell className="font-medium">
                          {vencimiento?.stock?.producto?.nombre}
                        </TableCell>
                        <TableCell>
                          {formatearFecha(vencimiento.fechaVencimiento)}
                        </TableCell>
                        <TableCell>
                          {formatearFecha(vencimiento.fechaCreacion)}
                        </TableCell>
                        <TableCell>
                          {vencimiento.stock.sucursal.nombre}
                        </TableCell>
                        <TableCell>
                          <Dialog
                            open={
                              dialogState.isOpen &&
                              dialogState.vencimiento?.id === vencimiento.id
                            }
                            onOpenChange={(isOpen) => {
                              if (!isOpen) closeDialog();
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDialog(vencimiento)}
                              >
                                Ver detalles
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-semibold">
                                  Detalles del Vencimiento
                                </DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh] pr-4">
                                <div className="space-y-4">
                                  <div className="columns-2">
                                    <div className="flex items-center space-x-2">
                                      <Package2 className="h-4 w-4 text-primary flex-shrink-0" />
                                      <div>
                                        <h3 className="font-semibold text-sm">
                                          Producto
                                        </h3>
                                        <p className="text-xs">
                                          {vencimiento.stock.producto.nombre}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Barcode className="h-4 w-4 text-primary flex-shrink-0" />
                                      <div>
                                        <h3 className="font-semibold text-sm">
                                          Código
                                        </h3>
                                        <p className="text-xs">
                                          {
                                            vencimiento.stock.producto
                                              .codigoProducto
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="columns-2">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                                      <div>
                                        <h3 className="font-semibold text-sm">
                                          Fecha de Vencimiento de este stock
                                        </h3>
                                        <p className="text-xs">
                                          {formatearFecha(
                                            vencimiento.fechaVencimiento
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Info className="h-4 w-4 text-primary flex-shrink-0" />
                                      <div>
                                        <h3 className="font-semibold text-sm">
                                          Estado
                                        </h3>
                                        {getEstadoBadge(vencimiento.estado)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                    <div>
                                      <h3 className="font-semibold text-sm">
                                        Estado
                                      </h3>
                                      <p className="text-xs">
                                        {vencimiento.stock.sucursal.nombre}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-start space-x-2">
                                    <FileText className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                    <div>
                                      <h3 className="font-semibold text-sm">
                                        Descripción
                                      </h3>
                                      <p className="text-xs text-muted-foreground">
                                        {vencimiento.descripcion}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </CardHeader>
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
        </Card>
      </div>
    </div>
  );
}

export default Vencimientos;
