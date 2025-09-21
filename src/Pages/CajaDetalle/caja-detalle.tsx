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
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Receipt,
  Clock,
  CheckCircle,
  Banknote,
  Hash,
  ImageIcon,
  Package,
  ArrowUpDown,
  Copy,
  Wallet,
} from "lucide-react";
import { getRegistroCaja } from "./api";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { formateDateWithMinutes } from "@/Crm/Utils/FormateDate";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";
import { formattFechaWithMinutes } from "../Utils/Utils";
import {
  MovimientoCaja,
  RegistroCajaResponse,
  VentaCaja,
} from "../CajaRegistros/interfaces/registroscajas.interfaces";

// =====================
// Animations
// =====================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const tableVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// =====================
// UI helpers
// =====================
const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case "ABIERTO":
      return (
        <Badge variant="secondary" className="text-xs">
          ABIERTO
        </Badge>
      );
    case "CERRADO":
      return (
        <Badge variant="default" className="text-xs">
          CERRADO
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          N/A
        </Badge>
      );
  }
};

const signPrefix = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "");

// =====================
// KPIs (enfocados en saldos/ingresos/egresos)
// =====================
function calcularKPIs(registro: RegistroCajaResponse) {
  const mvs: MovimientoCaja[] = registro.movimientosCaja ?? [];
  const ventas: VentaCaja[] = registro.ventas ?? [];
  const toNum = (v: unknown) => Number(v || 0);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const saldoInicial = toNum(registro.saldoInicial);

  // Identificador de depósito de cierre
  const esDepCierre = (m: MovimientoCaja) =>
    m.esDepositoCierre === true && m.motivo === "DEPOSITO_CIERRE";

  // Caja (efectivo)
  const ingresosCaja = sum(
    mvs.filter((m) => toNum(m.deltaCaja) > 0).map((m) => toNum(m.deltaCaja))
  );
  const egresosCajaSinDep = sum(
    mvs
      .filter((m) => toNum(m.deltaCaja) < 0 && !esDepCierre(m))
      .map((m) => Math.abs(toNum(m.deltaCaja)))
  );
  const depositosCierreCaja = sum(
    mvs.filter(esDepCierre).map((m) => Math.abs(toNum(m.deltaCaja)))
  );
  const deltaCaja = sum(mvs.map((m) => toNum(m.deltaCaja)));
  const enCajaEsperado = saldoInicial + deltaCaja;

  // Banco
  const ingresosBanco = sum(
    mvs.filter((m) => toNum(m.deltaBanco) > 0).map((m) => toNum(m.deltaBanco))
  );
  const egresosBanco = sum(
    mvs
      .filter((m) => toNum(m.deltaBanco) < 0)
      .map((m) => Math.abs(toNum(m.deltaBanco)))
  );
  const deltaBanco = ingresosBanco - egresosBanco;

  // Ventas
  const ventasTotal = sum(ventas.map((v) => toNum(v.totalVenta)));
  const ventasCantidad = ventas.length;
  const ticketPromedio = ventasCantidad ? ventasTotal / ventasCantidad : 0;

  const ventasEfectivoCaja = sum(
    mvs
      .filter((m) => m.motivo === "VENTA" && toNum(m.deltaCaja) > 0)
      .map((m) => toNum(m.deltaCaja))
  );
  const ventasBancoTurno = sum(
    mvs
      .filter((m) => m.motivo === "VENTA" && toNum(m.deltaBanco) > 0)
      .map((m) => toNum(m.deltaBanco))
  );

  // Egresos admin por tipo (desde cualquier canal)
  const gastosOperativos = sum(
    mvs
      .filter((m) => m.clasificacion === "GASTO_OPERATIVO")
      .map((m) => Math.abs(toNum(m.deltaCaja)) + Math.abs(toNum(m.deltaBanco)))
  );
  const costosVenta = sum(
    mvs
      .filter((m) => m.clasificacion === "COSTO_VENTA")
      .map((m) => Math.abs(toNum(m.deltaCaja)) + Math.abs(toNum(m.deltaBanco)))
  );

  const resultadoOperativo = ventasTotal - (gastosOperativos + costosVenta);

  // Diferencia contra conteo final
  const diferencia =
    registro.estado === "CERRADO" && registro.saldoFinal !== null
      ? toNum(registro.saldoFinal) - enCajaEsperado
      : null;

  // Depósitos por cuenta
  const depositosPorCuenta: Array<{ cuenta: string; monto: number }> = [];
  const porCuenta = new Map<string, number>();
  for (const m of mvs.filter(esDepCierre)) {
    const key = m.cuentaBancaria
      ? `${m.cuentaBancaria.banco ?? "Banco"} • ${
          m.cuentaBancaria.alias || m.cuentaBancaria.numeroMasked || "Cuenta"
        }`
      : "N/A";
    porCuenta.set(
      key,
      (porCuenta.get(key) || 0) + Math.abs(toNum(m.deltaBanco))
    );
  }
  porCuenta.forEach((monto, cuenta) =>
    depositosPorCuenta.push({ cuenta, monto })
  );

  return {
    caja: {
      saldoInicial,
      ingresosCaja,
      egresosCajaSinDep,
      depositosCierreCaja,
      deltaCaja,
      enCajaEsperado,
      saldoFinal: registro.saldoFinal ?? null,
      diferencia,
    },
    ventas: {
      total: ventasTotal,
      cantidad: ventasCantidad,
      ticketPromedio,
      efectivoCaja: ventasEfectivoCaja,
      banco: ventasBancoTurno,
    },
    banco: {
      ingresosBanco,
      egresosBanco,
      deltaBanco,
      depositosPorCuenta,
    },
    admin: {
      gastosOperativos,
      costosVenta,
      resultadoOperativo,
    },
  } as const;
}

// =====================
// Movimiento helpers
// =====================
function getMovimientoInfo(movimiento: MovimientoCaja) {
  const deltaCaja = movimiento.deltaCaja ?? 0;
  const deltaBanco = movimiento.deltaBanco ?? 0;

  let canal: "Caja" | "Banco" | "Transferencia" | "N/A" = "N/A";
  let signo = 0;
  let tipoMovimiento: "INGRESO" | "EGRESO" | "TRANSFERENCIA" | "NEUTRO" =
    "NEUTRO";

  if (deltaCaja !== 0) {
    canal = "Caja";
    signo = Math.sign(deltaCaja);
  } else if (deltaCaja === 0 && deltaBanco !== 0) {
    canal = "Banco";
    signo = Math.sign(deltaBanco);
  }

  if (deltaCaja < 0 && deltaBanco > 0) {
    canal = "Transferencia";
    tipoMovimiento = "TRANSFERENCIA";
    signo = 0;
  } else if (signo > 0) {
    tipoMovimiento = "INGRESO";
  } else if (signo < 0) {
    tipoMovimiento = "EGRESO";
  }

  return { canal, signo, tipoMovimiento };
}

function getTipoMovimientoIcon(tipoMovimiento: string) {
  switch (tipoMovimiento) {
    case "INGRESO":
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case "EGRESO":
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    case "TRANSFERENCIA":
      return <ArrowUpDown className="h-4 w-4 text-blue-600" />;
    default:
      return <DollarSign className="h-4 w-4 text-gray-600" />;
  }
}

export default function CajaDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const cajaID = Number(id);

  const [registro, setRegistro] = useState<RegistroCajaResponse | null>(null);
  const onBack = () => navigate(-1);

  useEffect(() => {
    const fetchRegistro = async () => {
      try {
        const response = await getRegistroCaja(cajaID);
        setRegistro(response);
      } catch (error) {
        toast.error(getApiErrorMessageAxios(error));
      }
    };

    if (!Number.isNaN(cajaID)) fetchRegistro();
  }, [cajaID]);

  const kpis = useMemo(
    () => (registro ? calcularKPIs(registro) : null),
    [registro]
  );

  const movimientosSinVentas: MovimientoCaja[] = useMemo(
    () => (registro?.movimientosCaja || []).filter((m) => m.motivo !== "VENTA"),
    [registro]
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  if (!registro || !kpis) {
    return (
      <div className="p-4">
        <h2 className="text-sm text-muted-foreground">Cargando registro…</h2>
      </div>
    );
  }

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
              Registro de Caja #{registro.id}
            </h1>
            <p className="text-xs text-muted-foreground">
              {registro?.sucursal?.nombre}
            </p>
          </div>
          <div className="ml-auto">{getEstadoBadge(registro.estado)}</div>
        </motion.div>

        {/* Resumen del Turno (KPIs clave) */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Resumen del Turno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Saldo Inicial */}
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.caja.saldoInicial)}
                  </p>
                  <p className="text-xs text-muted-foreground">Saldo Inicial</p>
                </div>

                {/* Ingresos Caja */}
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.caja.ingresosCaja)}
                  </p>
                  <p className="text-xs text-muted-foreground">Ingresos Caja</p>
                </div>

                {/* Egresos Caja */}
                <div className="text-center">
                  <TrendingDown className="h-6 w-6 mx-auto text-red-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.caja.egresosCajaSinDep)}
                  </p>
                  <p className="text-xs text-muted-foreground">Egresos Caja</p>
                </div>

                {/* Depósitos Cierre */}
                <div className="text-center">
                  <Banknote className="h-6 w-6 mx-auto text-indigo-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.caja.depositosCierreCaja)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Depósitos de Cierre
                  </p>
                </div>

                {/* En Caja Esperado */}
                <div className="text-center">
                  <Wallet className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.caja.enCajaEsperado)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    En Caja Esperado
                  </p>
                </div>

                {/* Estado de Depósito */}
                <div className="text-center">
                  <Banknote className="h-6 w-6 mx-auto text-teal-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {registro.depositado ? "Sí" : "No"}
                  </p>
                  <p className="text-xs text-muted-foreground">Depositado</p>
                  <Badge
                    variant={registro.depositado ? "default" : "secondary"}
                    className="text-xs mt-1"
                  >
                    {registro.depositado ? "Completado" : "Pendiente"}
                  </Badge>
                </div>
              </div>

              {/* Si está cerrado, mostramos saldo final y diferencia */}
              {registro.estado === "CERRADO" &&
                registro.saldoFinal !== null && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center">
                      <CheckCircle className="h-6 w-6 mx-auto text-orange-600 mb-1" />
                      <p className="text-lg font-semibold">
                        {formattMonedaGT(registro.saldoFinal)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saldo Final
                      </p>
                    </div>

                    <div className="text-center">
                      <ShoppingCart className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p className="text-lg font-semibold">
                        {formattMonedaGT(kpis.ventas.total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ventas Totales
                      </p>
                    </div>

                    <div className="text-center">
                      <Wallet className="h-6 w-6 mx-auto text-slate-600 mb-1" />
                      <p className="text-lg font-semibold">
                        {formattMonedaGT(kpis.admin.resultadoOperativo)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Resultado Operativo
                      </p>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Información General */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={itemVariants}>
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Apertura</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formateDateWithMinutes(registro.fechaApertura)}
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
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Cierre</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {registro.estado === "CERRADO"
                        ? formateDateWithMinutes(registro.fechaCierre)
                        : "En curso"}
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
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Ventas</p>
                    <p className="text-sm font-semibold text-blue-600">
                      {registro.ventas?.length || 0}
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
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Movimientos</p>
                    <p className="text-sm font-semibold text-green-600">
                      {movimientosSinVentas.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Usuarios y Comentarios */}
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" /> Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium">Apertura</p>
                  <p className="text-xs text-muted-foreground">
                    {registro?.usuarioInicio?.nombre || "N/A"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium">Cierre</p>
                  <p className="text-xs text-muted-foreground">
                    {registro?.usuarioCierre?.nombre || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> Comentarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium">Inicial</p>
                  <p className="text-xs text-muted-foreground">
                    {registro.comentarioInicial || "Sin comentarios"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium">Final</p>
                  <p className="text-xs text-muted-foreground">
                    {registro.comentarioFinal || "Sin comentarios"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Ventas (resumen) */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Ventas — resumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <ShoppingCart className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.ventas.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <Wallet className="h-6 w-6 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.ventas.efectivoCaja)}
                  </p>
                  <p className="text-xs text-muted-foreground">En Caja</p>
                </div>
                <div className="text-center">
                  <Banknote className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.ventas.banco)}
                  </p>
                  <p className="text-xs text-muted-foreground">En Banco</p>
                </div>
                <div className="text-center">
                  <Hash className="h-6 w-6 mx-auto text-slate-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {kpis.ventas.cantidad}
                  </p>
                  <p className="text-xs text-muted-foreground"># Tickets</p>
                </div>
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto text-slate-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.ventas.ticketPromedio)}
                  </p>
                  <p className="text-xs text-muted-foreground">Ticket Prom.</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto text-slate-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.admin.resultadoOperativo)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Resultado Operativo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Banco (resumen rápido) */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Banco — flujos del turno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.banco.ingresosBanco)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ingresos Banco
                  </p>
                </div>
                <div className="text-center">
                  <TrendingDown className="h-6 w-6 mx-auto text-red-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.banco.egresosBanco)}
                  </p>
                  <p className="text-xs text-muted-foreground">Egresos Banco</p>
                </div>
                <div className="text-center">
                  <ArrowUpDown className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-semibold">
                    {formattMonedaGT(kpis.banco.deltaBanco)}
                  </p>
                  <p className="text-xs text-muted-foreground">Δ Banco</p>
                </div>
                {kpis.banco.depositosPorCuenta.length > 0 && (
                  <div className="md:col-span-2 lg:col-span-3 text-left">
                    <p className="text-xs font-medium mb-1">
                      Depósitos por cuenta
                    </p>
                    <div className="space-y-1">
                      {kpis.banco.depositosPorCuenta.map((d) => (
                        <div
                          key={d.cuenta}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="truncate mr-2">{d.cuenta}</span>
                          <span className="font-semibold">
                            {formattMonedaGT(d.monto)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Movimientos (excluye ventas) */}
        {movimientosSinVentas.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Movimientos (
                  {movimientosSinVentas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={tableVariants}
                  className="space-y-3 max-h-96 overflow-y-auto"
                >
                  {movimientosSinVentas.map((movimiento) => {
                    const { canal, signo, tipoMovimiento } =
                      getMovimientoInfo(movimiento);

                    return (
                      <motion.div
                        key={movimiento.id}
                        variants={rowVariants}
                        className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getTipoMovimientoIcon(tipoMovimiento)}
                              <Badge
                                variant={
                                  tipoMovimiento === "INGRESO"
                                    ? "default"
                                    : tipoMovimiento === "EGRESO"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {tipoMovimiento}
                              </Badge>
                            </div>

                            <Badge variant="outline" className="text-xs">
                              {canal}
                            </Badge>

                            <span className="text-xs text-muted-foreground">
                              {formattFechaWithMinutes(movimiento.fecha)}
                            </span>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold ${
                                tipoMovimiento === "INGRESO"
                                  ? "text-green-600"
                                  : tipoMovimiento === "EGRESO"
                                  ? "text-red-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {tipoMovimiento === "TRANSFERENCIA"
                                ? ""
                                : signPrefix(signo)}
                              {formattMonedaGT(movimiento.monto)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs">
                            <span className="font-medium">Descripción:</span>{" "}
                            {movimiento.descripcion || "—"}
                          </p>

                          {movimiento.categoria && (
                            <div>
                              <Badge variant="secondary" className="text-xs">
                                {movimiento.categoria}{" "}
                              </Badge>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {movimiento.clasificacion && (
                              <Badge variant="outline" className="text-xs">
                                {movimiento.clasificacion}
                              </Badge>
                            )}

                            {movimiento.motivo && (
                              <Badge variant="outline" className="text-xs">
                                {movimiento.motivo}
                              </Badge>
                            )}

                            {movimiento.metodoPago && (
                              <Badge variant="outline" className="text-xs">
                                {movimiento.metodoPago}
                              </Badge>
                            )}

                            {movimiento.esDepositoCierre && (
                              <Badge
                                variant="default"
                                className="text-xs bg-blue-600"
                              >
                                Depósito de Cierre
                              </Badge>
                            )}

                            {movimiento.esDepositoProveedor && (
                              <Badge
                                variant="default"
                                className="text-xs bg-purple-600"
                              >
                                Depósito a Proveedor
                              </Badge>
                            )}

                            {movimiento.gastoOperativoTipo && (
                              <Badge variant="outline" className="text-xs">
                                {movimiento.gastoOperativoTipo}
                              </Badge>
                            )}

                            {movimiento.costoVentaTipo && (
                              <Badge variant="outline" className="text-xs">
                                {movimiento.costoVentaTipo}
                              </Badge>
                            )}

                            {movimiento.afectaInventario && (
                              <Badge variant="secondary" className="text-xs">
                                Afecta Inventario
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Usuario:</span>{" "}
                              {movimiento.usuario?.nombre || "N/A"}
                            </div>

                            <div>
                              <span className="font-medium">Proveedor:</span>{" "}
                              {movimiento.proveedor?.nombre || "N/A"}
                            </div>

                            <div>
                              <span className="font-medium">
                                Cuenta Bancaria:
                              </span>{" "}
                              {movimiento.cuentaBancaria ? (
                                <span>
                                  {movimiento.cuentaBancaria.banco || "N/A"} -{" "}
                                  {movimiento.cuentaBancaria.alias || "N/A"} (
                                  {movimiento.cuentaBancaria.numeroMasked ||
                                    "N/A"}
                                  )
                                </span>
                              ) : (
                                "N/A"
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Boleta:</span>{" "}
                              {movimiento.numeroBoleta || "—"}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-medium">Referencia:</span>
                              <span>{movimiento.referencia || "—"}</span>
                              {movimiento.referencia && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0"
                                  onClick={() =>
                                    copyToClipboard(movimiento.referencia!)
                                  }
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Sección de Ventas (detalle) */}
        {registro.ventas?.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> Ventas (
                  {registro.ventas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={tableVariants}
                  className="space-y-3 max-h-96 overflow-y-auto"
                >
                  {registro.ventas.map((venta) => (
                    <motion.div
                      key={venta.id}
                      variants={rowVariants}
                      className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            #{venta.id}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formattFechaWithMinutes(venta.fechaVenta)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {venta.metodoPago || "N/A"}
                          </Badge>
                          {venta.tipoComprobante && (
                            <Badge variant="outline" className="text-xs">
                              {venta.tipoComprobante}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formattMonedaGT(venta.totalVenta)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cliente:{" "}
                            {typeof venta.cliente === "string"
                              ? venta.cliente
                              : venta.cliente.nombre}
                          </p>
                        </div>
                      </div>

                      {venta.referenciaPago &&
                        venta.referenciaPago !== "N/A" && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground">
                              Referencia:{" "}
                              <span className="font-medium">
                                {venta.referenciaPago}
                              </span>
                            </p>
                          </div>
                        )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">
                            Productos ({venta.productos.length})
                          </span>
                        </div>

                        <div className="grid gap-2">
                          {venta.productos.map((linea) => (
                            <div
                              key={linea.id}
                              className="flex items-center gap-3 p-2 bg-muted/20 rounded border"
                            >
                              <div className="flex-shrink-0">
                                {linea.producto.imagenesProducto.length > 0 ? (
                                  <img
                                    src={
                                      linea.producto.imagenesProducto[0].url ||
                                      "/placeholder.svg"
                                    }
                                    alt={linea.producto.nombre}
                                    className="w-8 h-8 object-cover rounded border"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-xs font-medium truncate">
                                    {linea.producto.nombre}
                                  </p>
                                  {linea.producto.codigoProducto && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs flex items-center gap-1"
                                    >
                                      <Hash className="h-2 w-2" />
                                      {linea.producto.codigoProducto}
                                    </Badge>
                                  )}
                                </div>
                                {linea.producto.descripcion && (
                                  <p className="text-xs text-muted-foreground truncate max-w-96">
                                    {linea.producto.descripcion}
                                  </p>
                                )}
                                {linea.estado && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs mt-1"
                                  >
                                    {linea.estado}
                                  </Badge>
                                )}
                              </div>

                              <div className="text-right flex-shrink-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="default" className="text-xs">
                                    {linea.cantidad}x
                                  </Badge>
                                  <span className="text-xs font-medium">
                                    {formattMonedaGT(linea.precioVenta)}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold">
                                  {formattMonedaGT(
                                    linea.cantidad * linea.precioVenta
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
