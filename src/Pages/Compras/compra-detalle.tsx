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
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { formattMonedaGT } from "@/utils/formattMoneda";
import { formattFechaWithMinutes } from "../Utils/Utils";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
  CompraPedidoUI,
  CompraRegistroUI,
} from "./Interfaces/RegistroCompraInterface";
import { CompraRequisicionUI } from "./Interfaces/Interfaces1";
import { EstadoCompra } from "./API/interfaceQuery";

// ⬇️ hooks genéricos (React Query + Axios client base)
import { useQueryClient } from "@tanstack/react-query";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";

interface Option {
  label: string;
  value: string;
}

// Animaciones
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};
const tableVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, staggerChildren: 0.05 },
  },
};
const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

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
  fechaApertura: string;
  estado: string;
  actualizadoEn: string;
  saldoInicial: number;
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
  const compraId = Number.isFinite(Number(id)) ? Number(id) : 0;

  // === Dialog/UI states ===
  const [openSendStock, setOpenSendStock] = useState(false);
  const [openFormDialog, setOpenFormDialog] = useState(false);

  const [observaciones, setObservaciones] = useState<string>("");
  const [proveedorSelected, setProveedorSelected] = useState<
    string | undefined
  >(undefined);

  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("");
  const [cuentaBancariaSelected, setCuentaBancariaSelected] =
    useState<string>("");
  const [cajaSelected, setCajaSelected] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // === QUERIES ===============================================================

  // 1) Registro de compra (detalle)
  const registroQ = useApiQuery<CompraRegistroUI>(
    ["compra", compraId],
    `/compra-requisicion/get-registro/${compraId}`,
    undefined,
    {
      enabled: Number.isFinite(compraId) && compraId > 0,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // onError: () => toast.error("Error al cargar el registro de compra"),
    }
  );

  // 2) Proveedores
  const proveedoresQ = useApiQuery<Array<{ id: number; nombre: string }>>(
    ["proveedores"],
    "/proveedor",
    undefined,
    {
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      // onError: () => toast.error("Error al cargar proveedores"),
    }
  );

  // 3) Cuentas bancarias (select simple)
  const cuentasQ = useApiQuery<Array<{ id: number; nombre: string }>>(
    ["cuentas-bancarias", "simple-select"],
    "cuentas-bancarias/get-simple-select",
    undefined,
    {
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      // onError: () => toast.error("Error al cargar cuentas bancarias"),
    }
  );

  console.log("Las cuentas bancarias son:_ ", cuentasQ);

  // 4) Cajas abiertas por sucursal
  const cajasQ = useApiQuery<CajaConSaldo[]>(
    ["cajas-disponibles", sucursalId],
    `/caja/cajas-disponibles/${sucursalId}`,
    undefined,
    {
      enabled: !!sucursalId,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // onError: () => toast.error("Error al cargar cajas disponibles"),
    }
  );

  // === MUTATION: recepcionar compra =========================================
  const recepcionarM = useApiMutation<
    any, // respuesta del server
    {
      compraId: number;
      usuarioId: number;
      proveedorId: number;
      observaciones?: string;
      metodoPago: string;
      cuentaBancariaId?: number;
      registroCajaId?: number;
    }
  >("post", `/compra-requisicion/${compraId}/recepcionar`, undefined, {
    onSuccess: async () => {
      // Refrescar detalle + (opcional) listados relacionados
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["compra", compraId] }),
        queryClient.invalidateQueries({ queryKey: ["compras"] }), // comodín por si hay listados cacheados
      ]);
    },
  });

  // === DERIVED ===============================================================
  const registro = registroQ.data ?? null;
  const proveedores = proveedoresQ.data ?? [];
  const cuentasBancarias = cuentasQ.data ?? [];
  const cajasDisponibles = cajasQ.data ?? [];

  const montoRecepcion = useMemo(
    () => Number(registro?.resumen?.subtotal ?? registro?.total ?? 0),
    [registro]
  );

  // Autoresolver de cuenta/caja según método
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

  // Set default proveedor desde el registro
  useEffect(() => {
    const idProv = registro?.proveedor?.id;
    setProveedorSelected(idProv ? String(idProv) : undefined);
  }, [registro?.proveedor?.id]);

  // === Handlers ==============================================================
  const onBack = () => navigate(-1);

  const handleSelectCaja = (option: Option | null) => {
    setCajaSelected(option ? option.value : null);
  };

  const sendtToStock = useCallback(async () => {
    if (!registro || recepcionarM.isPending) return;

    const usuarioId = registro.usuario.id ?? 1;

    if (!proveedorSelected) {
      toast.error("Seleccione un proveedor");
      return;
    }
    if (!metodoPago) {
      toast.error("Seleccione un método de pago");
      return;
    }
    if (isBankMethod(metodoPago) && !cuentaBancariaSelected) {
      toast.error("Seleccione una cuenta bancaria para este método");
      return;
    }
    if (isCashMethod(metodoPago)) {
      if (!cajaSelected) {
        toast.error("Seleccione una caja con saldo suficiente.");
        return;
      }
      const cajaSel = cajasDisponibles.find(
        (c) => String(c.id) === String(cajaSelected)
      );
      if (!cajaSel || Number(cajaSel.disponibleEnCaja) < montoRecepcion) {
        toast.error("La caja seleccionada no tiene saldo suficiente.");
        return;
      }
    }

    const payload: {
      compraId: number;
      usuarioId: number;
      proveedorId: number;
      observaciones?: string;
      metodoPago: string;
      cuentaBancariaId?: number;
      registroCajaId?: number;
    } = {
      compraId,
      usuarioId,
      proveedorId: Number(proveedorSelected),
      observaciones,
      metodoPago,
    };

    if (isBankMethod(metodoPago)) {
      payload.cuentaBancariaId = parseInt(cuentaBancariaSelected);
    }
    if (isCashMethod(metodoPago) && cajaSelected) {
      payload.registroCajaId = parseInt(cajaSelected);
    }

    await toast.promise(recepcionarM.mutateAsync(payload), {
      loading: "Recepcionando compra...",
      success: "Compra recepcionada y enviada a stock",
      error: (error) => getApiErrorMessageAxios(error),
    });

    setOpenSendStock(false);
    setOpenFormDialog(false);
    setObservaciones("");
  }, [
    registro,
    recepcionarM,
    compraId,
    proveedorSelected,
    observaciones,
    metodoPago,
    cuentaBancariaSelected,
    cajaSelected,
    cajasDisponibles,
    montoRecepcion,
  ]);

  // === UI Utils ==============================================================
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

  // === Loading / Error screens ==============================================
  const loadingHard = registroQ.isPending; // primera carga del registro
  const errorHard = registroQ.isError && !registro;

  if (loadingHard) {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Cargando registro de compra...
          </p>
        </div>
      </div>
    );
  }

  if (errorHard) {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p className="text-sm text-muted-foreground">
            {(registroQ.error as Error)?.message || "Registro no encontrado"}
          </p>
          <Button
            variant="outline"
            onClick={onBack}
            className="mt-4 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  if (!registro) return null;

  // === Derived values (ya con datos) ========================================
  const addedToStock: boolean = ["RECIBIDO", "RECIBIDO_PARCIAL"].includes(
    registro.estado
  );

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

  // === RENDER ================================================================
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
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

        {/* Info General */}
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

        {/* Usuario / Proveedor */}
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

        {/* Origen */}
        {registro.origen === "REQUISICION" && registro.requisicion && (
          <RequisicionInfo requisicion={registro.requisicion} />
        )}
        {registro.origen === "PEDIDO" && registro.pedido && (
          <PedidoInfo pedido={registro.pedido} />
        )}

        {/* Factura */}
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

        {/* Resumen */}
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

        {/* Detalles */}
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

                        {/* Si tus types ya incluyen 'presentacion', puedes mostrarla */}
                        {/* {detalle.presentacion && (
                          <Badge variant="secondary" className="text-[11px]">
                            {detalle.presentacion.nombre}
                            {detalle.presentacion.sku ? ` · ${detalle.presentacion.sku}` : ""}
                          </Badge>
                        )} */}

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

        {/* Auditoría */}
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

      {/* Confirmación (segunda pantalla) */}
      <AdvancedDialog
        type="warning"
        onOpenChange={setOpenSendStock}
        open={openSendStock}
        title="Recepción de productos"
        description="Se añadirá el stock de estos productos en la sucursal donde fueron solicitados."
        question="¿Estás seguro de que deseas continuar? Esta acción no se puede deshacer."
        confirmButton={{
          label: "Sí, confirmar entrada de stock",
          disabled: recepcionarM.isPending,
          loading: recepcionarM.isPending,
          loadingText: "Añadiendo productos al stock...",
          onClick: sendtToStock,
        }}
        cancelButton={{
          label: "Cancelar",
          disabled: recepcionarM.isPending,
          loadingText: "Cancelando...",
          onClick: () => setOpenSendStock(false),
        }}
      />

      {/* Form previo a confirmar */}
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
                  {(proveedores ?? []).map((p) => (
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

            {/* Caja */}
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

            {/* Banco */}
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
                    {(cuentasBancarias ?? []).map((c) => (
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
