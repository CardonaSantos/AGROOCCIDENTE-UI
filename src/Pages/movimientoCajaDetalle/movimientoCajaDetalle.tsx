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
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  CreditCard,
  ArrowLeftRight,
  Wallet,
  Copy,
  ExternalLink,
} from "lucide-react";
import type { MovimientoCajaDetail } from "./interface";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { formateDateWithMinutes } from "@/Crm/Utils/FormateDate";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";
import { getMovimientoCajaDetail } from "./api";
import { ReplaceUnderlines } from "@/utils/UtilsII";

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

export default function MovimientoFinancieroDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const movimientoID = Number(id);

  const [movimiento, setMovimiento] = useState<MovimientoCajaDetail | null>(
    null
  );

  const getSetData = async () => {
    const data = await getMovimientoCajaDetail(movimientoID);
    setMovimiento(data);
  };

  const getData = async () => {
    await toast.promise(getSetData(), {
      error: (err) => getApiErrorMessageAxios(err),
    });
  };

  useEffect(() => {
    if (!Number.isFinite(movimientoID) || movimientoID <= 0) {
      toast.error("ID de movimiento inválido");
      navigate(-1);
      return;
    }
    getData();
  }, [movimientoID]);

  const onBack = () => navigate(-1);

  const getMovimientoInfo = (movimiento: MovimientoCajaDetail) => {
    const deltaCaja = movimiento.deltaCaja || 0;
    const deltaBanco = movimiento.deltaBanco || 0;

    // Determinar signo y canal según reglas de negocio
    let sign = 0;
    let canal = "N/A";
    let isTransfer = false;

    if (deltaCaja !== 0) {
      sign = Math.sign(deltaCaja);
      canal = "Caja";
    } else if (deltaCaja === 0 && deltaBanco !== 0) {
      sign = Math.sign(deltaBanco);
      canal = "Banco";
    }

    // Detectar transferencia (Caja→Banco)
    if (deltaCaja < 0 && deltaBanco > 0) {
      isTransfer = true;
      canal = "Caja→Banco";
    }

    // Determinar tipo basado en deltas (prioridad sobre tipo legacy)
    let tipoCalculado = "EGRESO";
    if (isTransfer) {
      tipoCalculado = "TRANSFERENCIA";
    } else if (sign > 0) {
      tipoCalculado = "INGRESO";
    } else if (sign < 0) {
      tipoCalculado = "EGRESO";
    } else {
      // Fallback al tipo legacy si no hay deltas
      tipoCalculado = movimiento.tipo;
      sign = movimiento.tipo === "INGRESO" ? 1 : -1;
    }

    return { sign, canal, isTransfer, tipoCalculado };
  };

  const getTipoBadge = (movimiento: MovimientoCajaDetail) => {
    // const { tipoCalculado, isTransfer } = getMovimientoInfo(movimiento);
    const { tipoCalculado } = getMovimientoInfo(movimiento);

    const variants = {
      INGRESO: {
        variant: "default" as const,
        icon: TrendingUp,
        color: "text-green-600",
      },
      EGRESO: {
        variant: "destructive" as const,
        icon: TrendingDown,
        color: "text-red-600",
      },
      TRANSFERENCIA: {
        variant: "secondary" as const,
        icon: ArrowLeftRight,
        color: "text-blue-600",
      },
    };

    const config =
      variants[tipoCalculado as keyof typeof variants] || variants.EGRESO;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {tipoCalculado}
      </Badge>
    );
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      ABIERTO: {
        variant: "outline" as const,
        icon: AlertCircle,
        color: "text-green-600 ",
      },
      CERRADO: {
        variant: "secondary" as const,
        icon: CheckCircle,
        color: "text-green-600",
      },
      ARQUEO: {
        variant: "outline" as const,
        icon: XCircle,
        color: "text-orange-600",
      },
    };

    const config =
      variants[estado as keyof typeof variants] || variants.ABIERTO;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {estado}
      </Badge>
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado al portapapeles");
    } catch (err) {
      toast.error("Error al copiar");
    }
  };

  const renderChips = (movimiento: MovimientoCajaDetail) => {
    const chips = [];

    if (movimiento.clasificacion) {
      chips.push(
        <Badge key="clasificacion" variant="outline">
          {movimiento.clasificacion}
        </Badge>
      );
    }

    if (movimiento.motivo) {
      chips.push(
        <Badge key="motivo" variant="outline">
          {movimiento.motivo}
        </Badge>
      );
    }

    if (movimiento.metodoPago) {
      chips.push(
        <Badge key="metodoPago" variant="outline">
          {movimiento.metodoPago}
        </Badge>
      );
    }

    if (movimiento.esDepositoCierre) {
      chips.push(
        <Badge key="depositoCierre" variant="secondary">
          Depósito de Cierre
        </Badge>
      );
    }

    if (movimiento.esDepositoProveedor) {
      chips.push(
        <Badge key="depositoProveedor" variant="secondary">
          Depósito a Proveedor
        </Badge>
      );
    }

    if (movimiento.gastoOperativoTipo) {
      chips.push(
        <Badge key="gastoOperativo" variant="outline">
          {movimiento.gastoOperativoTipo}
        </Badge>
      );
    }

    if (movimiento.costoVentaTipo) {
      chips.push(
        <Badge key="costoVenta" variant="outline">
          {movimiento.costoVentaTipo}
        </Badge>
      );
    }

    if (movimiento.afectaInventario) {
      chips.push(
        <Badge key="afectaInventario" variant="secondary">
          Afecta Inventario
        </Badge>
      );
    }

    return chips;
  };

  if (!movimiento) {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Cargando...</h2>
              <p className="text-muted-foreground">
                Obteniendo información del movimiento
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { sign, canal, isTransfer } = getMovimientoInfo(movimiento);
  const montoFormatted = `${
    sign > 0 ? "+" : sign < 0 ? "−" : ""
  }${formattMonedaGT(movimiento.monto)}`;

  console.log("El movimiento financiero es: ", movimiento);

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
              aria-label="Volver"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-semibold">
              Movimiento Financiero #{movimiento.id}
            </h1>
            <p className="text-xs text-muted-foreground">
              {movimiento?.caja?.sucursal?.nombre || "Sin sucursal"}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            {getTipoBadge(movimiento)}
            <Badge variant="outline" className="gap-1">
              <Wallet className="h-3 w-3" />
              {canal}
            </Badge>
          </div>
        </motion.div>

        {/* Chips de clasificación */}
        {renderChips(movimiento).length > 0 && (
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
            {renderChips(movimiento)}
          </motion.div>
        )}

        {/* Información General del Movimiento */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Fecha</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formateDateWithMinutes(movimiento.fecha)}
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
                  <DollarSign
                    className={`h-4 w-4 ${
                      isTransfer
                        ? "text-blue-600"
                        : sign > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Monto</p>
                    <p
                      className={`text-sm font-semibold ${
                        isTransfer
                          ? "text-blue-600"
                          : sign > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {montoFormatted}
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
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Usuario</p>
                    <p
                      className="text-xs text-muted-foreground truncate"
                      title={
                        movimiento.usuario
                          ? `${movimiento.usuario.correo} (${movimiento.usuario.rol})`
                          : undefined
                      }
                    >
                      {movimiento.usuario?.nombre || "N/A"}
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
                  <CheckCircle
                    className={`h-4 w-4 ${
                      movimiento.usadoParaCierre
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Usado para Cierre</p>
                    <p className="text-xs text-muted-foreground">
                      {movimiento.usadoParaCierre ? "Sí" : "No"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detalles del Movimiento */}
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detalles del Movimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium">Categoría (Legacy)</p>
                  <p className="text-xs text-muted-foreground">
                    {movimiento.categoria || "Sin categoría"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium">Descripción</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {movimiento.descripcion || "Sin descripción"}
                  </p>
                </div>
                {movimiento.referencia && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">Referencia</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            copyToClipboard(movimiento.referencia!)
                          }
                          aria-label="Copiar referencia"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {movimiento.referencia}
                      </p>
                    </div>
                  </>
                )}
                {movimiento.proveedor && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium">Proveedor</p>
                      <p className="text-xs text-muted-foreground">
                        {movimiento.proveedor.nombre}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Información Bancaria
                </CardTitle>
              </CardHeader>

              <CardContent>
                {/* 1 col en mobile, 2 cols desde md */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Columna izquierda */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium">Cuenta Bancaria</p>
                      <p className="text-xs text-muted-foreground">
                        {movimiento.cuentaBancaria
                          ? `${movimiento.cuentaBancaria.banco || "N/A"}${
                              movimiento.cuentaBancaria.alias
                                ? ` / ${movimiento.cuentaBancaria.alias}`
                                : ""
                            }`
                          : "N/A"}
                      </p>
                      {movimiento.cuentaBancaria?.numeroMasked && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {movimiento.cuentaBancaria.numeroMasked}
                        </p>
                      )}
                    </div>

                    {movimiento.metodoPago && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-medium">Método de Pago</p>
                          <p className="text-xs text-muted-foreground">
                            {movimiento.metodoPago}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Columna derecha */}
                  <div className="space-y-3">
                    {movimiento.comprobanteFecha && (
                      <>
                        <div>
                          <p className="text-xs font-medium">
                            Comprobante Fecha
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formateDateWithMinutes(
                              movimiento.comprobanteFecha
                            )}
                          </p>
                        </div>
                        <Separator />
                      </>
                    )}

                    {movimiento.comprobanteNumero && (
                      <>
                        <div>
                          <p className="text-xs font-medium">
                            Comprobante Número
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {movimiento.comprobanteNumero}
                          </p>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/** Si prefieres, condiciona por `comprobanteTipo` en lugar de `comprobanteNumero` */}
                    {movimiento.comprobanteTipo && (
                      <div>
                        <p className="text-xs font-medium">
                          Tipo de Comprobante
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ReplaceUnderlines(
                            String(movimiento.comprobanteTipo)
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Información de la Caja Asociada */}
        {movimiento.caja ? (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Caja Asociada #{movimiento.caja.id}
                  </div>
                  <Link to={`/caja/${movimiento.caja.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs bg-transparent"
                      onClick={() => {
                        /* Navegar a ver caja */
                      }}
                      aria-label={`Ver caja ${movimiento.caja!.id}`}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver caja
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Estado</p>
                    {getEstadoBadge(movimiento.caja.estado)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Saldo Inicial</p>
                    <p className="text-xs text-green-600 font-semibold">
                      {formattMonedaGT(movimiento.caja.saldoInicial)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Saldo Final</p>
                    <p className="text-xs text-blue-600 font-semibold">
                      {formattMonedaGT(movimiento.caja.saldoFinal)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Depositado</p>
                    <Badge
                      variant={
                        movimiento.caja.depositado ? "default" : "secondary"
                      }
                    >
                      {movimiento.caja.depositado ? "Sí" : "No"}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium mb-2">Fechas</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">
                          Apertura:
                        </span>
                        <span className="text-xs">
                          {formateDateWithMinutes(
                            movimiento.caja.fechaApertura
                          )}
                        </span>
                      </div>
                      {movimiento.caja.fechaCierre && (
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">
                            Cierre:
                          </span>
                          <span className="text-xs">
                            {formateDateWithMinutes(
                              movimiento.caja.fechaCierre
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium mb-2">Usuarios</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">
                          Apertura:
                        </span>
                        <span className="text-xs">
                          {movimiento.caja.usuarioInicio?.nombre || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">
                          Cierre:
                        </span>
                        <span className="text-xs">
                          {movimiento.caja.usuarioCierre?.nombre || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {(movimiento.caja.comentario ||
                  movimiento.caja.comentarioFinal) && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      {movimiento.caja.comentario && (
                        <div>
                          <p className="text-xs font-medium">
                            Comentario Inicial
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {movimiento.caja.comentario}
                          </p>
                        </div>
                      )}
                      {movimiento.caja.comentarioFinal && (
                        <div>
                          <p className="text-xs font-medium">
                            Comentario Final
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {movimiento.caja.comentarioFinal}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <p className="text-sm">Sin turno asociado</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Timestamps */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Metadatos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium">Creado</p>
                  <p className="text-xs text-muted-foreground">
                    {formateDateWithMinutes(movimiento.creadoEn)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium">Actualizado</p>
                  <p className="text-xs text-muted-foreground">
                    {formateDateWithMinutes(movimiento.actualizadoEn)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
