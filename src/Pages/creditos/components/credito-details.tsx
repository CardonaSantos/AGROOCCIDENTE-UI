// ============================================================================
// File: src/Pages/Creditos/CreditoDetails.tsx
// Descripción: Vista de detalles de un crédito (dark-mode friendly) + flujo de pago
//  - Texto con tokens de shadcn (foreground/muted-foreground) para buen contraste
//  - Pago por CUOTA mediante botón "Registrar pago" en cada fila (una a la vez)
//  - Dialog compacto y responsivo; confirmación final por AdvancedDialog
// ============================================================================

"use client";

import * as React from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Wallet,
  Store,
  User2,
  ReceiptText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
} from "lucide-react";

// UI (shadcn/ui)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Infra
import { PageHeader } from "@/utils/components/PageHeaderPos";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";

// Tipos
import type {
  NormalizedCredito,
  NormCuota,
} from "../interfaces/CreditoResponse";
import type { CajaConSaldo } from "@/utils/components/SelectMethodPayment/PurchasePaymentFormDialog";
import PurchasePaymentFormDialog from "@/utils/components/SelectMethodPayment/PurchasePaymentFormDialog";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import DeleteAbonoButton from "./delete-abono-button";
import { formattMonedaGT } from "@/utils/formattMoneda";

// ============================================================================
// Helpers
// ============================================================================
const Q = (n: number | string | null | undefined) =>
  `Q${Number(n ?? 0).toLocaleString("es-GT", { maximumFractionDigits: 2 })}`;
const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("es-GT", { dateStyle: "medium" }) : "—";
const fdt = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("es-GT", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const estadoTone: Record<NormalizedCredito["estado"], string> = {
  ACTIVA: "bg-emerald-500/15 text-emerald-500",
  COMPLETADA: "bg-blue-500/15 text-blue-500",
  CANCELADA: "bg-rose-500/15 text-rose-500",
  EN_MORA: "bg-amber-500/15 text-amber-600",
  REPROGRAMADA: "bg-violet-500/15 text-violet-500",
  PAUSADA: "bg-slate-500/15 text-slate-500",
};

const estadoIcon: Record<NormalizedCredito["estado"], React.ReactNode> = {
  ACTIVA: <CheckCircle2 className="h-4 w-4" />,
  COMPLETADA: <ReceiptText className="h-4 w-4" />,
  CANCELADA: <XCircle className="h-4 w-4" />,
  EN_MORA: <AlertTriangle className="h-4 w-4" />,
  REPROGRAMADA: <Clock className="h-4 w-4" />,
  PAUSADA: <Clock className="h-4 w-4" />,
};

// Front-end DTOs (alineados a tu backend)
export type CreateAbonoCuotaDTO = {
  cuotaId: number;
  montoCapital?: number;
  montoInteres?: number;
  montoMora?: number;
  montoTotal?: number;
};
export type CreateAbonoCreditoDTO = {
  ventaCuotaId: number; // id del crédito (master)
  sucursalId: number;
  usuarioId: number; // TODO: obtén del contexto/auth
  metodoPago: string; // Usa tu enum/union correspondiente
  referenciaPago?: string;
  montoTotal?: number;
  fechaAbono?: Date | string;
  detalles: CreateAbonoCuotaDTO[];
};

// ============================================================================
// Page
// ============================================================================
export default function CreditoDetails() {
  const { id } = useParams();
  const secureId = id ? parseInt(id) : 1;
  const CREDIT_REGIST_QK = ["credito-details-qk", secureId];

  const {
    data: credito,
    isLoading: isLoadingCreditos,
    refetch,
  } = useApiQuery<NormalizedCredito>(
    CREDIT_REGIST_QK,
    `credito/credito-details/${secureId}`,
    { params: {} },
    { refetchOnMount: "always", staleTime: 0 }
  );

  // Datos auxiliares (para el diálogo de movimiento financiero)
  const sucursalId = credito?.sucursal?.id;
  const proveedoresQ = useApiQuery<Array<{ id: number; nombre: string }>>(
    ["proveedores"],
    "/proveedor",
    undefined,
    { staleTime: 5 * 60_000, refetchOnWindowFocus: false }
  );
  const cuentasQ = useApiQuery<Array<{ id: number; nombre: string }>>(
    ["cuentas-bancarias", "simple-select"],
    "cuentas-bancarias/get-simple-select",
    undefined,
    { staleTime: 5 * 60_000, refetchOnWindowFocus: false }
  );
  const cajasQ = useApiQuery<CajaConSaldo[]>(
    ["cajas-disponibles", sucursalId],
    `/caja/cajas-disponibles/${sucursalId}`,
    undefined,
    { enabled: !!sucursalId, staleTime: 30_000, refetchOnWindowFocus: false }
  );

  // ===== Pago por CUOTA (una a la vez) =====
  const [selectedCuota, setSelectedCuota] = React.useState<NormCuota | null>(
    null
  );
  const [payAmount, setPayAmount] = React.useState<number>(0);

  const openPagoFor = (c: NormCuota) => {
    setSelectedCuota(c);
    setPayAmount(c.saldoPendiente ?? c.monto ?? 0);
    setOpenFormDialog(true);
  };

  // Dialogos para MF y confirmación final
  const [openFormDialog, setOpenFormDialog] = React.useState(false);
  const [openConfirm, setOpenConfirm] = React.useState(false);

  // Campos del dialog MF
  const [observaciones, setObservaciones] = React.useState("");
  const [proveedorSelected, setProveedorSelected] = React.useState<
    string | undefined
  >(undefined);
  const [metodoPago, setMetodoPago] = React.useState<
    | "EFECTIVO"
    | "TRANSFERENCIA"
    | "TARJETA"
    | "CHEQUE"
    | "CREDITO"
    | "OTRO"
    | "CONTADO"
    | ""
  >("");
  const [cuentaBancariaSelected, setCuentaBancariaSelected] =
    React.useState("");
  const [cajaSelected, setCajaSelected] = React.useState<string | null>(null);
  const [fechaPago, setFechaPago] = React.useState<string>(() =>
    new Date().toISOString().slice(0, 16)
  ); // datetime-local
  const [referenciaPago, setReferenciaPago] = React.useState<string>("");

  const totalSeleccion = Number(payAmount || 0);
  const canPagar = !!selectedCuota && totalSeleccion > 0;

  // Mutation crear abono
  const postUrl = `credito/abonos`; // TODO: reemplazar por endpoint real
  const { mutate: createAbono, isPending: isSaving } = useApiMutation<
    CreateAbonoCreditoDTO,
    any
  >(
    "post",
    postUrl
    // {
    //   onSuccess: async () => {
    //     setOpenConfirm(false);
    //     setOpenFormDialog(false);
    //     setSelectedCuota(null);
    //     setPayAmount(0);
    //     await refetch?.();
    //   },
    // }
  );

  const handleConfirmPago = () => {
    if (!credito || !selectedCuota || !canPagar) return;
    const payload: CreateAbonoCreditoDTO = {
      ventaCuotaId: credito.id,
      sucursalId: credito.sucursal.id,
      usuarioId: 0, // TODO: inyectar del contexto auth
      metodoPago: metodoPago || "EFECTIVO",
      referenciaPago: referenciaPago || undefined,
      montoTotal: totalSeleccion,
      fechaAbono: fechaPago ? new Date(fechaPago) : new Date(),
      detalles: [
        {
          cuotaId: selectedCuota.id,
          montoTotal: totalSeleccion,
        },
      ],
    };
    createAbono(payload);
    console.log("El payload es: ", payload);
  };

  if (isLoadingCreditos || !credito) {
    return (
      <div className="p-4 space-y-3">
        <PageHeader
          title="Crédito detalles"
          fallbackBackTo="/"
          sticky={false}
        />
        <div className="grid md:grid-cols-3 gap-3">
          <Card className="h-28 animate-pulse" />
          <Card className="h-28 animate-pulse" />
          <Card className="h-28 animate-pulse" />
        </div>
        <Card className="h-40 animate-pulse" />
        <Card className="h-72 animate-pulse" />
      </div>
    );
  }

  const numero = credito.numeroCredito ?? `#${credito.id}`;
  const fullName = [credito.cliente?.nombre, credito.cliente?.apellidos]
    .filter(Boolean)
    .join(" ");
  const venta = credito.montos.venta ?? 0;
  const pagado = credito.montos.totalPagado ?? 0;
  const saldo = venta - pagado;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="container p-4 space-y-4 mx-auto"
    >
      <PageHeader title="Crédito detalles" fallbackBackTo="/" sticky={false} />

      {/* ===== Resumen principal ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" />
              {numero}
              <Badge
                className={`ml-auto ${
                  estadoTone[credito.estado]
                } flex items-center gap-1`}
              >
                {estadoIcon[credito.estado]} {credito.estado}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid grid-cols-3 gap-2">
            <div>
              <div className="text-muted-foreground">Venta</div>
              <div className="font-medium">{Q(venta)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Pagado</div>
              <div className="font-medium">{Q(pagado)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Saldo</div>
              <div className="font-semibold">{Q(saldo)}</div>
            </div>
            <Separator className="col-span-3 my-1" />
            <div>
              <div className="text-muted-foreground">Inicio</div>
              <div>{fmt(credito.fechas.inicioISO)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Contrato</div>
              <div>{fmt(credito.fechas.contratoISO)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Próximo pago</div>
              <div>{fmt(credito.fechas.proximoPagoISO)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User2 className="h-4 w-4" /> Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="col-span-2 font-medium truncate" title={fullName}>
              {fullName || "—"}
            </div>
            {credito.cliente?.dpi && (
              <div className="text-muted-foreground text-xs">
                DPI: {credito.cliente.dpi}
              </div>
            )}
            {credito.cliente?.telefono && (
              <div className="text-muted-foreground text-xs">
                Tel: {credito.cliente.telefono}
              </div>
            )}
            {credito.cliente?.direccion && (
              <div className="text-muted-foreground text-xs col-span-2">
                {credito.cliente.direccion}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4" /> Sucursal
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid grid-cols-2 gap-x-3 gap-y-1">
            <div
              className="font-medium truncate"
              title={credito.sucursal.nombre}
            >
              {credito.sucursal.nombre}
            </div>
            <div className="text-muted-foreground text-xs">
              {credito.sucursal.tipoSucursal}
            </div>
            <div className="text-muted-foreground text-xs col-span-2">
              Vendedor: {credito.usuario?.nombre ?? "—"}
            </div>
            <div className="text-muted-foreground text-xs col-span-2">
              Plan: {credito.plan.frecuenciaPago} · {credito.plan.cuotasTotales}{" "}
              cuotas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Venta (líneas) ===== */}
      {credito.venta && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="h-4 w-4" /> Venta #{credito.venta.id} ·{" "}
              {fmt(credito.venta.fechaISO)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(credito.venta.lineas ?? []).map((l) => (
                <div
                  key={l.id}
                  className="rounded-md border p-2 flex items-start gap-2 bg-card"
                >
                  {l.item.imagen && (
                    <img
                      src={l.item.imagen}
                      alt={l.item.nombre}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate" title={l.item.nombre}>
                      {l.item.nombre}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {l.item.type} ·{" "}
                      {l.item.codigoProducto || l.item.codigoBarras || "—"}
                    </div>
                    <div className="text-xs mt-1">
                      {l.cantidad} × {Q(l.precioUnitario)} ·{" "}
                      <span className="font-medium">{Q(l.subtotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== Cuotas (botón Registrar pago en cada fila) ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" /> Cuotas
            <span className="ml-auto text-xs text-muted-foreground">
              Total: {credito.cuotas.resumen.total}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border divide-y">
            {(credito.cuotas.items ?? []).map((c) => {
              const isPayed = c.estado === "PAGADA";
              return (
                <div
                  key={c.id}
                  className="bg-card p-2 flex flex-wrap items-center gap-2"
                >
                  <div className="font-medium">Cuota {c.numero}</div>
                  <Badge className="h-5 px-1.5 text-[10px]">
                    {fmt(c.fechaVencimientoISO)}
                  </Badge>
                  <Badge className="h-5 px-1.5 text-[10px]">{c.estado}</Badge>
                  <span className="text-sm ml-auto">
                    Monto: <b>{Q(c.monto)}</b>
                  </span>
                  <Button
                    disabled={isPayed}
                    size="sm"
                    onClick={() => openPagoFor(c)}
                  >
                    <Banknote className="h-4 w-4 mr-1" /> Registrar pago
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ===== Abonos (historial de pagos) ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="h-4 w-4" /> Abonos realizados (
            {credito.abonos.count})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(credito.abonos.items ?? []).map((a) => (
            <div key={a.id} className="rounded-md border p-2 bg-card">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {fdt(a.fechaISO)}
                </Badge>
                <Badge className="h-5 px-1.5 text-[10px]">{a.metodoPago}</Badge>
                {a.referencia && (
                  <span className="text-xs text-muted-foreground">
                    Ref: {a.referencia}
                  </span>
                )}
                <span className="ml-auto text-sm font-medium">
                  {formattMonedaGT(a.montoTotal)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Eliminar abono"
                  className="h-8 w-8"
                  onClick={() => {}}
                ></Button>
                <DeleteAbonoButton
                  abono={a}
                  creditoId={credito.id}
                  onDone={refetch}
                />
              </div>
              {/* <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {(a.desglose ?? []).map((d, i) => (
                  <div
                    key={`${a.id}-${i}`}
                    className="rounded bg-muted/40 px-2 py-1"
                  >
                    Cuota #{d.cuotaId} · Capital {Q(d.capital)} · Interés{" "}
                    {Q(d.interes)} · Mora {Q(d.mora)} · Total {Q(d.total)}
                  </div>
                ))}
              </div> */}
            </div>
          ))}

          {credito.abonos.count === 0 && (
            <div className="text-sm text-muted-foreground">
              Aún no hay abonos.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Historial ===== */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" /> Historial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(credito.historial ?? []).map((h) => (
            <div
              key={h.id}
              className="rounded-md border p-2 bg-card flex items-start justify-between gap-2"
            >
              <div>
                <div className="font-medium">{h.accion}</div>
                {h.comentario && (
                  <div className="text-muted-foreground text-xs">
                    {h.comentario}
                  </div>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{fdt(h.fechaISO)}</div>
                <div>{h.usuario?.nombre ?? "—"}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ===== Diálogo: Movimiento Financiero (previo) ===== */}
      <PurchasePaymentFormDialog
        open={openFormDialog}
        onOpenChange={(o) => {
          setOpenFormDialog(o);
          if (!o) {
            // reset si se cierra sin continuar
            setSelectedCuota(null);
            setPayAmount(0);
          }
        }}
        title="Registrar pago de crédito"
        description={
          selectedCuota
            ? `Cuota #${selectedCuota.numero} · Saldo: ${Q(
                selectedCuota.saldoPendiente
              )}`
            : "Complete la información de movimiento financiero antes de confirmar."
        }
        proveedores={proveedoresQ.data ?? []}
        cuentasBancarias={cuentasQ.data ?? []}
        cajasDisponibles={cajasQ.data ?? []}
        montoRecepcion={totalSeleccion}
        formatMoney={(n) => Q(n).replace("Q", "Q ")}
        observaciones={observaciones}
        setObservaciones={setObservaciones}
        proveedorSelected={proveedorSelected}
        setProveedorSelected={setProveedorSelected}
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        cuentaBancariaSelected={cuentaBancariaSelected}
        setCuentaBancariaSelected={setCuentaBancariaSelected}
        cajaSelected={cajaSelected}
        setCajaSelected={setCajaSelected}
        // En pagos de crédito generalmente NO pedimos proveedor
        showProveedor={false}
        requireProveedor={false}
        onContinue={() => setOpenConfirm(true)}
        continueLabel="Confirmar pago"
        extraDisableReason={
          !canPagar ? "Ingrese el monto a pagar de la cuota." : null
        }
      >
        {/* Slot extra: Monto/Fecha/Referencia (compacto) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <Label htmlFor="montoTotal">Monto a pagar</Label>
            <Input
              id="montoTotal"
              type="number"
              min={0}
              step={0.01}
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
            />
            {selectedCuota && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Saldo pendiente: {Q(selectedCuota.saldoPendiente)}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="fechaPago">Fecha de pago</Label>
            <Input
              id="fechaPago"
              type="datetime-local"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="refPago">Referencia</Label>
            <Input
              id="refPago"
              value={referenciaPago}
              onChange={(e) => setReferenciaPago(e.target.value)}
              placeholder="# de boleta / txn"
            />
          </div>
        </div>
        {selectedCuota &&
          payAmount > Number(selectedCuota.saldoPendiente ?? Infinity) && (
            <p className="text-[12px] text-amber-600 mt-2">
              El monto supera el saldo de la cuota.
            </p>
          )}
      </PurchasePaymentFormDialog>

      {/* ===== Diálogo: Confirmación final ===== */}
      <AdvancedDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        title="Confirmar registro de pago"
        description={
          selectedCuota
            ? `Se registrará un pago por ${Q(totalSeleccion)} a la cuota #${
                selectedCuota.numero
              } del crédito ${numero}.`
            : ""
        }
        confirmButton={{
          label: "Sí, continuar y confirmar pago",
          onClick: () => handleConfirmPago(),
          disabled: isSaving,
        }}
      />
    </motion.div>
  );
}
