import React from "react";
import {
  CompraDetalleUI,
  CompraPedidoUI,
  CompraRegistroUI,
  CompraRequisicionUI,
} from "./Interfaces/RegistroCompraInterface";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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

import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formattFechaWithMinutes } from "../Utils/Utils";
import { useNavigate } from "react-router-dom";
import { EstadoCompra } from "./API/interfaceQuery";
import { Badge } from "@/components/ui/badge";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { DetalleNormalizado } from "./table-select-recepcion/detalleNormalizado";
import {
  ItemDetallesPayloadParcial,
  PayloadRecepcionParcial,
} from "./table-select-recepcion/selectedItems";
import { Label } from "@/components/ui/label";
import TableRecepcionCompraSelect from "./table-select-recepcion/table-recepcion-compra-select";
import CardSummary from "./ResumenRecepcionParcial/CardSummary/CardSummary";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { CompraRecepcionableResponse } from "./ResumenRecepcionParcial/Interfaces/detalleRecepcionable";
// Animaciones

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
type RecepcionFlow = "NORMAL" | "PARCIAL";

interface PropsPage {
  registro: CompraRegistroUI | undefined;
  selectedItems: PayloadRecepcionParcial;
  setSelectedItems: React.Dispatch<
    React.SetStateAction<PayloadRecepcionParcial>
  >;
  //   STATES
  isRecibirParcial: boolean;
  setIsRecibirParcial: React.Dispatch<React.SetStateAction<boolean>>;
  isPendingDrp: boolean;
  reFetchDRP: (
    options?: RefetchOptions | undefined
  ) => Promise<QueryObserverResult<CompraRecepcionableResponse, Error>>;

  //HELPERS
  updateCantidadDetalle: (
    compraDetalleId: number,
    nuevaCantidad: number
  ) => void;

  upsserSelectItems: (
    item: ItemDetallesPayloadParcial,
    checked: boolean
  ) => void;

  selectedIds: Set<number>;
  setOpenFormDialog: React.Dispatch<React.SetStateAction<boolean>>;

  openFormDialog: boolean;
  setOpenRecibirParcial: React.Dispatch<React.SetStateAction<boolean>>;
  openRecibirParcial: boolean;

  recepcionable: CompraRecepcionableResponse;
  setOpenFormPaymentDialog: React.Dispatch<React.SetStateAction<boolean>>;
  openFormPaymentDialog: boolean;

  onOpenPaymentFor: (flow: RecepcionFlow) => void;

  updateFechaVencimiento: (
    compraDetalleId: number,
    nuevaFechaVencimiento: string
  ) => void;
}

function ComprasMain({
  registro,
  selectedItems,
  isRecibirParcial,
  setIsRecibirParcial,
  isPendingDrp,
  reFetchDRP,
  updateCantidadDetalle,
  upsserSelectItems,
  selectedIds,
  recepcionable,
  onOpenPaymentFor,
  updateFechaVencimiento,
}: PropsPage) {
  const navigate = useNavigate();

  const onBack = () => navigate(-1);
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

  function normalizarDetalles(
    detalles: CompraDetalleUI[]
  ): DetalleNormalizado[] {
    return detalles.map((d) => {
      const usarPresentacion = d.presentacion != null;

      return {
        id: d.id,
        cantidad: d.cantidad,
        costoUnitario: d.costoUnitario,
        subtotal: d.subtotal,
        creadoEn: d.creadoEn,
        actualizadoEn: d.actualizadoEn,
        producto: {
          id: usarPresentacion ? d.presentacion!.id : d.producto.id!,
          nombre: usarPresentacion ? d.presentacion!.nombre : d.producto.nombre,
          codigo: usarPresentacion
            ? d.presentacion!.codigoBarras
            : d.producto.codigo,
          sku: usarPresentacion ? d.presentacion!.sku : undefined,
          tipo: usarPresentacion ? "PRESENTACION" : "PRODUCTO",
          precioCosto: d.costoUnitario,
        },
      };
    });
  }

  // RETORNO EXPLICITO

  if (!registro) {
    return (
      <div className="">
        <h2>Sin registro</h2>
      </div>
    );
  }
  const addedToStock: boolean = ["RECIBIDO", "RECIBIDO_PARCIAL"].includes(
    registro.estado
  );

  const normalizados = normalizarDetalles(registro.detalles);
  console.log("los datos normalizados para ver son: ", normalizados);
  console.log("el set state es: ", selectedItems);

  const truncarBotonRecepcion: boolean = addedToStock || isRecibirParcial;
  const isCompraCompleted: boolean = registro.estado === "RECIBIDO";
  console.log("El registro es: ", registro);

  return (
    <div className="mx-auto space-y-3">
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
                <p className="text-xs text-muted-foreground">Cantidad Total</p>
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
                      <p className="text-xs text-muted-foreground">Subtotal</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold text-blue-600">
                        {detalle.cantidad}
                      </p>
                      <p className="text-xs text-muted-foreground">Cantidad</p>
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
        <div className="flex items-center space-x-2">
          {isCompraCompleted ? (
            <Label className="text-green-600 font-semibold">
              #Compra completada
            </Label>
          ) : null}

          <Switch
            disabled={isCompraCompleted}
            checked={isRecibirParcial}
            onCheckedChange={(checked) => {
              setIsRecibirParcial(checked);
              if (checked) reFetchDRP();
            }}
            id="recibirParcial"
          />
          <Label htmlFor="recibirParcial">RECIBIR DE FORMA PARCIAL</Label>
        </div>
      </motion.div>

      {isRecibirParcial ? (
        <motion.div
          variants={itemVariants}
          className="mx-auto space-y-3 max-h-80 overflow-y-auto"
        >
          {isPendingDrp ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <TableRecepcionCompraSelect
                updateCantidadDetalle={updateCantidadDetalle}
                selectedIds={selectedIds}
                selectedItems={selectedItems}
                detalles={recepcionable.detalles}
                upsserSelectItems={upsserSelectItems}
                updateFechaVencimiento={updateFechaVencimiento}
              />
            </>
          )}
        </motion.div>
      ) : null}

      {isRecibirParcial ? (
        <motion.div
          variants={itemVariants}
          className="mx-auto space-y-3 max-h-80 overflow-y-auto"
        >
          <CardSummary selectedItems={selectedItems} />
        </motion.div>
      ) : null}

      <motion.div variants={itemVariants} className="flex gap-2">
        <Button
          disabled={truncarBotonRecepcion}
          onClick={() => onOpenPaymentFor("NORMAL")} // 👈 abre PaymentDialog en flujo NORMAL
        >
          Confirmar recepción y enviar a stock
        </Button>
        {isRecibirParcial ? (
          <Button onClick={() => onOpenPaymentFor("PARCIAL")}>
            Recepcionar parcial
          </Button>
        ) : null}
      </motion.div>
    </div>
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

export default ComprasMain;
