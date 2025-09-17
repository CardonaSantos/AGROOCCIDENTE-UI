import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Eye,
  MoreVertical,
  CreditCard,
  User,
  Building2,
  Package,
  FileText,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  DeleteIcon,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { CreditoRegistro } from "./CreditosType";

import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import axios from "axios";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import currency from "currency.js";
import { useStore } from "@/components/Context/ContextSucursal";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";

const formatearMoneda = (monto: number) => {
  return currency(monto, {
    symbol: "Q",
    separator: ",",
    decimal: ".",
    precision: 2,
  }).format();
};

const API_URL = import.meta.env.VITE_API_URL;
dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale("es");

interface CreditRecordsTableProps {
  getRegistCredits: () => Promise<void>;
  records: CreditoRegistro[];
  sucursalId: number;
  userId: number;
}

interface Cuota {
  id: number;
  creadoEn: string;
  estado: string;
  fechaPago: string;
  monto: number;
  comentario: string;
  usuario: {
    id: number;
    nombre: string;
  };
}
interface CuotasCardProps {
  cuotas: Cuota[];
}
//===================================================>
interface Plantillas {
  id: number;
  texto: string;
  nombre: string;
}

const FormatearFecha = (fecha: string) => {
  // Formateo en UTC sin conversión a local
  return dayjs(fecha).format("DD/MM/YYYY hh:mm A");
};

export function CreditRecordsTable({
  records,
  sucursalId,
  userId,
  getRegistCredits,
}: CreditRecordsTableProps) {
  console.log("Registros actualizados en hijo:", records); // <-- Debe cambiar después de eliminar
  const [selectedRecord, setSelectedRecord] = useState<CreditoRegistro | null>(
    null
  );
  const [plantillas, setPlantillas] = useState<Plantillas[]>([]);

  const getAllPlantillas = async () => {
    try {
      const response = await axios.get(`${API_URL}/cuotas/get/plantillas`);
      if (response.status === 200) {
        setPlantillas(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error");
    }
  };

  useEffect(() => {
    getAllPlantillas();
  }, []);

  const calcularCuotas = () => {
    if (selectedRecord) {
      // Monto de interés sobre el total de la venta
      // const montoInteres2 = selectedRecord.montoTotalConInteres
      const montoInteres =
        selectedRecord.totalVenta * (selectedRecord.interes / 100);

      // Total con interés
      const montoTotalConInteres = selectedRecord.montoTotalConInteres;

      // Saldo restante después del enganche
      const saldoRestante = montoTotalConInteres - selectedRecord.cuotaInicial;

      // Pago por cuota
      const pagoPorCuota = saldoRestante / selectedRecord.cuotasTotales;

      return {
        saldoRestante,
        montoInteres,
        montoTotalConInteres,
        pagoPorCuota,
      };
    }
    return {
      saldoRestante: 0,
      montoInteres: 0,
      montoTotalConInteres: 0,
      pagoPorCuota: 0,
    };
  };

  const calcularMontoInteres = (totalVenta: number, interes: number) => {
    // Monto de interés sobre el total de la venta
    const montoInteres = totalVenta * (interes / 100);

    // Total con interés
    const montoTotalConInteres = totalVenta + montoInteres;

    // Saldo restante después del enganche

    return {
      montoTotalConInteres,
    };
  };

  const [passwordAdmin, setPasswordAdmin] = useState("");
  const [creditId, setCreditId] = useState<number | null>(null);
  const [openDeleteCredit, setOpenDeleteCredit] = useState(false);

  const handleDeleteCreditRegist = async () => {
    if (!passwordAdmin || !creditId) {
      toast.info("Complete los datos requeridos");
      return;
    }

    const toastId = toast.loading("Eliminando registro de crédito...");

    try {
      const response = await axios.delete(
        `${API_URL}/cuotas/delete-one-credit-regist`,
        {
          data: { passwordAdmin, userId, sucursalId, creditId },
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Registro eliminado correctamente", { id: toastId });

        setOpenDeleteCredit(false);
        setCreditId(null);
        setPasswordAdmin("");

        // await new Promise((resolve) => setTimeout(resolve, 1000));

        await getRegistCredits();
      }
    } catch (error) {
      // Actualiza el toast en caso de error
      toast.error("Error al eliminar registro", { id: toastId });
      console.error(error);
    }
  };

  function CuotasCard({ cuotas }: CuotasCardProps) {
    const [cuotaID, setCuotaID] = useState(0);
    const sucursalID = sucursalId;
    const userId = useStore((state) => state.userId) ?? 0;
    // const sucursalId = useStore((state) => state.sucursalId) ?? 0;

    const [openDeletePayment, setOpenDeletePayment] = useState(false);
    const [password, setPassword] = useState("");

    const handleDeletePaymentCuota = async () => {
      try {
        const response = await axios.delete(
          `${API_URL}/cuotas/delete-one-payment-cuota`,
          {
            data: {
              sucursalID: sucursalID,
              password: password,
              cuotaID: cuotaID,
              userId: userId,
            },
          }
        );

        if (response.status === 200) {
          setOpenDeletePayment(false);
          setCuotaID(0);
          setPassword("");
          setSelectedRecord(null);
          await getRegistCredits();
          toast.success("Registro de pago eliminado");
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al eliminar registro de pago");
      }
    };

    return (
      <>
        <Card className="w-full shadow-sm my-2">
          <CardHeader>
            <h2 className="font-bold text-center">Historial de pagos</h2>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">No</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Pago</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Comentarios</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Eliminar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotas?.length > 0 ? (
                  cuotas
                    .sort(
                      (a, b) =>
                        new Date(a.creadoEn).getTime() -
                        new Date(b.creadoEn).getTime()
                    )
                    .map((cuota, index) => (
                      <TableRow key={cuota.id || "sin-id"}>
                        <TableCell className="font-medium">
                          #{index + 1}
                        </TableCell>
                        <TableCell
                          className={`font-bold text-sm ${
                            cuota.estado === "PENDIENTE"
                              ? "text-red-600" // Rojo oscuro para pagos pendientes
                              : cuota.estado === "PAGADA"
                              ? "text-green-600" // Verde para pagos completados
                              : "text-blue-500" // Azul para otros estados
                          }`}
                        >
                          {cuota.estado ?? "Desconocido"}
                        </TableCell>
                        <TableCell>
                          {cuota.fechaPago
                            ? FormatearFecha(cuota.fechaPago)
                            : "Sin fecha"}
                        </TableCell>
                        <TableCell>
                          {cuota.monto !== undefined
                            ? formatearMoneda(cuota.monto)
                            : "Sin monto"}
                        </TableCell>
                        <TableCell className="text-[0.8rem]">
                          {cuota.comentario ?? "Sin comentarios"}
                        </TableCell>
                        <TableCell className="text-[0.8rem]">
                          {cuota.usuario?.nombre ?? "Usuario no asignado"}
                        </TableCell>

                        <TableCell className="flex justify-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link to={`/cuota/comprobante/${cuota.id}`}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Imprimir Comprobante"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Imprimir Comprobante</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>

                        <TableCell
                          colSpan={5} // Esto asegura que la celda ocupe todas las columnas
                          className=""
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => {
                                    setOpenDeletePayment(true);
                                    setCuotaID(cuota.id);
                                  }}
                                  variant="outline"
                                  size="icon"
                                  aria-label="eliminar-pago"
                                >
                                  <DeleteIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Eliminar registro de pago</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5} // Esto asegura que la celda ocupe todas las columnas
                      className=""
                    >
                      <p>No hay cuotas pagadas disponibles</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog onOpenChange={setOpenDeletePayment} open={openDeletePayment}>
          <DialogContent className="sm:max-w-[425px] md:max-w-[500px] lg:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-center justify-center">
                <AlertTriangle className="h-6 w-6" />
                Eliminación de registro de pago de cuota
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <DialogDescription className=" text-center">
                ¿Estás seguro de que deseas eliminar este registro?
              </DialogDescription>
              <DialogDescription className=" font-semibold text-center">
                Esta acción es irreversible y el saldo será descontado de la
                sucursal.
              </DialogDescription>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Ingrese su contraseña para confirmar"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-12" // Espacio para el icono
                  aria-label="Contraseña de confirmación"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setOpenDeletePayment(false)}
                className="w-full sm:w-1/2 order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePaymentCuota}
                disabled={!password.trim()}
                className="w-full sm:w-1/2 order-1 sm:order-2 flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Sí, eliminar registro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const [filtro, setFiltro] = useState<string>("");

  const filtrados = records?.filter((rec) => {
    const lowerCaseFiltro = filtro.trim().toLocaleLowerCase();
    return (
      rec?.cliente?.nombre?.toLocaleLowerCase().includes(lowerCaseFiltro) ||
      rec?.cliente?.telefono?.toLocaleLowerCase().includes(lowerCaseFiltro) ||
      rec?.cliente?.direccion?.toLocaleLowerCase().includes(lowerCaseFiltro) ||
      rec?.cliente?.dpi?.toLocaleLowerCase().includes(lowerCaseFiltro)
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const totalPages = Math.ceil(filtrados.length / itemsPerPage);

  // Calcular el índice del último elemento de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  // Calcular el índice del primer elemento de la página actual
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Obtener los elementos de la página actual
  const currentItems = filtrados.slice(indexOfFirstItem, indexOfLastItem);

  // Cambiar de página
  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle>Créditos</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          className="w-full my-5"
          placeholder="Buscar por nombre, telefono, dirección, dpi"
          onChange={(e) => setFiltro(e.target.value)}
          value={filtro}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Venta Total</TableHead>
              <TableHead>Monto con interés</TableHead>
              <TableHead>Total Pagado</TableHead>
              <TableHead>Por pagar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ver Detalles</TableHead>
              <TableHead>Imprimir</TableHead>
              <TableHead>Eliminar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems &&
              currentItems.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>#{record.id}</TableCell>
                  <TableCell>{record.cliente.nombre}</TableCell>
                  <TableCell>{formatearMoneda(record.totalVenta)}</TableCell>

                  <TableCell>
                    {formatearMoneda(
                      calcularMontoInteres(record.totalVenta, record.interes)
                        .montoTotalConInteres
                    )}
                  </TableCell>

                  <TableCell>{formatearMoneda(record.totalPagado)}</TableCell>

                  <TableCell>
                    {formatearMoneda(
                      record.montoTotalConInteres - record.totalPagado
                    )}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        record.estado === "ACTIVA"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {record.estado}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      className="flex justify-center items-center"
                      variant={"outline"}
                      onClick={() => setSelectedRecord(record)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {plantillas &&
                          plantillas.map((plantilla) => (
                            <Link
                              to={`/imprimir/contrato/${record.id}/${plantilla.id}`}
                            >
                              <DropdownMenuItem key={plantilla.id}>
                                <FileText className="mr-2 h-4 w-4" />
                                Imprimir con: {plantilla.nombre}
                              </DropdownMenuItem>
                            </Link>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>

                  <TableCell>
                    <Button
                      className="flex justify-center items-center"
                      variant={"outline"}
                      onClick={() => {
                        setCreditId(record.id);
                        setOpenDeleteCredit(true);
                      }}
                    >
                      <DeleteIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog
        open={!!selectedRecord}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Más detalles del registro</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <ScrollArea className="h-[85vh] pr-4">
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <User className="mr-2 h-5 w-5" /> Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <strong>Nombre:</strong> {selectedRecord.cliente.nombre}
                    </p>

                    <p>
                      <strong>Dirección:</strong>{" "}
                      {selectedRecord.cliente.direccion ?? "N/A"}
                    </p>
                    <p>
                      <strong>Teléfono:</strong>{" "}
                      {selectedRecord.cliente.telefono ?? "N/A"}
                    </p>
                    <p>
                      <strong>DPI:</strong> {selectedRecord.dpi}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <CreditCard className="mr-2 h-5 w-5" /> Detalles del
                      Crédito
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <strong>Total Venta:</strong>{" "}
                      {formatearMoneda(selectedRecord.totalVenta)}
                    </p>
                    <p>
                      <strong>Pago Enganche:</strong>{" "}
                      {formatearMoneda(selectedRecord.cuotaInicial)}
                    </p>
                    <p>
                      <strong>Cuotas Totales:</strong>{" "}
                      {selectedRecord.cuotasTotales}
                    </p>
                    <p>
                      <strong>Cuotas Pagadas:</strong>{" "}
                      {selectedRecord.cuotas.length
                        ? selectedRecord.cuotas.length
                        : "Ninguna"}
                    </p>
                    <p>
                      <strong>Pago por cuotas:</strong>{" "}
                      {formatearMoneda(calcularCuotas().pagoPorCuota)}
                    </p>
                    <p>
                      <strong>Monto Total con Interés:</strong>{" "}
                      <span className="text-green-500 font-bold">
                        {formatearMoneda(calcularCuotas().montoTotalConInteres)}
                      </span>
                    </p>
                    <p>
                      <strong>Total Pagado:</strong>{" "}
                      <span
                        className={
                          selectedRecord.totalPagado <
                          calcularCuotas().montoTotalConInteres
                            ? "text-red-500 font-bold"
                            : "text-green-500 font-bold"
                        }
                      >
                        {new Intl.NumberFormat("es-GT", {
                          style: "currency",
                          currency: "GTQ",
                        }).format(selectedRecord.totalPagado)}
                      </span>
                    </p>

                    <p>
                      <strong>Por pagar:</strong>{" "}
                      <span
                        className={
                          selectedRecord.totalPagado <
                          calcularCuotas().montoTotalConInteres
                            ? "text-red-500 font-bold"
                            : "text-green-500 font-bold"
                        }
                      >
                        {new Intl.NumberFormat("es-GT", {
                          style: "currency",
                          currency: "GTQ",
                        }).format(
                          selectedRecord.montoTotalConInteres -
                            selectedRecord.totalPagado
                        )}
                      </span>
                    </p>

                    <p>
                      <strong>Interés Aplicado:</strong>{" "}
                      {selectedRecord.interes}%
                    </p>
                    <p>
                      <strong>Garantía (Meses):</strong>{" "}
                      {selectedRecord.garantiaMeses}
                    </p>
                    <p>
                      <strong>Fecha de registro:</strong>{" "}
                      {FormatearFecha(selectedRecord.fechaInicio)}
                    </p>
                    <p>
                      <strong>Status:</strong>

                      <span
                        className={
                          selectedRecord.estado === "COMPLETADA"
                            ? "text-green-500 font-semibold"
                            : "text-red-500 font-semibold"
                        }
                      >
                        {" "}
                        {selectedRecord.estado}
                      </span>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Package className="mr-2 h-5 w-5" /> Productos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-2">
                      {selectedRecord.productos.map((producto) => (
                        <li key={producto.id} className="text-sm">
                          <div>
                            <strong>Producto:</strong>{" "}
                            {producto.producto.nombre}
                          </div>
                          <div>
                            <strong>Código:</strong>{" "}
                            {producto.producto.codigoProducto}
                          </div>
                          <div>
                            <strong>Precio:</strong>{" "}
                            {new Intl.NumberFormat("es-GT", {
                              style: "currency",
                              currency: "GTQ",
                            }).format(producto.precioVenta)}
                          </div>
                          <div>
                            <strong>Cantidad:</strong> {producto.cantidad}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <User className="mr-2 h-5 w-5" /> Testigos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedRecord &&
                      selectedRecord.testigos
                        .filter(
                          (testigo) =>
                            testigo.direccion &&
                            testigo.nombre &&
                            testigo.telefono
                        )
                        .map((testigo, index) => (
                          <div key={index} className="mb-2">
                            <p>
                              <strong>Nombre:</strong> {testigo.nombre}
                            </p>
                            <p>
                              <strong>Teléfono:</strong> {testigo.telefono}
                            </p>
                            <p>
                              <strong>Dirección:</strong> {testigo.direccion}
                            </p>
                          </div>
                        ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Building2 className="mr-2 h-5 w-5" /> Sucursal
                      Información
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <strong>Nombre:</strong> {selectedRecord.sucursal.nombre}
                    </p>
                    <p>
                      <strong>Dirección:</strong>{" "}
                      {selectedRecord.sucursal.direccion}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <User className="mr-2 h-5 w-5" /> Usuario
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <strong>Nombre:</strong> {selectedRecord.usuario.nombre}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <CuotasCard cuotas={selectedRecord.cuotas} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquareText className="mr-2 h-5 w-5" /> Comentario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    {selectedRecord.comentario ? (
                      selectedRecord.comentario
                    ) : (
                      <p className="text-center">
                        No hay comentarios disponibles
                      </p>
                    )}
                  </p>
                </CardContent>
              </Card>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setOpenDeleteCredit} open={openDeleteCredit}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[500px] lg:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-center justify-center">
              <AlertTriangle className="h-6 w-6" />
              Eliminación de registro de crédito
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <DialogDescription className=" text-center">
              ¿Estás seguro de que deseas eliminar este registro?
            </DialogDescription>
            <DialogDescription className=" font-semibold text-center">
              Esta acción es irreversible y el saldo será descontado de la
              sucursal.
            </DialogDescription>
            <div className="relative">
              <Input
                type="password"
                placeholder="Ingrese su contraseña para confirmar"
                value={passwordAdmin}
                onChange={(e) => setPasswordAdmin(e.target.value)}
                className="pr-12" // Espacio para el icono
                aria-label="Contraseña de confirmación"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => setOpenDeleteCredit(false)}
              className="w-full sm:w-1/2 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCreditRegist}
              disabled={!passwordAdmin.trim()}
              className="w-full sm:w-1/2 order-1 sm:order-2 flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Sí, eliminar registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardFooter className="w-full flex justify-center items-center">
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
      </CardFooter>
    </Card>
  );
}
