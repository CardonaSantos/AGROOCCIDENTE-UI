"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  DollarSign,
  ShoppingCart,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  FileText,
  Hash,
  Truck,
  ClipboardList,
  Mail,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  getCajasAbiertas,
  getCuentasBancariasArrray,
  getProveedores,
  getRegistroCompra,
  recepcionarCompraAuto,
} from "./API/api";
import {
  CompraPedidoUI,
  CompraRegistroUI,
} from "./Interfaces/RegistroCompraInterface";
import { EstadoCompra } from "./API/interfaceQuery";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { formattFechaWithMinutes } from "../Utils/Utils";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ReactSelectComponent from "react-select";
import { useStore } from "@/components/Context/ContextSucursal";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";
import { CompraRequisicionUI } from "./Interfaces/Interfaces1";

interface Option {
  label: string;
  value: string;
}

// Animaciones
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

const tableVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
};

interface Proveedores {
  id: number;
  nombre: string;
}

interface CuentasBancarias {
  id: number;
  nombre: string;
  numero: number;
  banco: string;
}

// 1) Tipos y helpers arriba del componente (o en un archivo de utils compartido)
type MetodoPago =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "TARJETA"
  | "CHEQUE"
  | "CREDITO"
  | "OTRO"
  | "CONTADO";

const METODO_PAGO_OPTIONS: Array<{
  value: MetodoPago;
  label: string;
  canal: "CAJA" | "BANCO" | "NINGUNO";
}> = [
  { value: "EFECTIVO", label: "Efectivo", canal: "CAJA" },
  { value: "TRANSFERENCIA", label: "Transferencia/Depósito", canal: "BANCO" },
  { value: "TARJETA", label: "Tarjeta", canal: "BANCO" },
  { value: "CHEQUE", label: "Cheque", canal: "BANCO" },
];

export interface CajaConSaldo {
  id: number;
  fechaApertura: string; // ISO date string
  estado: string; // puedes ajustar los posibles estados
  actualizadoEn: string; // ISO date string
  saldoInicial: number; // conviene tiparlo como number en vez de string
  usuarioInicioId: number;
  disponibleEnCaja: number;
}

export default function CompraDetalle() {
  // === Helpers ===
  const isBankMethod = (m?: MetodoPago | "") =>
    m === "TRANSFERENCIA" || m === "TARJETA" || m === "CHEQUE";

  const isCashMethod = (m?: MetodoPago | "") =>
    m === "EFECTIVO" || m === "CONTADO";

  // === Router / Store ===
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;
  const compraId = Number.isFinite(Number(id)) ? Number(id) : 1;

  // === States ===
  const [registro, setRegistro] = useState<CompraRegistroUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openSendStock, setOpenSendStock] = useState(false);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [isSubmiting, setIsSubmiting] = useState(false);

  const [observaciones, setObservaciones] = useState<string>("");
  const [proveedores, setProveedor] = useState<Proveedores[]>([]);
  const [proveedorSelected, setProveedorSelected] = useState<
    string | undefined
  >(undefined);

  const [cuentasBancarias, setCuentasBancarias] = useState<CuentasBancarias[]>(
    []
  );
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("");
  const [cuentaBancariaSelected, setCuentaBancariaSelected] =
    useState<string>("");

  const [cajasDisponibles, setCajasDisponibles] = useState<CajaConSaldo[]>([]);
  const [cajaSelected, setCajaSelected] = useState<string | null>(null);
  // === Derived values === (coloca esto DESPUÉS de tener `registro`)

  // === Data Loader ===
  const getData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getRegistroCompra(compraId);
      setRegistro(data);

      const providers = await getProveedores();
      setProveedor(providers);

      const cBancarias = await getCuentasBancariasArrray();
      setCuentasBancarias(cBancarias);

      const cajasDisponibles = await getCajasAbiertas(sucursalId);
      setCajasDisponibles(cajasDisponibles);
    } catch (err) {
      setError("Error al cargar el registro de compra");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [compraId, sucursalId]);
  const montoRecepcion = Number(
    registro?.resumen?.subtotal ?? registro?.total ?? 0
  );
  // === Effects ===
  useEffect(() => {
    if (!isBankMethod(metodoPago) && cuentaBancariaSelected) {
      setCuentaBancariaSelected("");
    }
  }, [metodoPago, cuentaBancariaSelected]);

  useEffect(() => {
    if (!isCashMethod(metodoPago)) {
      setCajaSelected(null);
      return;
    }
    const candidatas = cajasDisponibles
      .filter((c) => Number(c.disponibleEnCaja) >= montoRecepcion)
      .sort((a, b) => Number(b.disponibleEnCaja) - Number(a.disponibleEnCaja));

    if (!candidatas.length) {
      setCajaSelected(null);
      return;
    }

    const yaSeleccionadaEsValida =
      cajaSelected &&
      candidatas.some((c) => String(c.id) === String(cajaSelected));

    if (!yaSeleccionadaEsValida) {
      setCajaSelected(String(candidatas[0].id));
    }
  }, [metodoPago, cajasDisponibles, montoRecepcion, cajaSelected]);

  useEffect(() => {
    if (!Number.isFinite(compraId) || compraId <= 0) {
      setError("ID de compra inválido");
      return;
    }
    getData();
  }, [compraId, getData]);

  // === Handlers ===
  const onBack = () => navigate(-1);

  const handleSelectCaja = (option: Option | null) => {
    if (option) {
      setCajaSelected(option.value ?? null);
    } else {
      setCajaSelected(null);
    }
  };

  console.log("banco seleccionado es: ", cuentaBancariaSelected);

  const sendtToStock = async () => {
    if (!registro || isSubmiting) return;
    setIsSubmiting(true);

    const usuarioId = registro.usuario.id ?? 1;

    if (!metodoPago) {
      toast.error("Seleccione un método de pago");
      setIsSubmiting(false);
      return;
    }

    if (isBankMethod(metodoPago) && !cuentaBancariaSelected) {
      toast.error("Seleccione una cuenta bancaria para este método");
      setIsSubmiting(false);
      return;
    }

    const payload: any = {
      compraId,
      usuarioId,
      observaciones,
      proveedorId: Number(proveedorSelected),
      metodoPago,
      cuentaBancariaId: parseInt(cuentaBancariaSelected),
    };

    console.log("el payload es: ", payload);

    if (isBankMethod(metodoPago)) {
      payload.cuentaBancariaId = parseInt(cuentaBancariaSelected);
    }
    if (isCashMethod(metodoPago)) {
      if (!cajaSelected) {
        toast.error("Seleccione una caja con saldo suficiente.");
        setIsSubmiting(false);
        return;
      }
      payload.registroCajaId = parseInt(cajaSelected);
    }

    try {
      await toast.promise(recepcionarCompraAuto(payload), {
        loading: "Recepcionando compra...",
        success: "Compra recepcionada y enviada a stock",
        error: (error) => getApiErrorMessageAxios(error),
      });
      await getData();
      setOpenSendStock(false);
      setObservaciones("");
    } finally {
      setIsSubmiting(false);
      setOpenFormDialog(false);
    }
  };

  // === UI Utils ===
  const optionsCajas: Option[] = cajasDisponibles.map((c) => ({
    label: `Caja #${c.id} · Inicial ${formattMonedaGT(
      c.saldoInicial
    )} · Disponible ${formattMonedaGT(c.disponibleEnCaja)}`,
    value: c.id.toString(),
  }));

  const getEstadoBadge = (estado: EstadoCompra) => {
    const variants = {
      RECIBIDO: {
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-green-600",
      },
      CANCELADO: {
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-red-600",
      },
      RECIBIDO_PARCIAL: {
        variant: "secondary" as const,
        icon: AlertCircle,
        color: "text-orange-600",
      },
      ESPERANDO_ENTREGA: {
        variant: "outline" as const,
        icon: Truck,
        color: "text-blue-600",
      },
    };

    const config = variants[estado] || variants.ESPERANDO_ENTREGA;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {estado.replace("_", " ")}
      </Badge>
    );
  };

  useEffect(() => {
    const id = registro?.proveedor?.id;
    setProveedorSelected(id ? String(id) : undefined);
  }, [registro?.proveedor?.id]);

  // === Render condicional ===
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            Cargando registro de compra...
          </p>
        </div>
      </div>
    );
  }

  if (error || !registro) {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p className="text-sm text-muted-foreground">
            {error || "Registro no encontrado"}
          </p>
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="mt-4 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
        </div>
      </div>
    );
  }

  // === Derived values ===
  const addedToStock: boolean = ["RECIBIDO", "RECIBIDO_PARCIAL"].includes(
    registro.estado
  );

  // caja seleccionada tiene saldo suficiente?
  const cajaSel = cajasDisponibles.find(
    (c) => String(c.id) === String(cajaSelected)
  );
  const cajaTieneSaldo = isCashMethod(metodoPago)
    ? !!cajaSel && Number(cajaSel.disponibleEnCaja) >= montoRecepcion
    : true;

  const requiereBanco = isBankMethod(metodoPago);
  const requiereCaja = isCashMethod(metodoPago);

  const canContinue =
    !!observaciones.trim() &&
    !!proveedorSelected &&
    !!metodoPago &&
    (!requiereBanco || !!cuentaBancariaSelected) &&
    (!requiereCaja || (!!cajaSelected && cajaTieneSaldo));

  // Debug logs
  console.log("El proveedor es: ", proveedorSelected);
  console.log("El registro de compra es: ", registro);
  console.log("La caja seleccionada es: ", cajaSelected);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-background p-2 sm:p-4"
    >
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-semibold">
              Registro de Compra #{registro.id}
            </h1>
            <p className="text-xs text-muted-foreground">
              {registro.sucursal?.nombre || "Sin sucursal"}
            </p>
          </div>
          <div className="ml-auto">{getEstadoBadge(registro.estado)}</div>
        </motion.div>

        {/* Información General */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Fecha de Compra</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formattFechaWithMinutes(registro.fecha)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Total</p>
                    <p className="text-sm font-semibold text-green-600">
                      {formattMonedaGT(registro.total)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Items</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {registro.resumen.items}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-purple-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Con Factura</p>
                    <p className="text-sm font-semibold text-purple-600">
                      {registro.conFactura ? "Sí" : "No"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Información de Usuario y Proveedor */}
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Usuario Responsable
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium">Nombre</p>
                  <p className="text-xs text-muted-foreground">
                    {registro.usuario.nombre}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium">Correo</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {registro.usuario.correo}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Proveedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium">Nombre</p>
                  <p className="text-xs text-muted-foreground">
                    {registro.proveedor?.nombre || "Sin proveedor asignado"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium">Sucursal</p>
                  <p className="text-xs text-muted-foreground">
                    {registro.sucursal?.nombre || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Información de Origen */}
        {registro.origen === "REQUISICION" && registro.requisicion && (
          <RequisicionInfo requisicion={registro.requisicion} />
        )}

        {registro.origen === "PEDIDO" && registro.pedido && (
          <PedidoInfo pedido={registro.pedido} />
        )}

        {/* Información de Factura */}
        {registro.conFactura && registro.factura && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Información de Factura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium">Número de Factura</p>
                    <p className="text-xs text-muted-foreground">
                      {registro.factura.numero || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Fecha de Factura</p>
                    <p className="text-xs text-muted-foreground">
                      {formattFechaWithMinutes(registro.factura.fecha)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Resumen de Compra */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Resumen de Compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Package className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {registro.resumen.items}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Productos Únicos
                  </p>
                </div>
                <div className="text-center">
                  <Hash className="h-6 w-6 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {registro.resumen.cantidadTotal}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cantidad Total
                  </p>
                </div>
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(registro.resumen.subtotal)}
                  </p>
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detalles de Productos */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos Comprados ({registro.detalles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                variants={tableVariants}
                className="space-y-3 max-h-96 overflow-y-auto"
              >
                {registro.detalles.map((detalle) => (
                  <motion.div
                    key={detalle.id}
                    variants={rowVariants}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          #{detalle.producto.id}
                        </Badge>
                        <h4 className="text-sm font-medium">
                          {detalle.producto.nombre}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="text-xs flex items-center gap-1"
                        >
                          <Hash className="h-2 w-2" />
                          {detalle.producto.codigo}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formattMonedaGT(detalle.subtotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Subtotal
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold text-blue-600">
                          {detalle.cantidad}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cantidad
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-green-600">
                          {formattMonedaGT(detalle.costoUnitario)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Costo Unit.
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-purple-600">
                          {formattMonedaGT(
                            detalle.producto.precioCostoActual || 0
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Precio Actual
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-orange-600">
                          {formattMonedaGT(detalle.subtotal)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>

                    {detalle.creadoEn && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          Agregado: {formattFechaWithMinutes(detalle.creadoEn)}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Información de Auditoría */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Información de Auditoría
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium">Creado</p>
                  <p className="text-xs text-muted-foreground">
                    {formattFechaWithMinutes(registro.creadoEn)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium">Última Actualización</p>
                  <p className="text-xs text-muted-foreground">
                    {formattFechaWithMinutes(registro.actualizadoEn)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button
            disabled={addedToStock}
            onClick={() => setOpenFormDialog(true)}
          >
            Confirmar recepción y enviar a stock
          </Button>
        </motion.div>
      </div>
      <AdvancedDialog
        type="warning"
        onOpenChange={setOpenSendStock}
        open={openSendStock}
        title="Recepción de productos"
        description="Se añadirá el stock de estos productos en la sucursal donde fueron solicitados."
        question="¿Estás seguro de que deseas continuar? Esta acción no se puede deshacer."
        confirmButton={{
          label: "Sí, confirmar entrada de stock",
          disabled: isSubmiting,
          loading: isSubmiting,
          loadingText: "Añadiendo productos al stock...",
          onClick: sendtToStock,
        }}
        cancelButton={{
          label: "Cancelar",
          disabled: isSubmiting,
          loadingText: "Cancelando...",
          onClick: () => setOpenSendStock(false),
        }}
      />

      <Dialog open={openFormDialog} onOpenChange={setOpenFormDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Preparar envío a stock</DialogTitle>
            <DialogDescription>
              Complete la información necesaria antes de confirmar el envío a
              stock.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                placeholder="Observaciones acerca de la recepción de esta compra"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proveedor">Seleccionar Proveedor</Label>
              <Select
                value={proveedorSelected}
                onValueChange={setProveedorSelected}
              >
                <SelectTrigger id="proveedor">
                  <SelectValue placeholder="Seleccione un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metodPago">Método de pago</Label>
              <Select
                value={metodoPago}
                onValueChange={(v) => setMetodoPago(v as MetodoPago)}
              >
                <SelectTrigger id="metodPago">
                  <SelectValue placeholder="Seleccione un método de pago compra" />
                </SelectTrigger>
                <SelectContent>
                  {METODO_PAGO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!metodoPago && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Requerido para continuar.
                </p>
              )}
            </div>

            {isCashMethod(metodoPago) && (
              <div className="space-y-2">
                <Label>Seleccionar caja (saldo disponible)</Label>
                <ReactSelectComponent
                  options={optionsCajas}
                  onChange={handleSelectCaja}
                  value={
                    cajaSelected
                      ? optionsCajas.find((o) => o.value === cajaSelected) ??
                        null
                      : null
                  }
                  // si tu wrapper lo soporta:
                  // isOptionDisabled={isOptionDisabled}
                  isClearable
                  isSearchable
                  className="text-black"
                  placeholder="Seleccione una caja a asignar"
                />
                {!cajaSelected && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Seleccione una caja para pagos en efectivo.
                  </p>
                )}
                {cajaSelected && !cajaTieneSaldo && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    La caja seleccionada no tiene saldo suficiente para{" "}
                    {formattMonedaGT(montoRecepcion)}.
                  </p>
                )}
                {!cajasDisponibles.some(
                  (c) => Number(c.disponibleEnCaja) >= montoRecepcion
                ) && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Ninguna caja abierta tiene saldo suficiente. Cambie a método
                    bancario o abra un turno.
                  </p>
                )}
              </div>
            )}

            {isBankMethod(metodoPago) && (
              <div className="space-y-2">
                <Label htmlFor="cuentaBancaria">
                  Cuenta Bancaria (requerida por método)
                </Label>
                <Select
                  value={cuentaBancariaSelected}
                  onValueChange={setCuentaBancariaSelected}
                >
                  <SelectTrigger id="cuentaBancaria">
                    <SelectValue placeholder="Seleccione una cuenta bancaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentasBancarias.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!cuentaBancariaSelected && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Requerida para {metodoPago?.toLowerCase()}.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenFormDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setOpenSendStock(true)}
                disabled={!canContinue}
              >
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function RequisicionInfo({
  requisicion,
}: {
  requisicion: CompraRequisicionUI;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Requisición Asociada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Hash className="h-6 w-6 mx-auto text-blue-600 mb-1" />
              <p className="text-sm font-semibold">{requisicion.folio}</p>
              <p className="text-xs text-muted-foreground">Folio</p>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="mb-1">
                {requisicion.estado}
              </Badge>
              <p className="text-xs text-muted-foreground">Estado</p>
            </div>
            <div className="text-center">
              <FileText className="h-6 w-6 mx-auto text-green-600 mb-1" />
              <p className="text-sm font-semibold">{requisicion.totalLineas}</p>
              <p className="text-xs text-muted-foreground">Líneas</p>
            </div>
            <div className="text-center">
              <Calendar className="h-6 w-6 mx-auto text-purple-600 mb-1" />
              <p className="text-sm font-semibold">
                {formattFechaWithMinutes(requisicion.fecha)}
              </p>
              <p className="text-xs text-muted-foreground">Fecha</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PedidoInfo({ pedido }: { pedido: CompraPedidoUI }) {
  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Pedido Asociado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Hash className="h-6 w-6 mx-auto text-blue-600 mb-1" />
              <p className="text-sm font-semibold">{pedido.folio}</p>
              <p className="text-xs text-muted-foreground">Folio</p>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="mb-1">
                {pedido.estado}
              </Badge>
              <p className="text-xs text-muted-foreground">Estado</p>
            </div>
            <div className="text-center">
              <FileText className="h-6 w-6 mx-auto text-green-600 mb-1" />
              <p className="text-sm font-semibold">{pedido.tipo}</p>
              <p className="text-xs text-muted-foreground">Tipo</p>
            </div>
            <div className="text-center">
              <Calendar className="h-6 w-6 mx-auto text-purple-600 mb-1" />
              <p className="text-sm font-semibold">
                {formattFechaWithMinutes(pedido.fecha)}
              </p>
              <p className="text-xs text-muted-foreground">Fecha</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
