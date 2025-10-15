// MapCreditoCompraMain.tsx
"use client";

import { UICreditoCompra } from "./interfaces/interfaces";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  AlarmClock,
  AlertCircle,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Percent as PercentIcon,
  RefreshCw,
  TimerReset,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import MapCuotasCreditoCompra from "./mapCuotas";
import { CajaConSaldo } from "@/utils/components/SelectMethodPayment/PurchasePaymentFormDialog";
import { DesvanecerHaciaArriba } from "@/Pages/movimientos-cajas/utils/animations";
import { DetalleNormalizado } from "../../table-select-recepcion/detalleNormalizado";

dayjs.locale("es");

interface CreditoAvaliableProps {
  creditoFromCompra: UICreditoCompra | undefined;
  handleRefresAll: () => void;
  userId: number;
  documentoId: number;
  sucursalId: number;
  cajasDisponibles: CajaConSaldo[];

  cuentasBancarias: Array<{ id: number; nombre: string }>;
  proveedores: Array<{ id: number; nombre: string }>;
  normalizados: DetalleNormalizado[];
  compraId: number;
}

// ————— helpers —————
const formatMoney = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "GTQ",
      }).format(n)
    : "—";

const EstadoBadge = ({ estado }: { estado: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    PENDIENTE: {
      label: "Pendiente",
      className: "bg-amber-100 text-amber-800 border-amber-200",
    },
    PARCIAL: {
      label: "Parcial",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    PAGADO: {
      label: "Pagado",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    ANULADO: {
      label: "Anulado",
      className: "bg-rose-100 text-rose-800 border-rose-200",
    },
  };
  const v = map[estado] ?? {
    label: estado,
    className: "bg-muted text-foreground/80 border-border",
  };
  return (
    <Badge className={`rounded-full px-2.5 py-0.5 border ${v.className}`}>
      {v.label}
    </Badge>
  );
};

const Stat = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="flex items-start gap-3 rounded-2xl border p-3 md:p-4">
    <div className="mt-0.5">
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base md:text-lg font-medium">{value}</div>
      {hint ? (
        <div className="text-[11px] text-muted-foreground/80">{hint}</div>
      ) : null}
    </div>
  </div>
);

// ————— component —————
function MapCreditoCompraMain({
  creditoFromCompra,
  userId,
  handleRefresAll,
  documentoId,
  sucursalId,
  cajasDisponibles,
  cuentasBancarias,
  proveedores,
  normalizados,
  compraId,
}: CreditoAvaliableProps) {
  if (!creditoFromCompra) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No hay registro de crédito válido</AlertDescription>
      </Alert>
    );
  }

  const {
    folioProveedor,
    estado,
    fechaEmisionISO,
    fechaVencimientoISO,
    condicionPago,
    totalCuotas,
    cuotasPagadas,
    cuotasPendientes,
    totalPagado,
    saldoPendiente,
    montoOriginal,
    interesTotal,
  } = creditoFromCompra;

  const porcentajePagado =
    montoOriginal > 0
      ? Math.round(((totalPagado ?? 0) / montoOriginal) * 100)
      : 0;

  return (
    <motion.div {...DesvanecerHaciaArriba}>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <FileText className="h-5 w-5" />
              Registro de crédito por compra
              <EstadoBadge estado={estado} />
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Emisión: {dayjs(fechaEmisionISO).format("DD MMM YYYY")}
              </span>
              {fechaVencimientoISO ? (
                <span className="inline-flex items-center gap-1.5">
                  <AlarmClock className="h-4 w-4" />
                  Vence: {dayjs(fechaVencimientoISO).format("DD MMM YYYY")}
                </span>
              ) : null}
              {folioProveedor ? (
                <span className="inline-flex items-center gap-1.5">
                  <TimerReset className="h-4 w-4" />
                  Folio: {folioProveedor}
                </span>
              ) : null}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {condicionPago?.nombre ? (
              <Badge variant="outline" className="rounded-full">
                {condicionPago.nombre}
              </Badge>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresAll}
              className="gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* resumen compacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Stat
              icon={CircleDollarSign}
              label="Monto original"
              value={formatMoney(montoOriginal)}
              hint={`Interés total: ${formatMoney(interesTotal)}`}
            />
            <Stat
              icon={Banknote}
              label="Total pagado"
              value={formatMoney(totalPagado)}
              hint={`${porcentajePagado}% pagado`}
            />
            <Stat
              icon={AlertCircle}
              label="Saldo pendiente"
              value={formatMoney(saldoPendiente)}
            />
            <Stat
              icon={PercentIcon}
              label="Cuotas"
              value={`${cuotasPagadas}/${totalCuotas} pagadas`}
              hint={`${cuotasPendientes} pendientes`}
            />
          </div>

          {/* chips de condición */}
          {condicionPago ? (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="rounded-full">
                  Modo: {condicionPago.modoGeneracion ?? "—"}
                </Badge>
                <Badge variant="secondary" className="rounded-full">
                  Interés: {condicionPago.tipoInteres ?? "—"}
                </Badge>
                <Badge variant="secondary" className="rounded-full">
                  %: {condicionPago.interes ?? 0}
                </Badge>
                <Badge variant="secondary" className="rounded-full">
                  Días crédito: {condicionPago.diasCredito ?? 0}
                </Badge>
                <Badge variant="secondary" className="rounded-full">
                  Cada: {condicionPago.diasEntreCuotas ?? 0} días
                </Badge>
                <Badge variant="secondary" className="rounded-full">
                  # Cuotas: {condicionPago.cantidadCuotas ?? totalCuotas}
                </Badge>
              </div>
            </>
          ) : null}

          <Separator className="my-2" />

          {/* detalle de cuotas */}
          <MapCuotasCreditoCompra
            normalizados={normalizados}
            cuentasBancarias={cuentasBancarias}
            proveedores={proveedores}
            cajasDisponibles={cajasDisponibles}
            sucursalId={sucursalId}
            documentoId={documentoId}
            userId={userId}
            handleRefresAll={handleRefresAll}
            cuotas={creditoFromCompra.cuotas} // ver fix #3
            compraId={compraId} // ✅ pásalo aquí también
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default MapCreditoCompraMain;
