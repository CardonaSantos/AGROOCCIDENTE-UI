// ============================================================================
// File: src/Pages/Creditos/CreditoDetails.tsx
// Descripción: Vista de detalles de un crédito + flujo de pago y borrado de abonos
// ============================================================================

"use client";
import * as React from "react";
import { useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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

import PurchasePaymentFormDialog from "@/utils/components/SelectMethodPayment/PurchasePaymentFormDialog";
import type { CajaConSaldo } from "@/utils/components/SelectMethodPayment/PurchasePaymentFormDialog";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { useStore } from "@/components/Context/ContextSucursal";
import { toast } from "sonner";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { getApiErrorMessageAxios } from "@/Pages/Utils/UtilsErrorApi";

// Tipos
import type {
  NormalizedCredito,
  NormCuota,
} from "../interfaces/CreditoResponse";

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
type CreateAbonoCuotaDTO = {
  cuotaId: number;
  montoCapital?: number;
  montoInteres?: number;
  montoMora?: number;
  montoTotal?: number;
};
type CreateAbonoCreditoDTO = {
  ventaCuotaId: number;
  sucursalId: number;
  usuarioId: number;
  metodoPago: string;
  referenciaPago?: string;
  montoTotal?: number;
  fechaAbono?: Date | string;
  detalles: CreateAbonoCuotaDTO[];
};

// Abono minimal para selección en la UI
type NormAbonoLite = {
  id: number;
  fechaISO: string;
  metodoPago: string;
  referencia?: string | null;
  montoTotal: number;
};

// Payload para eliminar (POST-delete)
type DeleteAbonoPayload = {
  abonoId: number;
  ventaCuotaId: number;
  usuarioId: number;
  motivo?: string;
};

// ============================================================================
// Component
// ============================================================================
export default function CreditoDetails() {
  // ------------------------------------------
  // Contexto / params / query key
  // ------------------------------------------
  const { id } = useParams();
  const userId = useStore((s) => s.userId) ?? 0;
  const secureId = id ? parseInt(id) : 1;
  const CREDIT_REGIST_QK = useMemo(
    () => ["credito-details-qk", secureId],
    [secureId]
  );
  const queryClient = useQueryClient();

  // ------------------------------------------
  // Query principal
  // ------------------------------------------
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

  // ------------------------------------------
  // Queries auxiliares (diálogo MF)
  // ------------------------------------------
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

  // ------------------------------------------
  // Estado: Pago de cuota
  // ------------------------------------------
  const [selectedCuota, setSelectedCuota] = React.useState<NormCuota | null>(
    null
  );
  const [payAmount, setPayAmount] = React.useState<number>(0);
  const [dist, setDist] = React.useState({ mora: 0, interes: 0, capital: 0 });

  // Diálogo MF + Confirmación
  const [openFormDialog, setOpenFormDialog] = React.useState(false);
  const [openConfirm, setOpenConfirm] = React.useState(false);

  // Campos del diálogo MF
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
  );
  const [referenciaPago, setReferenciaPago] = React.useState<string>("");

  const totalSeleccion = Number(payAmount || 0);
  const canPagar = !!selectedCuota && totalSeleccion > 0;

  // ------------------------------------------
  // Estado: Eliminar abono
  // ------------------------------------------
  const [openDeletePago, setOpenDeletePago] = React.useState(false);
  const [selectedPago, setSelectedPago] = React.useState<NormAbonoLite | null>(
    null
  );
  const [deleteMotivo, setDeleteMotivo] = React.useState<string>("");

  // ------------------------------------------
  // Mutations
  // ------------------------------------------
  const postUrl = `abono-cuota`;
  const deleteUrl = `abono-cuota/delete`;

  const { mutateAsync: createAbono, isPending: isSaving } = useApiMutation<
    CreateAbonoCreditoDTO,
    any
  >("post", postUrl, undefined, {
    onSuccess: async () => {
      // limpiar UI
      setOpenConfirm(false);
      setOpenFormDialog(false);
      setSelectedCuota(null);
      setPayAmount(0);
      setDist({ mora: 0, interes: 0, capital: 0 });
      setReferenciaPago("");
      setMetodoPago("");
      setCajaSelected(null);
      setCuentaBancariaSelected("");

      // re-fetch fuerte
      queryClient.invalidateQueries({ queryKey: CREDIT_REGIST_QK });
      await refetch?.();
    },
    onError: (err) => toast.error(getApiErrorMessageAxios(err)),
  });

  const { mutateAsync: deleteAbono, isPending: isDeleting } = useApiMutation<
    DeleteAbonoPayload,
    any
  >("post", deleteUrl, undefined, {
    onSuccess: async () => {
      setOpenDeletePago(false);
      setSelectedPago(null);
      setDeleteMotivo("");

      queryClient.invalidateQueries({ queryKey: CREDIT_REGIST_QK });
      await refetch?.();
    },
    onError: (err) => toast.error(getApiErrorMessageAxios(err)),
  });

  // ------------------------------------------
  // Handlers
  // ------------------------------------------
  const recomputeDist = useCallback((c: NormCuota, total: number) => {
    // Regla: MORA -> INTERÉS -> CAPITAL
    let rest = total;
    const payMora = Math.min(c.moraPendiente, rest);
    rest -= payMora;
    const payInt = Math.min(c.interesPendiente, rest);
    rest -= payInt;
    const payCap = Math.min(c.capitalPendiente, rest);
    return { mora: payMora, interes: payInt, capital: payCap };
  }, []);

  const openPagoFor = useCallback(
    (c: NormCuota) => {
      setSelectedCuota(c);
      const sugerido = Math.max(0, c.pagoSugerido?.total ?? 0);
      const base = c.saldoPendiente + (c.moraPendiente || 0);
      const defecto = sugerido || base;
      setPayAmount(defecto);
      setDist(recomputeDist(c, defecto));
      setOpenFormDialog(true);
    },
    [recomputeDist]
  );

  const handleConfirmPago = useCallback(() => {
    if (!credito || !selectedCuota || !canPagar) return;

    const suma = Number(
      (dist.mora || 0) + (dist.interes || 0) + (dist.capital || 0)
    );
    const payload: CreateAbonoCreditoDTO = {
      ventaCuotaId: credito.id,
      sucursalId: credito.sucursal.id,
      usuarioId: userId,
      metodoPago: metodoPago || "EFECTIVO",
      referenciaPago: referenciaPago || undefined,
      montoTotal: suma,
      fechaAbono: fechaPago ? new Date(fechaPago) : new Date(),
      detalles: [
        {
          cuotaId: selectedCuota.id,
          montoMora: dist.mora || 0,
          montoInteres: dist.interes || 0,
          montoCapital: dist.capital || 0,
          montoTotal: suma,
        },
      ],
    };

    toast.promise(createAbono(payload), {
      loading: "Registrando pago...",
      success: "Pago a crédito registrado",
      error: (e) => getApiErrorMessageAxios(e),
    });
  }, [
    credito,
    selectedCuota,
    canPagar,
    dist,
    metodoPago,
    referenciaPago,
    fechaPago,
    userId,
    createAbono,
  ]);

  const handleOpenDelete = useCallback((abono: NormAbonoLite) => {
    setSelectedPago(abono);
    setDeleteMotivo("");
    setOpenDeletePago(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!selectedPago || !credito) return;

    const payload: DeleteAbonoPayload = {
      abonoId: selectedPago.id,
      ventaCuotaId: credito.id,
      usuarioId: userId,
      motivo: deleteMotivo.trim() || undefined,
    };

    toast.promise(deleteAbono(payload), {
      loading: "Eliminando abono...",
      success: "Abono eliminado",
      error: (e) => getApiErrorMessageAxios(e),
    });
  }, [selectedPago, credito, userId, deleteMotivo, deleteAbono]);

  // ------------------------------------------
  // Syncs
  // ------------------------------------------
  React.useEffect(() => {
    if (!selectedCuota) return;
    setDist(recomputeDist(selectedCuota, payAmount));
  }, [selectedCuota, payAmount, recomputeDist]);

  // ------------------------------------------
  // Loading
  // ------------------------------------------
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

  // ------------------------------------------
  // Derivados
  // ------------------------------------------
  const numero = credito.numeroCredito ?? `#${credito.id}`;
  const fullName = [credito.cliente?.nombre, credito.cliente?.apellidos]
    .filter(Boolean)
    .join(" ");
  const venta = credito.montos.venta ?? 0;
  const pagado = credito.montos.totalPagado ?? 0;
  const saldo = venta - pagado;

  // ------------------------------------------
  // Render
  // ------------------------------------------
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

      {/* ===== Cuotas ===== */}
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

      {/* ===== Abonos ===== */}
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
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    handleOpenDelete({
                      id: a.id,
                      fechaISO: a.fechaISO,
                      metodoPago: a.metodoPago,
                      referencia: a.referencia,
                      montoTotal: a.montoTotal,
                    })
                  }
                >
                  Eliminar
                </Button>
              </div>
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
        showProveedor={false}
        requireProveedor={false}
        layout="two-column"
        flow="IN"
        requireObservaciones={false}
        onContinue={() => setOpenConfirm(true)}
        continueLabel="Confirmar pago"
        extraDisableReason={
          !canPagar ? "Ingrese el monto a pagar de la cuota." : null
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <Label htmlFor="montoTotal">Monto a pagar</Label>
            <Input
              id="montoTotal"
              type="number"
              min={0}
              step={0.01}
              value={payAmount}
              onChange={(e) => {
                const v = Math.max(0, Number(e.target.value) || 0);
                setPayAmount(v);
                if (selectedCuota) setDist(recomputeDist(selectedCuota, v));
              }}
            />
            {selectedCuota && (
              <p className="text-[11px] text-muted-foreground mt-1 space-x-2">
                <span>Saldo cuota: {Q(selectedCuota.saldoPendiente)}</span>
                <span>· Mora pend: {Q(selectedCuota.moraPendiente ?? 0)}</span>
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

        {/* Pendientes por concepto + días de atraso */}
        {selectedCuota && (
          <div className="mt-2 text-[12px] text-muted-foreground flex flex-wrap gap-2">
            <span className="rounded border px-2 py-0.5">
              Mora pend: <b>{Q(selectedCuota.moraPendiente ?? 0)}</b>
            </span>
            <span className="rounded border px-2 py-0.5">
              Interés pend: <b>{Q(selectedCuota.interesPendiente ?? 0)}</b>
            </span>
            <span className="rounded border px-2 py-0.5">
              Capital pend: <b>{Q(selectedCuota.capitalPendiente ?? 0)}</b>
            </span>
            {Number(selectedCuota.diasAtraso ?? 0) > 0 && (
              <span className="rounded bg-amber-500/15 text-amber-700 px-2 py-0.5">
                {selectedCuota.diasAtraso} días atraso
              </span>
            )}
          </div>
        )}

        {/* Desglose editable (respeta prioridad) */}
        {selectedCuota && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            {/* MORA */}
            <div>
              <Label>Mora</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={dist.mora}
                onChange={(e) => {
                  const moraPend = Number(selectedCuota.moraPendiente ?? 0);
                  let v = Number(e.target.value) || 0;
                  v = Math.max(0, Math.min(v, moraPend, payAmount));
                  const rest = Math.max(0, payAmount - v);

                  const intPend = Number(selectedCuota.interesPendiente ?? 0);
                  const capPend = Number(selectedCuota.capitalPendiente ?? 0);
                  const payInt = Math.min(intPend, rest);
                  const payCap = Math.min(capPend, Math.max(0, rest - payInt));
                  setDist({ mora: v, interes: payInt, capital: payCap });
                }}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Pendiente: {Q(selectedCuota.moraPendiente ?? 0)}
              </p>
            </div>

            {/* INTERÉS */}
            <div>
              <Label>Interés</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={dist.interes}
                onChange={(e) => {
                  const intPend = Number(selectedCuota.interesPendiente ?? 0);
                  let v = Number(e.target.value) || 0;
                  const maxByMonto = Math.max(0, payAmount - (dist.mora || 0));
                  v = Math.max(0, Math.min(v, intPend, maxByMonto));

                  const rest = Math.max(0, payAmount - (dist.mora + v));
                  const capPend = Number(selectedCuota.capitalPendiente ?? 0);
                  const payCap = Math.min(capPend, rest);
                  setDist({ mora: dist.mora, interes: v, capital: payCap });
                }}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Pendiente: {Q(selectedCuota.interesPendiente ?? 0)}
              </p>
            </div>

            {/* CAPITAL */}
            <div>
              <Label>Capital</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={dist.capital}
                onChange={(e) => {
                  const capPend = Number(selectedCuota.capitalPendiente ?? 0);
                  const maxCap = Math.min(
                    capPend,
                    Math.max(0, payAmount - (dist.mora + dist.interes))
                  );
                  let v = Number(e.target.value) || 0;
                  v = Math.max(0, Math.min(v, maxCap));
                  setDist({ ...dist, capital: v });
                }}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Pendiente: {Q(selectedCuota.capitalPendiente ?? 0)}
              </p>
            </div>
          </div>
        )}

        {/* Reglas / avisos */}
        {selectedCuota && (
          <>
            <p className="text-[12px] mt-2">
              <span className="text-muted-foreground">Suma desglose:</span>{" "}
              <b>
                {Q(
                  (dist.mora || 0) + (dist.interes || 0) + (dist.capital || 0)
                )}
              </b>
            </p>

            {dist.capital > 0 &&
              (Number(selectedCuota.moraPendiente ?? 0) - (dist.mora || 0) >
                0 ||
                Number(selectedCuota.interesPendiente ?? 0) -
                  (dist.interes || 0) >
                  0) && (
                <p className="text-[12px] text-amber-600 mt-1">
                  Regla: primero mora, luego interés y al final capital.
                </p>
              )}

            {(() => {
              const moraPend = Number(selectedCuota.moraPendiente ?? 0);
              const intPend = Number(selectedCuota.interesPendiente ?? 0);
              const capPend = Number(selectedCuota.capitalPendiente ?? 0);
              const maxTotal = moraPend + intPend + capPend;
              return totalSeleccion > maxTotal ? (
                <p className="text-[12px] text-amber-600 mt-1">
                  El monto supera el total pendiente.
                </p>
              ) : null;
            })()}
          </>
        )}
      </PurchasePaymentFormDialog>

      {/* ===== Confirmación de pago ===== */}
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
          onClick: handleConfirmPago,
          disabled: isSaving,
        }}
      />

      {/* ===== Eliminar abono ===== */}
      <AdvancedDialog
        type="destructive"
        open={openDeletePago}
        onOpenChange={(o) => {
          setOpenDeletePago(o);
          if (!o) {
            setSelectedPago(null);
            setDeleteMotivo("");
          }
        }}
        title="Eliminar abono"
        description={
          selectedPago
            ? `Se eliminará el abono de ${formattMonedaGT(
                selectedPago.montoTotal
              )} realizado el ${fdt(selectedPago.fechaISO)}.`
            : ""
        }
        confirmButton={{
          label: "Sí, eliminar abono",
          disabled: isDeleting || !selectedPago,
          loading: isDeleting,
          loadingText: "Eliminando...",
          variant: "destructive",
          onClick: handleConfirmDelete,
        }}
        cancelButton={{
          label: "Cancelar",
          onClick: () => setOpenDeletePago(false),
        }}
      >
        <div className="space-y-2">
          {selectedPago && (
            <>
              <p className="text-sm text-muted-foreground">
                Esta acción revertirá los saldos de la cuota/crédito asociados a
                este abono.
              </p>
              <div className="rounded-md border p-2 text-sm">
                <div className="flex justify-between">
                  <span>Monto</span>
                  <b>{formattMonedaGT(selectedPago.montoTotal)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Fecha</span>
                  <span>{fdt(selectedPago.fechaISO)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método</span>
                  <span>{selectedPago.metodoPago}</span>
                </div>
                {selectedPago.referencia && (
                  <div className="flex justify-between">
                    <span>Referencia</span>
                    <span>{selectedPago.referencia}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="motivoDelete">Motivo (opcional)</Label>
                <Input
                  id="motivoDelete"
                  placeholder="Ej. error de digitación"
                  value={deleteMotivo}
                  onChange={(e) => setDeleteMotivo(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </AdvancedDialog>
    </motion.div>
  );
}
