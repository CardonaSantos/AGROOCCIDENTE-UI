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
import { useApiMutation } from "@/hooks/genericoCall/genericoCallHook";
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
} from "lucide-react";

import PurchasePaymentFormDialog, {
  MetodoPago,
  MetodoPagoOption,
  CajaConSaldo,
} from "@/utils/components/SelectMethodPayment/PurchasePaymentFormDialog";

import { useQueryClient } from "@tanstack/react-query";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("es");

// -----------------------------------------
// Tipos y Props
// -----------------------------------------
type CuentaBancaria = { id: number; nombre: string };
type ProveedorLite = { id: number; nombre: string };

interface PropsCuotas {
  cuotas: UICuota[];
  handleRefresAll: () => void;
  userId: number;
  documentoId: number;
  sucursalId: number;
  cajasDisponibles: CajaConSaldo[];

  // NUEVO (opcional): si ya los tenés arriba en el árbol pásalos aquí
  cuentasBancarias?: CuentaBancaria[];
  proveedores?: ProveedorLite[];
}

// -----------------------------------------
// Helpers UI
// -----------------------------------------

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

// -----------------------------------------
// Normalización (UI -> backend)
// -----------------------------------------
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
  ) {
    return v as any;
  }
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

// Mapea método -> canal
const metodoPagoOptions: MetodoPagoOption[] = [
  { value: "EFECTIVO", label: "Efectivo", canal: "CAJA" },
  { value: "TRANSFERENCIA", label: "Transferencia/Depósito", canal: "BANCO" },
  { value: "TARJETA", label: "Tarjeta", canal: "BANCO" },
  { value: "CHEQUE", label: "Cheque", canal: "BANCO" },
  // si usás CONTADO en UI:
  // { value: "CONTADO",       label: "Contado",               canal: "CAJA" },
];

// -----------------------------------------
// Componente principal
// -----------------------------------------
function MapCuotasCreditoCompra({
  cuotas,
  handleRefresAll,
  userId,
  documentoId,
  sucursalId,
  cajasDisponibles,
  cuentasBancarias = [],
  proveedores = [],
}: PropsCuotas) {
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<UICuota | null>(
    null
  );

  const [payloadPayment, setPayloadPayment] = useState<PagoCxPPayload>({
    documentoId,
    metodoPago: "EFECTIVO",
    monto: "",
    registradoPorId: userId,
    fechaPago: "",
    observaciones: "",
    referencia: "",
  });

  const [cuentaBancariaSelected, setCuentaBancariaSelected] =
    useState<string>("");
  const [cajaSelected, setCajaSelected] = useState<string | null>(null);

  // Si necesitás cumplir con el contract del util aunque no muestres proveedor:
  const [proveedorSelected, setProveedorSelected] = useState<
    string | undefined
  >(undefined);

  const { mutateAsync, isPending: isLoading } = useApiMutation(
    "post",
    "/compras-pagos-creditos/"
  );

  const saldoCuota = useMemo(
    () => cuotaSeleccionada?.saldo ?? cuotaSeleccionada?.monto ?? 0,
    [cuotaSeleccionada]
  );

  // Canal segun metodo actual
  const metodoDef = useMemo(
    () =>
      metodoPagoOptions.find(
        (m) => m.value === (payloadPayment.metodoPago as MetodoPago)
      ),
    [payloadPayment.metodoPago]
  );
  const isBankMethod = metodoDef?.canal === "BANCO";
  const isCashMethod =
    metodoDef?.canal === "CAJA" || payloadPayment.metodoPago === "CONTADO";

  // Validaciones monto/fecha -> se usan para extraDisableReason
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

  // Handlers
  const handleOpenDialog = (cuota: UICuota) => {
    setCuotaSeleccionada(cuota);
    setPayloadPayment((prev) => ({
      ...prev,
      documentoId,
      monto: toAmountString(cuota.saldo ?? cuota.monto ?? 0),
      fechaPago: dayjs().format("YYYY-MM-DD"),
      metodoPago: "EFECTIVO",
      observaciones: "",
      referencia: "",
    }));
    setCuentaBancariaSelected("");
    setCajaSelected(null);
    setOpen(true);
  };

  const handleChangeEvent = <K extends keyof PagoCxPPayload>(
    keyName: K,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    setPayloadPayment((prev) => ({
      ...prev,
      [keyName]: newValue as any,
    }));
  };

  const handleRegistPayment = async () => {
    if (!cuotaSeleccionada) return;

    const body = {
      documentoId,
      cuotaId: cuotaSeleccionada.id,
      registradoPorId: userId,
      metodoPago: normalizeMetodoPagoUIToBackend(
        String(payloadPayment.metodoPago)
      ),
      monto: toAmountString(payloadPayment.monto || 0),
      fechaPago: ymdToISO(payloadPayment.fechaPago || undefined),
      observaciones: payloadPayment.observaciones?.trim() || undefined,
      referencia: payloadPayment.referencia?.trim() || undefined,
      expectedCuotaSaldo: toAmountString(cuotaSeleccionada.saldo ?? 0),
      sucursalId,

      // NUEVO: asocia caja o cuenta según el método seleccionado
      cajaId: isCashMethod && cajaSelected ? Number(cajaSelected) : undefined,
      cuentaBancariaId:
        isBankMethod && cuentaBancariaSelected
          ? Number(cuentaBancariaSelected)
          : undefined,
    };

    try {
      await toast.promise(mutateAsync(body), {
        success: "Pago de cuota registrado",
        error: (e) => getApiErrorMessageAxios(e),
        loading: "Registrando pago...",
      });

      qc.invalidateQueries({ queryKey: ["credito-from-compra"] });
      await handleRefresAll?.();

      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  console.log("Payload de: ", payloadPayment);
  console.log("El cuentaBancariaSelected es: ", cuentaBancariaSelected);

  if (!Array.isArray(cuotas) || cuotas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay cuotas disponibles.
      </p>
    );
  }

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
                    onClick={() => handleOpenDialog(c)}
                    className="gap-1.5"
                  >
                    <ReceiptText className="h-4 w-4" />
                    {isPayed ? "Pagada" : "Pagar cuota"}
                  </Button>
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

      {/* Dialog reutilizable */}
      <PurchasePaymentFormDialog
        open={open}
        onOpenChange={setOpen}
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
        // Control del estado desde el padre:
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
        // Para pagos de cuota: no requerimos proveedor ni observaciones
        showProveedor={false}
        requireProveedor={false}
        showObservaciones={true}
        requireObservaciones={false}
        // Bloqueo extra por validaciones locales (monto/fecha)
        extraDisableReason={
          extraDisableReason || (isLoading ? "Registrando..." : null)
        }
        continueLabel={isLoading ? "Registrando…" : "Registrar pago"}
        onContinue={handleRegistPayment}
      >
        {/* ---- Campos extra (Monto / Fecha / Referencia) ---- */}
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
            <Label htmlFor="fechaPago">Fecha de pago</Label>
            <Input
              id="fechaPago"
              type="date"
              value={payloadPayment.fechaPago}
              onChange={(e) => handleChangeEvent("fechaPago", e)}
            />
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
    </div>
  );
}

// -----------------------------------------
// Lista de pagos
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
