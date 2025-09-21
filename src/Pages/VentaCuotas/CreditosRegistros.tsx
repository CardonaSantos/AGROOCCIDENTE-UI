import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
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
  Package,
  FileText,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  DeleteIcon,
  AlertTriangle,
  Trash2,
  Layers,
} from "lucide-react";
import { CreditoRegistro, ProductoVenta } from "./CreditosType";

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

const API_URL = import.meta.env.VITE_API_URL;

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale("es");

// ===================== Utils ======================
const GTQ = (n: number) =>
  currency(n ?? 0, {
    symbol: "Q",
    separator: ",",
    decimal: ".",
    precision: 2,
  }).format();

const fDate = (iso?: string | null) =>
  iso ? dayjs(iso).format("DD/MM/YYYY hh:mm A") : "—";

const notEmpty = <T,>(v: T | null | undefined): v is T => v != null;

// ===================== Tipos locales null-safe ======================
type CuotaUI = {
  id: number;
  creadoEn: string;
  estado: string;
  fechaPago: string | null;
  monto: number;
  comentario: string;
  usuario: { id: number; nombre: string } | null;
};

// ===================== Componente ======================
interface CreditRecordsTableProps {
  getRegistCredits: () => Promise<void>;
  records: CreditoRegistro[];
  sucursalId: number;
  userId: number;
}

export function CreditRecordsTable({
  records,
  sucursalId,
  userId,
  getRegistCredits,
}: CreditRecordsTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<CreditoRegistro | null>(
    null
  );
  const [plantillas, setPlantillas] = useState<
    { id: number; texto: string; nombre: string }[]
  >([]);
  const [passwordAdmin, setPasswordAdmin] = useState("");
  const [creditId, setCreditId] = useState<number | null>(null);
  const [openDeleteCredit, setOpenDeleteCredit] = useState(false);
  const [filtro, setFiltro] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const { data, status } = await axios.get(
          `${API_URL}/cuotas/get/plantillas`
        );
        if (status === 200) setPlantillas(data);
      } catch (e) {
        console.error(e);
        toast.error("Error cargando plantillas");
      }
    })();
  }, []);

  // ======== helpers de cálculo ========
  const calcularCuotas = (rec: CreditoRegistro | null) => {
    if (!rec) {
      return {
        saldoRestante: 0,
        montoInteres: 0,
        montoTotalConInteres: 0,
        pagoPorCuota: 0,
      };
    }
    const montoInteres = rec.totalVenta * (rec.interes / 100);
    const montoTotalConInteres = rec.montoTotalConInteres; // ya viene del server
    const saldoRestante = montoTotalConInteres - rec.cuotaInicial;
    const pagoPorCuota = saldoRestante / rec.cuotasTotales;
    return { saldoRestante, montoInteres, montoTotalConInteres, pagoPorCuota };
  };

  const calcularMontoConInteres = (total: number, interes: number) => {
    const montoInteres = total * (interes / 100);
    return { montoTotalConInteres: total + montoInteres };
  };

  // ======== borrar crédito ========
  const handleDeleteCreditRegist = async () => {
    if (!passwordAdmin || !creditId) {
      toast.info("Complete los datos requeridos");
      return;
    }
    const toastId = toast.loading("Eliminando registro de crédito...");
    try {
      const res = await axios.delete(
        `${API_URL}/cuotas/delete-one-credit-regist`,
        {
          data: { passwordAdmin, userId, sucursalId, creditId },
        }
      );
      if (res.status === 200 || res.status === 201) {
        toast.success("Registro eliminado correctamente", { id: toastId });
        setOpenDeleteCredit(false);
        setCreditId(null);
        setPasswordAdmin("");
        await getRegistCredits();
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al eliminar registro", { id: toastId });
    }
  };

  // ======== Filtro y paginación ========
  const filtrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return records;
    return records.filter((rec) => {
      const c = rec.cliente;
      return (
        c?.nombre?.toLowerCase().includes(q) ||
        c?.telefono?.toLowerCase().includes(q) ||
        c?.direccion?.toLowerCase().includes(q) ||
        rec?.dpi?.toLowerCase().includes(q)
      );
    });
  }, [records, filtro]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const totalPages = Math.max(1, Math.ceil(filtrados.length / itemsPerPage));
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtrados.slice(start, start + itemsPerPage);
  }, [filtrados, currentPage]);

  // ======== Split de líneas ========
  const getProductLines = (rec: CreditoRegistro | null): ProductoVenta[] =>
    (rec?.productos ?? []).filter((l) => l.productoId != null);

  const getPresentationLines = (rec: CreditoRegistro | null): ProductoVenta[] =>
    (rec?.productos ?? []).filter((l) => l.presentacionId != null);

  // ===================== Sub-componente: Cuotas ======================
  function CuotasCard({ cuotas }: { cuotas: CuotaUI[] }) {
    const [cuotaID, setCuotaID] = useState(0);
    const [openDeletePayment, setOpenDeletePayment] = useState(false);
    const [password, setPassword] = useState("");
    const _userId = useStore((s) => s.userId) ?? 0;

    const handleDeletePaymentCuota = async () => {
      try {
        const res = await axios.delete(
          `${API_URL}/cuotas/delete-one-payment-cuota`,
          {
            data: {
              sucursalID: sucursalId,
              password,
              cuotaID,
              userId: _userId,
            },
          }
        );
        if (res.status === 200) {
          setOpenDeletePayment(false);
          setCuotaID(0);
          setPassword("");
          setSelectedRecord(null);
          await getRegistCredits();
          toast.success("Registro de pago eliminado");
        }
      } catch (e) {
        console.error(e);
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
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="min-w-[64px]">No</TableHead>
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
                  {cuotas?.length ? (
                    [...cuotas]
                      .sort(
                        (a, b) =>
                          new Date(a.creadoEn).getTime() -
                          new Date(b.creadoEn).getTime()
                      )
                      .map((cuota, idx) => (
                        <TableRow key={cuota.id}>
                          <TableCell className="font-medium">
                            #{idx + 1}
                          </TableCell>
                          <TableCell
                            className={`font-semibold text-sm ${
                              cuota.estado === "PENDIENTE"
                                ? "text-red-600"
                                : cuota.estado === "PAGADA"
                                ? "text-green-600"
                                : "text-blue-500"
                            }`}
                          >
                            {cuota.estado ?? "Desconocido"}
                          </TableCell>
                          <TableCell>{fDate(cuota.fechaPago)}</TableCell>
                          <TableCell>{GTQ(cuota.monto)}</TableCell>
                          <TableCell className="text-[0.8rem]">
                            {cuota.comentario ?? "—"}
                          </TableCell>
                          <TableCell className="text-[0.8rem]">
                            {cuota.usuario?.nombre ?? "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link to={`/cuota/comprobante/${cuota.id}`}>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      aria-label="Comprobante"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Imprimir comprobante
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center">
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
                                    aria-label="Eliminar pago"
                                  >
                                    <DeleteIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Eliminar registro de pago
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        No hay cuotas registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog onOpenChange={setOpenDeletePayment} open={openDeletePayment}>
          <DialogContent className="sm:max-w-[425px] md:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-center justify-center">
                <AlertTriangle className="h-6 w-6" />
                Eliminar registro de pago
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <DialogDescription className="text-center">
                Esta acción es irreversible y ajustará el saldo de la sucursal.
              </DialogDescription>
              <Input
                type="password"
                placeholder="Contraseña de confirmación"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenDeletePayment(false)}
                className="w-full"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePaymentCuota}
                disabled={!password.trim()}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sí, eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Créditos</CardTitle>
        <Input
          className="w-full sm:max-w-[420px]"
          placeholder="Buscar por nombre, teléfono, dirección o DPI"
          onChange={(e) => setFiltro(e.target.value)}
          value={filtro}
        />
      </CardHeader>

      <CardContent>
        <div className="w-full overflow-x-auto">
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
                <TableHead>Ver</TableHead>
                <TableHead>Imprimir</TableHead>
                <TableHead>Eliminar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((record) => {
                const { montoTotalConInteres } = calcularMontoConInteres(
                  record.totalVenta,
                  record.interes
                );
                return (
                  <TableRow key={record.id}>
                    <TableCell>#{record.id}</TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {record.cliente.nombre}
                    </TableCell>
                    <TableCell>{GTQ(record.totalVenta)}</TableCell>
                    <TableCell>{GTQ(montoTotalConInteres)}</TableCell>
                    <TableCell>{GTQ(record.totalPagado)}</TableCell>
                    <TableCell>
                      {GTQ(record.montoTotalConInteres - record.totalPagado)}
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
                        variant="outline"
                        size="icon"
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
                          {plantillas.map((p) => (
                            <Link
                              key={p.id}
                              to={`/imprimir/contrato/${record.id}/${p.id}`}
                            >
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                Imprimir con: {p.nombre}
                              </DropdownMenuItem>
                            </Link>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setCreditId(record.id);
                          setOpenDeleteCredit(true);
                        }}
                      >
                        <DeleteIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!currentItems.length && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-6">
                    No hay créditos para mostrar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* ===================== Detalle ===================== */}
      <Dialog
        open={!!selectedRecord}
        onOpenChange={(o) => !o && setSelectedRecord(null)}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Más detalles del registro</DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <ScrollArea className="h-[85vh] pr-1 sm:pr-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Cliente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
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

                {/* Crédito */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Detalles del Crédito
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <strong>Total Venta:</strong>{" "}
                      {GTQ(selectedRecord.totalVenta)}
                    </p>
                    <p>
                      <strong>Enganche:</strong>{" "}
                      {GTQ(selectedRecord.cuotaInicial)}
                    </p>
                    <p>
                      <strong>Cuotas Totales:</strong>{" "}
                      {selectedRecord.cuotasTotales}
                    </p>
                    <p>
                      <strong>Cuotas Pagadas:</strong>{" "}
                      {selectedRecord.cuotas.length || "Ninguna"}
                    </p>
                    <p>
                      <strong>Pago por cuota:</strong>{" "}
                      {GTQ(calcularCuotas(selectedRecord).pagoPorCuota)}
                    </p>
                    <p>
                      <strong>Total con Interés:</strong>{" "}
                      <span className="text-green-600 font-semibold">
                        {GTQ(
                          calcularCuotas(selectedRecord).montoTotalConInteres
                        )}
                      </span>
                    </p>
                    <p className="col-span-2">
                      <strong>Total Pagado:</strong>{" "}
                      <span
                        className={
                          selectedRecord.totalPagado <
                          calcularCuotas(selectedRecord).montoTotalConInteres
                            ? "text-red-600 font-semibold"
                            : "text-green-600 font-semibold"
                        }
                      >
                        {GTQ(selectedRecord.totalPagado)}
                      </span>
                    </p>
                    <p className="col-span-2">
                      <strong>Por pagar:</strong>{" "}
                      <span
                        className={
                          selectedRecord.totalPagado <
                          calcularCuotas(selectedRecord).montoTotalConInteres
                            ? "text-red-600 font-semibold"
                            : "text-green-600 font-semibold"
                        }
                      >
                        {GTQ(
                          selectedRecord.montoTotalConInteres -
                            selectedRecord.totalPagado
                        )}
                      </span>
                    </p>
                    <p>
                      <strong>Interés:</strong> {selectedRecord.interes}%
                    </p>
                    <p>
                      <strong>Garantía:</strong> {selectedRecord.garantiaMeses}{" "}
                      meses
                    </p>
                    <p className="col-span-2">
                      <strong>Fecha de registro:</strong>{" "}
                      {fDate(selectedRecord.fechaInicio)}
                    </p>
                    <p className="col-span-2">
                      <strong>Status:</strong>{" "}
                      <span
                        className={
                          selectedRecord.estado === "COMPLETADA"
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {selectedRecord.estado}
                      </span>
                    </p>
                  </CardContent>
                </Card>

                {/* Productos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Productos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableCaption>Líneas de productos</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[180px]">
                              Nombre
                            </TableHead>
                            <TableHead>Código producto</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead className="text-right">
                              Cantidad
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getProductLines(selectedRecord).length ? (
                            getProductLines(selectedRecord).map((l) => (
                              <TableRow key={l.id}>
                                <TableCell className="font-medium">
                                  {l.producto?.nombre ?? "—"}
                                </TableCell>
                                <TableCell>
                                  {l.producto?.codigoProducto ?? "—"}
                                </TableCell>
                                <TableCell>{GTQ(l.precioVenta)}</TableCell>
                                <TableCell className="text-right">
                                  {l.cantidad}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="text-center py-6"
                              >
                                No hay productos en esta venta.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Presentaciones */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Presentaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-x-auto">
                      <Table>
                        <TableCaption>Líneas de presentaciones</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[220px]">
                              Nombre
                            </TableHead>
                            <TableHead>Código Barras</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">
                              Cantidad
                            </TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getPresentationLines(selectedRecord).length ? (
                            getPresentationLines(selectedRecord).map((l) => (
                              <TableRow key={l.id}>
                                <TableCell className="font-medium">
                                  {l.presentacion?.nombre ?? "—"}
                                </TableCell>
                                <TableCell>
                                  {l.presentacion?.codigoBarras ?? "—"}
                                </TableCell>
                                <TableCell>
                                  {l.presentacion?.sku ?? "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {l.cantidad}
                                </TableCell>
                                <TableCell className="text-right">
                                  {GTQ(l.precioVenta)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-6"
                              >
                                No hay presentaciones en esta venta.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Usuario / Sucursal */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Usuario / Sucursal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <p>
                        <strong>Usuario:</strong>{" "}
                        {selectedRecord.usuario.nombre}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Sucursal:</strong>{" "}
                        {selectedRecord.sucursal.nombre}
                      </p>
                      <p>
                        <strong>Dirección:</strong>{" "}
                        {selectedRecord.sucursal.direccion}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cuotas */}
              <CuotasCard
                cuotas={selectedRecord.cuotas as unknown as CuotaUI[]}
              />

              {/* Comentario */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquareText className="h-5 w-5" />
                    Comentario
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  {selectedRecord.comentario ? (
                    <p className="leading-relaxed">
                      {selectedRecord.comentario}
                    </p>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No hay comentarios.
                    </p>
                  )}
                </CardContent>
              </Card>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================== Modal eliminar crédito ===================== */}
      <Dialog onOpenChange={setOpenDeleteCredit} open={openDeleteCredit}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-center justify-center">
              <AlertTriangle className="h-6 w-6" />
              Eliminación de registro de crédito
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <DialogDescription className="text-center">
              ¿Estás seguro de eliminar este registro? Esta acción es
              irreversible y el saldo será descontado.
            </DialogDescription>
            <Input
              type="password"
              placeholder="Contraseña de confirmación"
              value={passwordAdmin}
              onChange={(e) => setPasswordAdmin(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenDeleteCredit(false)}
              className="w-full"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCreditRegist}
              disabled={!passwordAdmin.trim()}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===================== Paginación ===================== */}
      <CardFooter className="w-full flex justify-center items-center">
        <div className="flex items-center justify-center py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button onClick={() => setCurrentPage(1)}>Primero</Button>
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PaginationPrevious>
              </PaginationItem>

              {/* Truncado */}
              {currentPage > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(1)}>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-muted-foreground">…</span>
                  </PaginationItem>
                </>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === currentPage ||
                    (p >= currentPage - 1 && p <= currentPage + 1)
                )
                .map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      onClick={() => setCurrentPage(p)}
                      isActive={p === currentPage}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}

              {currentPage < totalPages - 2 && (
                <>
                  <PaginationItem>
                    <span className="text-muted-foreground">…</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </PaginationNext>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="destructive"
                  onClick={() => setCurrentPage(totalPages)}
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
