"use client";

import type React from "react";

import {
  Box,
  Calendar,
  ChevronDown,
  ChevronUp,
  BadgeIcon as IdCard,
  TextIcon,
  TicketCheck,
  User,
  Package,
  Clock,
  FileText,
  Activity,
  ShoppingCart,
  Hash,
  CheckCircle,
  Search,
  DownloadCloud,
  AlertCircle,
  XCircle,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { EstadoGarantia, GarantiaType } from "../types/newGarantyTypes";
import { formattFecha } from "@/Pages/Utils/Utils";

interface WarrantyCardProps {
  garantia: GarantiaType;
  formatearFecha: (fecha: string) => string;
  estadoColor: Record<EstadoGarantia, string>;
  toggleCard: (id: number) => void;
  expandedCard: number | null;
  setOpenUpdateWarranty: (open: boolean) => void;
  setSelectWarrantyUpdate: (garantia: GarantiaType | null) => void;
  setComentario: (value: string) => void;
  setDescripcionProblema: (value: string) => void;
  setEstado: (value: EstadoGarantia) => void;
  setProductoIdW: (id: number) => void;
  setWarrantyId: (id: number) => void;
  setOpenFinishWarranty: (open: boolean) => void;
  openTimeLine: boolean;
  setOpenTimeLine: React.Dispatch<React.SetStateAction<boolean>>;
}

export function WarrantyCard({
  garantia,
  formatearFecha,
  estadoColor,
  toggleCard,
  expandedCard,
  setOpenUpdateWarranty,
  setSelectWarrantyUpdate,
  setComentario,
  setDescripcionProblema,
  setEstado,
  setProductoIdW,
  setWarrantyId,
  // setOpenFinishWarranty,
  // openTimeLine,
  setOpenTimeLine,
}: WarrantyCardProps) {
  const handleOpenUpdateDialog = (garantia: GarantiaType) => {
    setSelectWarrantyUpdate(garantia);
    setComentario(garantia.comentario);
    setDescripcionProblema(garantia.descripcionProblema);
    setEstado(garantia.estado as EstadoGarantia);
    setOpenUpdateWarranty(true);
  };

  const getEstadoIcon = (estado: EstadoGarantia) => {
    switch (estado) {
      case EstadoGarantia.RECIBIDO:
        return <Package className="w-4 h-4" />;
      case EstadoGarantia.DIAGNOSTICO:
        return <Search className="w-4 h-4" />;
      case EstadoGarantia.EN_REPARACION:
        return <Activity className="w-4 h-4" />;
      case EstadoGarantia.ESPERANDO_PIEZAS:
        return <DownloadCloud className="w-4 h-4" />;
      case EstadoGarantia.REPARADO:
      case EstadoGarantia.REEMPLAZADO:
        return <CheckCircle className="w-4 h-4" />;
      case EstadoGarantia.RECHAZADO_CLIENTE:
        return <AlertCircle className="w-4 h-4" />;
      case EstadoGarantia.CANCELADO:
        return <XCircle className="w-4 h-4" />;
      case EstadoGarantia.CERRADO:
        return <Lock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4 dark:text-white text-white" />;
    }
  };

  return (
    <>
      <Card
        key={garantia.id}
        className="w-full shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4"
        style={{ borderLeftColor: estadoColor[garantia.estado] }}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Hash className="w-5 h-5 text-muted-foreground" />
                Garantía #{garantia.id}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                className={`${
                  estadoColor[garantia.estado]
                } text-white flex items-center gap-1`}
              >
                {getEstadoIcon(garantia.estado)}
                {garantia.estado.replace("_", " ")}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to={`/ticket-garantia/${garantia.id}`}>
                      <Button variant="outline" size="sm">
                        <TicketCheck className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generar ticket de garantía</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCard(garantia.id)}
                className="shrink-0"
              >
                {expandedCard === garantia.id ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Información básica siempre visible */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">
                Cliente: {garantia.cliente.nombre}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">
                Producto: {garantia.producto.nombre}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate">
                Fecha: {formattFecha(garantia.fechaRecepcion)}
              </span>
            </div>
          </div>

          {/* Información expandida */}
          {expandedCard === garantia.id && (
            <div className="space-y-4">
              <Separator />

              {/* Información de venta */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Información de Venta
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    <span>Venta ID: #{garantia?.venta?.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span>
                      Fecha: {formatearFecha(garantia?.venta?.fechaVenta)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-3 h-3 text-muted-foreground" />
                    <span>Cantidad devuelta: {garantia?.cantidadDevuelta}</span>
                  </div>
                </div>
              </div>

              {/* Información del producto */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  Detalles del Producto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <IdCard className="w-3 h-3 text-muted-foreground" />
                    <span>Código: {garantia.producto.codigo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TextIcon className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">
                      Nombre: {garantia.producto.nombre}
                    </span>
                  </div>
                  <div className="col-span-full">
                    <p className="text-muted-foreground">
                      Descripción: {garantia.producto.descripcion}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del proveedor */}
              {garantia.proveedor && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Proveedor
                  </h4>
                  <div className="text-sm">
                    <span>Enviado a: {garantia.proveedor.nombre}</span>
                  </div>
                </div>
              )}

              {/* Comentarios y descripción */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Comentario
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                    {garantia.comentario}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                    <TextIcon className="w-4 h-4" />
                    Descripción del Problema
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                    {garantia.descripcionProblema}
                  </p>
                </div>
              </div>

              {/* Timeline de registros */}
              {garantia.registros && garantia.registros.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Historial de Cambios ({garantia.registros.length})
                  </h4>
                  <ScrollArea className="h-48 w-full border rounded-lg p-3">
                    <div className="space-y-3">
                      {garantia.registros
                        .sort(
                          (a, b) =>
                            new Date(b.fechaRegistro).getTime() -
                            new Date(a.fechaRegistro).getTime()
                        )
                        .map((registro, index) => (
                          <div key={registro.id} className="relative">
                            {index !== garantia.registros.length - 1 && (
                              <div className="absolute left-4 top-8 w-px h-full bg-border" />
                            )}
                            <div className="flex gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  estadoColor[registro.estado]
                                } text-white`}
                              >
                                {getEstadoIcon(registro.estado)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {registro.estado.replace("_", " ")}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatearFecha(registro.fechaRegistro)}
                                  </span>
                                </div>
                                <p className="text-sm font-medium mb-1">
                                  Por: {registro.usuario.nombre}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Acciones:</strong>{" "}
                                  {registro.accionesRealizadas}
                                </p>
                                {registro.conclusion && (
                                  <p className="text-sm text-muted-foreground">
                                    <strong>Conclusión:</strong>{" "}
                                    {registro.conclusion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Información del usuario que recibe */}
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  Recibido por: {garantia.usuarioRecibe.nombre}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Actualizado: {formatearFecha(garantia.actualizadoEn)}
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={() => {
                    setWarrantyId(garantia.id);
                    handleOpenUpdateDialog(garantia);
                    setProductoIdW(garantia.producto.id);
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  Actualizar registro
                </Button>
                <Button
                  onClick={() => {
                    setOpenTimeLine(true);
                    setWarrantyId(garantia.id);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Crear registro de cambios
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
