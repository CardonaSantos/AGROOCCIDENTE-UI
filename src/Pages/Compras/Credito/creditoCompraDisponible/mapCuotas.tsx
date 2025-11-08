// MapCuotasCreditoCompra.tsx
"use client";
import { useMemo, useState, ChangeEvent } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { toast } from "sonner";

import { UICuota, UIPagoEnCuota } from "./interfaces/interfaces";
import { PagoCxPPayload } from "./interfaces/payload";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import { getApiErrorMessageAxios } from "@/Pages/Utils/UtilsErrorApi";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock4,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import PurchasePaymentFormDialog, {
  MetodoPago,
  MetodoPagoOption,
  CajaConSaldo,
} from "@/utils/components/SelectMethodPayment/PurchasePaymentFormDialog";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";

import ReceptionPicker, {
  DetalleNormalizado,
  PickedItem,
} from "./ReceptionPicker";
import {
  CreatePagoConRecepcionPayload,
  CreateRecepcionBlock,
} from "./interfaces/interfacess2";
import { qk } from "../../qk";
import CostosAsociadosDialog from "../../components/Costos Asociados Dialog";
import {
  MovimientoFinancieroDraft,
  ProrrateoMeta,
} from "../../CostoAsociadoTypes";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("es");

// ============================
// Tipos y Props
// ============================
type CuentaBancaria = { id: number; nombre: string };
type ProveedorLite = { id: number; nombre: string };

interface PropsCuotas {
  cuotas: UICuota[];
  handleRefresAll: () => void;
  userId: number;
  documentoId: number;
  sucursalId: number;
  cajasDisponibles: CajaConSaldo[];
  compraId: number; // para crear recepción y asociar
  cuentasBancarias?: CuentaBancaria[];
  proveedores?: ProveedorLite[];
  normalizados: DetalleNormalizado[];
}

interface PayloadDeletePago {
  cuotaId: number;
  documentoId: number;
  usuarioId: number;
  observaciones: string;
}

// ============================
// Helpers puros (fuera del componente)
// ============================
const EstadoCuotaBadge = ({ estado }: { estado: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    PENDIENTE: {
      label: "Pendiente",
      className: "bg-amber-100 text-amber-800 border-amber-200",
    },
    PARCIAL: {
      label: "Parcial",
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    PAGADA: {
      label: "Pagada",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    VENCIDA: {
      label: "Vencida",
      className: "bg-rose-100 text-rose-800 border-rose-200",
    },
  };
  const v = map[estado] ?? {
    label: estado,
    className: "bg-muted text-foreground/80 border-border",
  };
  return (
    <Badge className={cn("rounded-full px-2.5 py-0.5 border", v.className)}>
      {v.label}
    </Badge>
  );
};

const leftStripeByEstado = (estado: string) =>
  ({
    PENDIENTE: "before:bg-amber-400",
    PARCIAL: "before:bg-blue-500",
    PAGADA: "before:bg-emerald-500",
    VENCIDA: "before:bg-rose-500",
  }[estado] ?? "before:bg-muted-foreground/40");

function normalizeMetodoPagoUIToBackend(
  value: string
): "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CHEQUE" | "CREDITO" | "OTRO" {
  const v = (value || "").toUpperCase();
  if (v === "CONTADO") return "EFECTIVO";
  if (
    [
      "EFECTIVO",
      "TRANSFERENCIA",
      "TARJETA",
      "CHEQUE",
      "CREDITO",
      "OTRO",
    ].includes(v)
  )
    return v as any;
  return "OTRO";
}

function ymdToISO(ymd: string | undefined) {
  if (!ymd) return undefined;
  try {
    return dayjs(ymd, "YYYY-MM-DD", true).startOf("day").toDate().toISOString();
  } catch {
    return undefined;
  }
}

function toAmountString(n: string | number) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

const metodoPagoOptions: MetodoPagoOption[] = [
  { value: "EFECTIVO", label: "Efectivo", canal: "CAJA" },
  { value: "TRANSFERENCIA", label: "Transferencia/Depósito", canal: "BANCO" },
  { value: "TARJETA", label: "Tarjeta", canal: "BANCO" },
  { value: "CHEQUE", label: "Cheque", canal: "BANCO" },
];

const getPendiente = (l: DetalleNormalizado) => {
  if (typeof l.pendiente === "number") return Math.max(0, l.pendiente);
  const recibido = typeof l.recibido === "number" ? l.recibido : 0;
  return Math.max(0, (l.cantidad ?? 0) - recibido);
};

// ============================
// Componente principal
// ============================
function MapCuotasCreditoCompra({
  cuotas,
  handleRefresAll,
  userId,
  documentoId,
  sucursalId,
  cajasDisponibles,
  cuentasBancarias = [],
  proveedores = [],
  compraId,
}: PropsCuotas) {
  // -----------------------------------------
  // React Query: client + util invalidación
  // -----------------------------------------
  const qc = useQueryClient();

  const invalidateCreditoData = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: qk.creditoFromCompra(compraId) }),
      qc.invalidateQueries({ queryKey: qk.compraRecepcionable(compraId) }),
      qc.invalidateQueries({ queryKey: qk.compra(compraId) }),
      qc.invalidateQueries({ queryKey: ["detalles-recepcion", compraId] }),
    ]);
  };

  // -----------------------------------------
  // UI State
  // -----------------------------------------

  // === Prorrateo/Costo asociado (solo si hay recepción) =======================
  const [openCostoDialog, setOpenCostoDialog] = useState(false);
  const [mfDraft, setMfDraft] = useState<MovimientoFinancieroDraft | null>(
    null
  );
  const [prorrateoMeta, setProrrateoMeta] = useState<
    ProrrateoMeta | null | undefined
  >(null);
  const [costoStepDone, setCostoStepDone] = useState(false); // marcamos si el usuario completó el paso de costos

  const [openPay, setOpenPay] = useState(false); // dialog de pago
  const [openPicker, setOpenPicker] = useState(false); // dialog de recepción
  const [openDelete, setOpenDelete] = useState(false); // dialog de eliminar pago

  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<UICuota | null>(
    null
  );
  const [picked, setPicked] = useState<PickedItem[]>([]);
  const [cuentaBancariaSelected, setCuentaBancariaSelected] =
    useState<string>("");
  const [cajaSelected, setCajaSelected] = useState<string | null>(null);
  const [proveedorSelected, setProveedorSelected] = useState<
    string | undefined
  >(undefined);
  const [openConfirmPayment, setOpenConfirmPayment] = useState<boolean>(false);

  const [payloadPayment, setPayloadPayment] = useState<PagoCxPPayload>({
    documentoId,
    metodoPago: "EFECTIVO",
    monto: "",
    registradoPorId: userId,
    fechaPago: "",
    observaciones: "",
    referencia: "",
  });

  // -----------------------------------------
  // Queries (fresh-first policies)
  // -----------------------------------------
  const { data: products = [], refetch: refetchProducts } = useApiQuery<
    DetalleNormalizado[]
  >(
    ["detalles-recepcion", compraId],
    `compras-pagos-creditos/get-detalles-productos-recepcion/${compraId}`,
    undefined,
    {
      enabled: !!compraId && openPicker, // carga cuando abres el picker
      refetchOnWindowFocus: true, // siempre refrescar al enfocar
      refetchOnMount: "always", // y al montar
      refetchOnReconnect: "always", // y al reconectar
      placeholderData: keepPreviousData,
    }
  );

  // -----------------------------------------
  // Mutations (todas invalidan los mismos QKs)
  // -----------------------------------------
  const postPago = useApiMutation(
    "post",
    "/compras-pagos-creditos/",
    undefined,
    {
      onSuccess: invalidateCreditoData,
    }
  );

  const deletePagoCuota = useApiMutation<any, PayloadDeletePago>(
    "post",
    "compras-pagos-creditos/delete-cuota-payed",
    undefined,
    {
      onSuccess: invalidateCreditoData,
    }
  );

  // -----------------------------------------
  // Derived values
  // -----------------------------------------
  const saldoCuota = useMemo(
    () => cuotaSeleccionada?.saldo ?? cuotaSeleccionada?.monto ?? 0,
    [cuotaSeleccionada]
  );

  const montoN = useMemo(
    () => parseFloat(String(payloadPayment.monto || 0)),
    [payloadPayment.monto]
  );

  const montoOk = !isNaN(montoN) && montoN > 0 && montoN <= (saldoCuota || 0);

  const fechaOk =
    !!payloadPayment.fechaPago &&
    dayjs(payloadPayment.fechaPago, "YYYY-MM-DD", true).isValid();

  const extraDisableReason = !fechaOk
    ? "Seleccione una fecha válida."
    : !montoOk
    ? `Monto inválido. Máximo permitido: ${formattMonedaGT(saldoCuota)}.`
    : null;

  const allReceived = (rows: DetalleNormalizado[] = []) =>
    rows.every((n) => getPendiente(n) === 0);

  // -----------------------------------------
  // Handlers
  // -----------------------------------------
  const resetPaymentState = () => {
    setCuentaBancariaSelected("");
    setCajaSelected(null);
  };

  // Abre flujo de pago (o picker si hay pendiente)
  const handleOpenPayFlow = async (cuota: UICuota) => {
    setCuotaSeleccionada(cuota);
    setPicked([]);

    // Estado fresco ANTES de decidir
    const { data: fresh = [] } = await refetchProducts();

    if (allReceived(fresh)) {
      setPayloadPayment((prev) => ({
        ...prev,
        documentoId,
        monto: toAmountString(cuota.saldo ?? cuota.monto ?? 0),
        fechaPago: dayjs().format("YYYY-MM-DD"),
        metodoPago: "EFECTIVO",
        observaciones: "",
        referencia: "",
      }));
      resetPaymentState();
      setOpenPay(true);
    } else {
      setOpenPicker(true);
    }
  };

  const handlePickerConfirm = (items: PickedItem[]) => {
    setPicked(items);

    // si hay algo para recepcionar, pasamos antes por el diálogo de costo/prorrateo
    if (items.length > 0) {
      setOpenPicker(false);
      setCostoStepDone(false); // resetea bandera de paso completado
      setOpenCostoDialog(true); // 👉 abre costo asociado
      return;
    }

    // (fallback) si no hay nada seleccionado, vamos directo al pago como antes
    if (cuotaSeleccionada) {
      setPayloadPayment((prev) => ({
        ...prev,
        documentoId,
        monto: toAmountString(
          cuotaSeleccionada.saldo ?? cuotaSeleccionada.monto ?? 0
        ),
        fechaPago: dayjs().format("YYYY-MM-DD"),
        metodoPago: "EFECTIVO",
        observaciones: "",
        referencia: "",
      }));
      resetPaymentState();
      setOpenPicker(false);
      setOpenPay(true);
    }
  };

  //PAGAR CUOTA

  const handleRegistPayment = async () => {
    if (!cuotaSeleccionada) return;
    // --- bloque de recepción (como ya lo tienes) ---
    let recepcionBlock: CreateRecepcionBlock | undefined = undefined;
    if ((picked?.length ?? 0) > 0) {
      if (!compraId) {
        toast.error("No se puede registrar recepción: falta compraId.");
        return;
      }
      recepcionBlock = {
        compraId,
        items: picked.map((p) => ({
          compraDetalleId: p.compraDetalleId,
          refId: p.refId,
          tipo: p.tipo,
          cantidad: p.cantidad,
          fechaVencimientoISO: p.fechaVencimientoISO ?? null,
        })),
      };
    }

    // --- método/canales del pago de la cuota ---
    const metodo = normalizeMetodoPagoUIToBackend(
      String(payloadPayment.metodoPago)
    );

    // --- NUEVO: prorrateo + mf (solo si hubo recepción Y el usuario confirmó el paso de costos) ---
    const includeCostAndProrr =
      !!recepcionBlock &&
      !!prorrateoMeta?.aplicar &&
      Number(mfDraft?.monto ?? 0) > 0;

    const recepcionPayload = recepcionBlock
      ? {
          ...recepcionBlock,
          ...(includeCostAndProrr
            ? {
                prorrateo: {
                  aplicar: true,
                  base: prorrateoMeta?.base ?? "",
                  incluirAntiguos: prorrateoMeta?.incluirAntiguos ?? false,
                },
                mf: {
                  ...mfDraft!,
                  // por si acaso, garantiza sucursalId
                  sucursalId,
                },
              }
            : {}),
        }
      : undefined;

    const body: CreatePagoConRecepcionPayload = {
      documentoId,
      sucursalId,
      cuotaId: cuotaSeleccionada.id,
      registradoPorId: userId,
      metodoPago: metodo,
      monto: toAmountString(payloadPayment.monto || 0),
      fechaPago: ymdToISO(payloadPayment.fechaPago || undefined),
      observaciones: payloadPayment.observaciones?.trim() || undefined,
      referencia: payloadPayment.referencia?.trim() || undefined,
      expectedCuotaSaldo: toAmountString(cuotaSeleccionada.saldo ?? 0),

      // canal del PAGO de la cuota
      cajaId:
        metodo === "EFECTIVO"
          ? cajaSelected
            ? Number(cajaSelected)
            : undefined
          : undefined,
      cuentaBancariaId:
        metodo !== "EFECTIVO"
          ? cuentaBancariaSelected
            ? Number(cuentaBancariaSelected)
            : undefined
          : undefined,

      // recepción (con o sin costo/prorrateo embebido)
      recepcion: recepcionPayload,
    };

    try {
      await toast.promise(postPago.mutateAsync(body), {
        loading: "Procesando…",
        success:
          "Pago registrado" +
          (recepcionBlock ? " con recepción" : "") +
          (includeCostAndProrr ? " + costo asociado prorrateado" : ""),
        error: (e) => getApiErrorMessageAxios(e),
      });
    } finally {
      await invalidateCreditoData();
      await handleRefresAll();
      setOpenPay(false);
      setPicked([]);
      setMfDraft(null);
      setProrrateoMeta(null);
      setCostoStepDone(false);
      setOpenConfirmPayment(false);
    }
  };

  const handleOpenDelete = (cuota: UICuota) => {
    setCuotaSeleccionada(cuota);
    setOpenDelete(true);
  };

  const handleDeletePayment = async () => {
    if (!cuotaSeleccionada) return;
    const payload: PayloadDeletePago = {
      cuotaId: cuotaSeleccionada.id,
      documentoId,
      usuarioId: userId,
      observaciones: "",
    };
    try {
      await toast.promise(deletePagoCuota.mutateAsync(payload), {
        loading: "Eliminando registro de pago...",
        success: "Registro de pago eliminado",
        error: (e) => getApiErrorMessageAxios(e),
      });
      await invalidateCreditoData();
      await handleRefresAll();
      setOpenDelete(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChangeEvent = <K extends keyof PagoCxPPayload>(
    keyName: K,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setPayloadPayment((prev) => ({ ...prev, [keyName]: newValue as any }));
  };
  if (!Array.isArray(cuotas) || cuotas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay cuotas disponibles.
      </p>
    );
  }
  console.log("Los pickeados son: ", picked);
  console.log("los productos fetcheados son: ", products);

  // —— Resumen para el confirmador —— //
  const willReceive = (picked?.length ?? 0) > 0;
  const totalRecibir = (picked ?? []).reduce(
    (s, x) => s + (Number(x.cantidad) || 0),
    0
  );
  const lineasRecibir = picked?.length ?? 0;

  const includeCostAndProrr =
    Boolean(willReceive) &&
    Boolean(costoStepDone) &&
    !!mfDraft &&
    (prorrateoMeta?.aplicar ?? true) &&
    Number(mfDraft?.monto || 0) > 0;

  const metodoLabel = String(payloadPayment.metodoPago || "").toUpperCase();
  const canalLabel =
    metodoLabel === "EFECTIVO"
      ? cajaSelected
        ? ` · Caja #${cajaSelected}`
        : ""
      : cuentaBancariaSelected
      ? ` · Cta. #${cuentaBancariaSelected}`
      : "";

  const fechaLabel = payloadPayment.fechaPago || dayjs().format("YYYY-MM-DD");
  const montoPagoN = Number(payloadPayment.monto || 0);
  const saldoPostPago = Math.max(
    0,
    (saldoCuota || 0) - (isNaN(montoPagoN) ? 0 : montoPagoN)
  );

  // texto multilinea (solo string)
  const confirmText = [
    "Se realizará lo siguiente:",
    willReceive
      ? `• Recepción: ${totalRecibir} unidad(es) en ${lineasRecibir} línea(s). [IRREVERSIBLE]`
      : "• No se crearán recepciones de productos.",
    includeCostAndProrr
      ? `• Costo asociado: ${formattMonedaGT(
          mfDraft!.monto
        )} y prorrateo por unidades. [IRREVERSIBLE AUTOMÁTICAMENTE]`
      : null,
    `• Pago: ${formattMonedaGT(
      montoPagoN
    )} (${metodoLabel}${canalLabel}) con fecha ${fechaLabel}.`,
    `  Saldo de la cuota tras el pago: ${formattMonedaGT(saldoPostPago)}.`,
    "Nota: “Deshacer pago” revierte solo el pago; no afecta stock ni prorrateos.",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-2">
      {/* Cards de cuotas */}
      {cuotas.map((c) => {
        const isPayed = c.estado === "PAGADA";
        const vence = dayjs(c.fechaVencimientoISO).format("DD MMM YYYY");
        return (
          <Card
            key={c.id}
            className={cn(
              "relative overflow-hidden border",
              "before:absolute before:left-0 before:top-0 before:h-full before:w-1",
              leftStripeByEstado(c.estado)
            )}
          >
            <div className="p-3 md:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base md:text-lg font-medium">
                      Cuota #{c.numero ?? c.id}
                    </h4>
                    <EstadoCuotaBadge estado={c.estado} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CircleDollarSign className="h-4 w-4" /> Monto:{" "}
                      {formattMonedaGT(c.monto)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Banknote className="h-4 w-4" /> Saldo:{" "}
                      {formattMonedaGT(c.saldo)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" /> Vence: {vence}
                    </span>
                    {c.pagadaEnISO ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Pagada:{" "}
                        {dayjs(c.pagadaEnISO).format("DD MMM YYYY")}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isPayed ? "secondary" : "default"}
                    size="sm"
                    disabled={isPayed}
                    onClick={() => handleOpenPayFlow(c)}
                    className="gap-1.5"
                  >
                    <ReceiptText className="h-4 w-4" />
                    {isPayed ? "Pagada" : "Pagar cuota"}
                  </Button>

                  {isPayed ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleOpenDelete(c)}
                      className="gap-1.5"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Deshacer pago
                    </Button>
                  ) : null}
                </div>
              </div>

              {/* Pagos */}
              <div className="mt-3">
                {Array.isArray(c.pagos) && c.pagos.length > 0 ? (
                  <Accordion type="single" collapsible>
                    <AccordionItem value={`pagos-${c.id}`}>
                      <AccordionTrigger className="text-sm">
                        Ver pagos registrados ({c.pagos.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <PagosList pagos={c.pagos} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    No hay pagos registrados aún…
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      {/* Picker de recepción (solo si hay pendiente) */}
      <ReceptionPicker
        open={openPicker}
        onOpenChange={setOpenPicker}
        normalizados={products}
        picked={picked}
        setPicked={setPicked}
        onConfirm={(items) => handlePickerConfirm(items)}
      />

      {/* Dialog de pago (igual que hoy) */}
      <PurchasePaymentFormDialog
        layout="two-column"
        flow="OUT"
        open={openPay}
        onOpenChange={setOpenPay}
        title={
          cuotaSeleccionada
            ? `Pagar cuota #${cuotaSeleccionada.numero ?? cuotaSeleccionada.id}`
            : "Registrar pago"
        }
        description="Complete la información para registrar el pago."
        proveedores={proveedores}
        cuentasBancarias={cuentasBancarias}
        cajasDisponibles={cajasDisponibles}
        montoRecepcion={montoN || 0}
        formatMoney={(n) => formattMonedaGT(Number(n))}
        metodoPagoOptions={metodoPagoOptions}
        observaciones={payloadPayment.observaciones ?? ""}
        setObservaciones={(v) =>
          setPayloadPayment((prev) => ({ ...prev, observaciones: v }))
        }
        proveedorSelected={proveedorSelected}
        setProveedorSelected={setProveedorSelected}
        metodoPago={payloadPayment.metodoPago as MetodoPago}
        setMetodoPago={(v) =>
          setPayloadPayment((prev) => ({
            ...prev,
            metodoPago: v as MetodoPago,
          }))
        }
        cuentaBancariaSelected={cuentaBancariaSelected}
        setCuentaBancariaSelected={setCuentaBancariaSelected}
        cajaSelected={cajaSelected}
        setCajaSelected={setCajaSelected}
        showProveedor={false}
        requireProveedor={false}
        showObservaciones={true}
        requireObservaciones={false}
        extraDisableReason={
          extraDisableReason || (postPago.isPending ? "Registrando..." : null)
        }
        continueLabel={postPago.isPending ? "Registrando…" : "Registrar pago"}
        onContinue={() => setOpenConfirmPayment(true)}
      >
        {/* Campos extra (Monto / Fecha / Referencia) */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <Input
              id="monto"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              max={saldoCuota}
              value={payloadPayment.monto}
              onChange={(e) => handleChangeEvent("monto", e)}
            />
            <div className="text-[11px] text-muted-foreground">
              Saldo de la cuota: {formattMonedaGT(saldoCuota)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia / Voucher (opcional)</Label>
            <Input
              id="referencia"
              value={payloadPayment.referencia}
              onChange={(e) => handleChangeEvent("referencia", e)}
              placeholder="OP-928374, Ticket, #Cheque…"
            />
          </div>
        </div>
      </PurchasePaymentFormDialog>
      <AdvancedDialog
        title="Confirmación de pago de cuota"
        description={confirmText} // 👈 string multilinea
        question="¿Seguro que deseas continuar?"
        open={openConfirmPayment}
        onOpenChange={setOpenConfirmPayment}
        confirmButton={{
          label: "Sí, continuar y registrar",
          onClick: handleRegistPayment,
          variant: "destructive",
          loading: postPago.isPending,
          loadingText: "Registrando datos...",
          disabled: !!extraDisableReason || postPago.isPending,
        }}
        cancelButton={{
          label: "Cancelar",
          disabled: postPago.isPending,
          onClick: () => setOpenConfirmPayment(false),
        }}
      />

      {/* Deshacer pago */}
      <AdvancedDialog
        title="Eliminación de registro de pago de cuota"
        description="Se eliminará el registro del pago y se revertirá el movimiento financiero si existiera. (El stock no se modifica)."
        question="¿Seguro que deseas continuar?"
        open={openDelete}
        onOpenChange={setOpenDelete}
        confirmButton={{
          label: "Sí, eliminar pago",
          onClick: () => handleDeletePayment(),
          loadingText: "Eliminando...",
          loading: deletePagoCuota.isPending,
          disabled: deletePagoCuota.isPending,
        }}
        cancelButton={{
          disabled: deletePagoCuota.isPending,
          label: "Cancelar",
          loadingText: "Cancelando...",
          onClick: () => {
            setOpenDelete(false);
            setCuotaSeleccionada(null);
          },
        }}
      />

      <CostosAsociadosDialog
        open={openCostoDialog}
        onOpenChange={(v) => {
          setOpenCostoDialog(v);
          if (!v && !costoStepDone && picked.length > 0) {
            // si cerró sin confirmar y SÍ había ítems, permitimos seguir sin costo/prorrateo
            // (flujo: recepción sin costo adicional)
            setMfDraft(null);
            setProrrateoMeta(null);
            // abrimos el pago
            if (cuotaSeleccionada) {
              setPayloadPayment((prev) => ({
                ...prev,
                documentoId,
                monto: toAmountString(
                  cuotaSeleccionada.saldo ?? cuotaSeleccionada.monto ?? 0
                ),
                fechaPago: dayjs().format("YYYY-MM-DD"),
                metodoPago: "EFECTIVO",
                observaciones: "",
                referencia: "",
              }));
              resetPaymentState();
              setOpenPay(true);
            }
          }
        }}
        sucursalId={sucursalId}
        proveedorId={
          undefined /* si no lo tienes aquí, déjalo undefined y que el server resuelva por compra */
        }
        compraId={compraId}
        compraSubtotal={
          // opcional: un estimado para mostrar en el diálogo
          Array.isArray(products)
            ? products.reduce(
                (acc, r) =>
                  acc + Number(r.costoUnitario || 0) * Number(r.cantidad || 0),
                0
              )
            : undefined
        }
        // mapea tus cajas/cuentas a las opciones que espera el dialog
        cajasDisponibles={(cajasDisponibles ?? []).map((c) => ({
          id: c.id,
          label: `Caja #${c.id} · Disponible ${formattMonedaGT(
            c.disponibleEnCaja
          )}`,
          disponibleEnCaja: Number(c.disponibleEnCaja),
        }))}
        cuentasBancarias={(cuentasBancarias ?? []).map((c) => ({
          id: c.id,
          nombre: c.nombre,
        }))}
        onSubmit={({ mf, prorrateo }) => {
          setMfDraft(mf);
          setProrrateoMeta(prorrateo);
          setCostoStepDone(true);
          setOpenCostoDialog(false);

          // ahora sí abrimos el diálogo de pago con defaults
          if (cuotaSeleccionada) {
            setPayloadPayment((prev) => ({
              ...prev,
              documentoId,
              monto: toAmountString(
                cuotaSeleccionada.saldo ?? cuotaSeleccionada.monto ?? 0
              ),
              fechaPago: dayjs().format("YYYY-MM-DD"),
              metodoPago: "EFECTIVO",
              observaciones: "",
              referencia: "",
            }));
            resetPaymentState();
            setOpenPay(true);
          }
        }}
      />
    </div>
  );
}

// -----------------------------------------
// Lista de pagos (igual que tenías)
// -----------------------------------------
function PagosList({ pagos }: { pagos: UIPagoEnCuota[] }) {
  if (!Array.isArray(pagos) || pagos.length === 0) return null;
  return (
    <div className="space-y-2">
      {pagos.map((p) => {
        const f = dayjs(p.fechaPagoISO).format("DD MMM YYYY");
        return (
          <div key={p.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <ReceiptText className="h-4 w-4" />
                <span className="font-medium">{formattMonedaGT(p.monto)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock4 className="h-3.5 w-3.5" /> {f}
                </span>
                {p.metodoPago ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5" /> {p.metodoPago}
                  </span>
                ) : null}
                {p.referencia ? (
                  <span className="inline-flex items-center gap-1.5">
                    <ReceiptText className="h-3.5 w-3.5" /> Ref: {p.referencia}
                  </span>
                ) : null}
              </div>
            </div>

            {(p.observaciones || p.movimiento || p.registradoPor) && (
              <Separator className="my-2" />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              {p.observaciones ? (
                <div className="rounded-md bg-muted p-2">{p.observaciones}</div>
              ) : null}

              {p.movimiento ? (
                <div className="rounded-md border p-2">
                  <div className="font-medium mb-1">Movimiento</div>
                  <div className="space-y-0.5">
                    {typeof p.movimiento.deltaBanco === "number" &&
                      p.movimiento.deltaBanco !== 0 && (
                        <div className="flex justify-between">
                          <span>Banco:</span>
                          <span>
                            {formattMonedaGT(p.movimiento.deltaBanco)}
                          </span>
                        </div>
                      )}
                    {typeof p.movimiento.deltaCaja === "number" &&
                      p.movimiento.deltaCaja !== 0 && (
                        <div className="flex justify-between">
                          <span>Caja:</span>
                          <span>{formattMonedaGT(p.movimiento.deltaCaja)}</span>
                        </div>
                      )}
                    {p.movimiento.motivo ? (
                      <div className="flex justify-between">
                        <span>Motivo:</span>
                        <span className="truncate">{p.movimiento.motivo}</span>
                      </div>
                    ) : null}
                    {p.movimiento.clasificacion ? (
                      <div className="flex justify-between">
                        <span>Clasif.:</span>
                        <span className="truncate">
                          {p.movimiento.clasificacion}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {p.registradoPor ? (
                <div className="rounded-md border p-2">
                  <div className="font-medium mb-1">Registrado por</div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>Nombre:</span>
                      <span className="truncate">
                        {p.registradoPor.nombre ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correo:</span>
                      <span className="truncate">
                        {p.registradoPor.correo ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rol:</span>
                      <span className="truncate">
                        {p.registradoPor.rol ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MapCuotasCreditoCompra;
