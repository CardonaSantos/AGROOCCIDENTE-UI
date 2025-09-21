"use client";

import { useState } from "react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  AlertPaymentResult,
  CreditoRegistro,
  Cuotas,
} from "../types/dashboard";
import { PaymentForm } from "./payment-form";
import { Link } from "react-router-dom";

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale("es");

interface VentaCuotaCardProps {
  ventaCuota: CreditoRegistro;
  formatearMoneda: (monto: number) => string;
  formatearFechaSimple: (fecha: string) => string;
  getCredits: () => Promise<void>;
}

export function VentaCuotaCard({
  ventaCuota,
  formatearMoneda,
  formatearFechaSimple,
  getCredits,
}: VentaCuotaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [cuotaPayment, setCuotaPayment] = useState<Cuotas>();
  const [openPaymentCuota, setOpenPaymentCuota] = useState(false);

  const calcularDetallesCredito = () => {
    const montoTotalConInteres = ventaCuota.montoTotalConInteres;
    const saldoRestante = montoTotalConInteres - ventaCuota.totalPagado;
    const montoPorCuota =
      (montoTotalConInteres - ventaCuota.cuotaInicial) /
      ventaCuota.cuotasTotales;
    const cuotasPagadas = ventaCuota.cuotas.length;
    const cuotasRestantes =
      ventaCuota.cuotasTotales - cuotasPagadas > 0
        ? ventaCuota.cuotasTotales - cuotasPagadas
        : 0;
    const fechaProximoPago = dayjs(ventaCuota.fechaInicio)
      .add(cuotasPagadas * ventaCuota.diasEntrePagos, "day")
      .format("D [de] MMMM [de] YYYY");
    return {
      saldoRestante,
      montoPorCuota,
      cuotasPagadas,
      cuotasRestantes,
      fechaProximoPago,
    };
  };

  const { saldoRestante, montoPorCuota } = calcularDetallesCredito();

  const alertPayment = (fecha?: string): AlertPaymentResult => {
    if (!fecha || !dayjs(fecha).isValid()) {
      return {
        message: "Fecha inválida",
        type: "error",
        className: "text-red-500",
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      };
    }
    const today = dayjs().startOf("day");
    const fechaPago = dayjs(fecha).startOf("day");
    const diferencia = today.diff(fechaPago, "day");

    if (diferencia > 0) {
      return {
        message: "Pago vencido",
        type: "danger",
        className: "text-red-600",
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
      };
    }
    if (diferencia === 0) {
      return {
        message: "Pago vence hoy",
        type: "warning",
        className: "text-yellow-500",
        icon: <CalendarClock className="h-4 w-4 text-yellow-500" />,
      };
    }
    if (diferencia === -10) {
      return {
        message: "Pago en 10 días",
        type: "info",
        className: "text-blue-500",
        icon: <Clock className="h-4 w-4 text-blue-500" />,
      };
    }
    if (diferencia === -15) {
      return {
        message: "Pago en 15 días",
        type: "info",
        className: "text-blue-400",
        icon: <CalendarDays className="h-4 w-4 text-blue-400" />,
      };
    }
    if (diferencia === -7) {
      return {
        message: "Pago en 1 semana",
        type: "info",
        className: "text-indigo-500",
        icon: <Clock className="h-4 w-4 text-indigo-500" />,
      };
    }
    return {
      message: `Faltan ${Math.abs(diferencia)} días`,
      type: "default",
      className: "text-gray-500",
      icon: <CalendarDays className="h-4 w-4 text-gray-500" />,
    };
  };

  return (
    <Card className="w-full max-w-xl shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          <span className="font-bold">Crédito #{ventaCuota.id}</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse details" : "Expand details"}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold text-green-600">
          Saldo Restante:{" "}
          {saldoRestante > 0
            ? formatearMoneda(saldoRestante)
            : saldoRestante === 0
            ? "Completamente pagado"
            : `Extra por interés: ${formatearMoneda(Math.abs(saldoRestante))}`}
        </div>
        <p className="text-sm">
          Cliente: <strong>{ventaCuota.cliente.nombre}</strong>
        </p>
        <p className="text-sm">
          Monto por Cuota: <strong>{formatearMoneda(montoPorCuota)}</strong>
        </p>
        <Link to={"/creditos"}>
          <p className="text-sm">
            Cuotas Pagadas:{" "}
            <strong>
              {
                ventaCuota.cuotas.filter(
                  (cuota) => cuota.fechaPago && cuota.monto > 0
                ).length
              }
            </strong>{" "}
            / {ventaCuota.cuotasTotales}
          </p>
        </Link>
        <Badge className="mt-2">{ventaCuota.estado}</Badge>
        {isExpanded && (
          <div className="mt-4 space-y-2">
            <p className="text-sm">
              Monto Total (con Interés):{" "}
              {formatearMoneda(ventaCuota.montoTotalConInteres)}
            </p>
            <p className="text-sm">
              Cuota Inicial: {formatearMoneda(ventaCuota.cuotaInicial)}
            </p>
            <p className="text-sm">
              Fecha Inicio:{" "}
              {new Date(ventaCuota.fechaInicio).toLocaleDateString()}
            </p>
            <ScrollArea className="h-40 p-2">
              <Card className="border border-gray-200 rounded-lg shadow-sm">
                <CardContent className="p-3 space-y-2">
                  {ventaCuota.cuotas
                    .sort(
                      (a, b) =>
                        new Date(a.creadoEn).getTime() -
                        new Date(b.creadoEn).getTime()
                    )
                    .map((cuota, index) => {
                      if (cuota.monto > 0) {
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border-b last:border-none dark:text-white"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-700 dark:text-white hover:cursor-pointer text-sm">
                                Pago No. {index + 1}
                              </span>
                              <span className="text-gray-700 dark:text-white hover:cursor-pointer text-sm">
                                |
                              </span>
                              <Link to={`/cuota/comprobante/${cuota.id}`}>
                                <span className="text-gray-700 dark:text-white hover:cursor-pointer text-sm">
                                  Pagado el día{" "}
                                  {formatearFechaSimple(cuota.fechaPago)}
                                </span>
                              </Link>
                              <span className="text-gray-700 dark:text-white hover:cursor-pointer text-sm">
                                ({formatearMoneda(cuota.monto)})
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        const alerta = alertPayment(cuota.fechaVencimiento);
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border-b last:border-none text-sm dark:text-white"
                          >
                            <div className="flex items-center space-x-3">
                              {alerta.icon}
                              <span className="font-medium dark:text-white">
                                {index + 1}.
                              </span>
                              <span
                                className="text-gray-700 dark:text-white hover:cursor-pointer"
                                onClick={() => {
                                  setOpenPaymentCuota(true);
                                  setCuotaPayment(cuota);
                                }}
                              >
                                {formatearFechaSimple(cuota.fechaVencimiento)}
                              </span>
                            </div>
                            <span
                              className={`text-sm font-medium ${alerta.className} dark:text-white`}
                            >
                              {alerta.message}
                            </span>
                          </div>
                        );
                      }
                    })}
                </CardContent>
              </Card>
            </ScrollArea>
          </div>
        )}
        <Dialog onOpenChange={setOpenPaymentCuota} open={openPaymentCuota}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">
                Registrar Pago de Cuota{" "}
                {formatearFechaSimple(cuotaPayment?.fechaVencimiento ?? "")}
              </DialogTitle>
            </DialogHeader>
            <PaymentForm
              setOpenPaymentCuota={setOpenPaymentCuota}
              cuota={cuotaPayment}
              CreditoID={ventaCuota.id}
              getCredits={getCredits}
              montoPorCuota={montoPorCuota}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
