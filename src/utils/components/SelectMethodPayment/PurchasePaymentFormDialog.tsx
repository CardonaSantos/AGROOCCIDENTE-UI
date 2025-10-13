// utils/components/SelectMethodPayment/PurchasePaymentFormDialog.tsx
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactSelect from "react-select";

export type MetodoPago =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "TARJETA"
  | "CHEQUE"
  | "CREDITO"
  | "OTRO"
  | "CONTADO";

export type MetodoPagoOption = {
  value: MetodoPago;
  label: string;
  /** CAJA => requiere caja | BANCO => requiere cuenta bancaria | NINGUNO => no requiere nada */
  canal: "CAJA" | "BANCO" | "NINGUNO";
};

export interface CajaConSaldo {
  id: number;
  fechaApertura: string;
  estado: string;
  actualizadoEn: string;
  saldoInicial: number;
  usuarioInicioId: number;
  disponibleEnCaja: number;
}

export interface SimpleOption {
  label: string;
  value: string;
}

const DEFAULT_METODO_PAGO: MetodoPagoOption[] = [
  { value: "EFECTIVO", label: "Efectivo", canal: "CAJA" },
  { value: "TRANSFERENCIA", label: "Transferencia/Depósito", canal: "BANCO" },
  { value: "TARJETA", label: "Tarjeta", canal: "BANCO" },
  { value: "CHEQUE", label: "Cheque", canal: "BANCO" },
];

export type PurchasePaymentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;
  description?: string;

  // Data
  proveedores: Array<{ id: number; nombre: string }>;
  cuentasBancarias: Array<{ id: number; nombre: string }>;
  cajasDisponibles: CajaConSaldo[];

  // Monto a validar contra caja (para saldo suficiente)
  montoRecepcion: number;
  // Formateador de dinero (e.g., formattMonedaGT)
  formatMoney: (n: number | string) => string;

  // Opciones de método de pago (override)
  metodoPagoOptions?: MetodoPagoOption[];

  // State controlado (padre)
  observaciones: string;
  setObservaciones: (v: string) => void;

  proveedorSelected: string | undefined;
  setProveedorSelected: (v: string | undefined) => void;

  metodoPago: MetodoPago | "";
  setMetodoPago: (v: MetodoPago | "") => void;

  cuentaBancariaSelected: string;
  setCuentaBancariaSelected: (v: string) => void;

  cajaSelected: string | null;
  setCajaSelected: (v: string | null) => void;

  // Validaciones/visibilidad
  requireObservaciones?: boolean; // default true
  showObservaciones?: boolean; // default true
  requireProveedor?: boolean; // default true
  showProveedor?: boolean; // default true

  // Continuar
  onContinue: () => void;
  continueLabel?: string;

  // Deshabilitador externo (muestra un texto de razón)
  extraDisableReason?: string | null;

  // Slot para campos adicionales (ej: Monto/Fecha/Referencia)
  children?: React.ReactNode;
};

export default function PurchasePaymentFormDialog(
  props: PurchasePaymentFormDialogProps
) {
  const {
    open,
    onOpenChange,
    title = "Preparar envío a stock",
    description = "Complete la información necesaria antes de confirmar.",
    proveedores,
    cuentasBancarias,
    cajasDisponibles,
    montoRecepcion,
    formatMoney,
    metodoPagoOptions = DEFAULT_METODO_PAGO,
    observaciones,
    setObservaciones,
    proveedorSelected,
    setProveedorSelected,
    metodoPago, // ✅ controlado
    setMetodoPago, // ✅ controlado
    cuentaBancariaSelected,
    setCuentaBancariaSelected,
    cajaSelected,
    setCajaSelected,
    requireObservaciones = true,
    showObservaciones = true,
    requireProveedor = true,
    showProveedor = true,
    onContinue,
    continueLabel = "Continuar",
    extraDisableReason = null,
    children,
  } = props;

  const metodoDef = React.useMemo(
    () => metodoPagoOptions.find((m) => m.value === metodoPago),
    [metodoPago, metodoPagoOptions]
  );

  const isBankMethod = metodoDef?.canal === "BANCO";
  const isCashMethod = metodoDef?.canal === "CAJA" || metodoPago === "CONTADO";

  // Reset dependientes al cambiar el método
  React.useEffect(() => {
    if (!isBankMethod && cuentaBancariaSelected) setCuentaBancariaSelected("");
  }, [isBankMethod, cuentaBancariaSelected, setCuentaBancariaSelected]);

  React.useEffect(() => {
    if (!isCashMethod && cajaSelected) setCajaSelected(null);
  }, [isCashMethod, cajaSelected, setCajaSelected]);

  const optionsCajas: SimpleOption[] = React.useMemo(
    () =>
      (cajasDisponibles ?? []).map((c) => ({
        label: `Caja #${c.id} · Inicial ${formatMoney(
          c.saldoInicial
        )} · Disponible ${formatMoney(c.disponibleEnCaja)}`,
        value: String(c.id),
      })),
    [cajasDisponibles, formatMoney]
  );

  const selectedCaja = React.useMemo(
    () =>
      cajaSelected
        ? cajasDisponibles.find((c) => String(c.id) === String(cajaSelected))
        : undefined,
    [cajaSelected, cajasDisponibles]
  );

  const cajaTieneSaldo = isCashMethod
    ? !!selectedCaja &&
      Number(selectedCaja.disponibleEnCaja) >= Number(montoRecepcion)
    : true;

  const algunaCajaConSaldo = React.useMemo(
    () =>
      (cajasDisponibles ?? []).some(
        (c) => Number(c.disponibleEnCaja) >= Number(montoRecepcion)
      ),
    [cajasDisponibles, montoRecepcion]
  );

  const canContinue =
    !extraDisableReason &&
    (!requireObservaciones || !!observaciones.trim()) &&
    (!requireProveedor || !!proveedorSelected) &&
    !!metodoPago &&
    (!isBankMethod || !!cuentaBancariaSelected) &&
    (!isCashMethod || (!!cajaSelected && cajaTieneSaldo));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Slot para campos extra (Monto/Fecha/Referencia) */}
          {children}

          {/* Observaciones */}
          {showObservaciones && (
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                placeholder="Observaciones acerca de esta operación"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
              {requireObservaciones && !observaciones.trim() && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Requerido para continuar.
                </p>
              )}
            </div>
          )}

          {/* Proveedor (opcional) */}
          {showProveedor && (
            <div className="space-y-2">
              <Label htmlFor="proveedor">Seleccionar Proveedor</Label>
              <Select
                value={providerValue(proveedorSelected)}
                onValueChange={setProveedorSelected as (v: string) => void}
              >
                <SelectTrigger id="proveedor">
                  <SelectValue placeholder="Seleccione un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {(proveedores ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {requireProveedor && !proveedorSelected && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Requerido para continuar.
                </p>
              )}
            </div>
          )}

          {/* Método de pago */}
          <div className="space-y-2">
            <Label htmlFor="metodPago">Método de pago</Label>
            <Select
              value={metodoPago}
              onValueChange={(v) => setMetodoPago(v as MetodoPago)}
            >
              <SelectTrigger id="metodPago">
                <SelectValue placeholder="Seleccione un método de pago" />
              </SelectTrigger>
              <SelectContent>
                {metodoPagoOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!metodoPago && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Requerido para continuar.
              </p>
            )}
          </div>

          {/* Caja (efectivo / contado) */}
          {isCashMethod && (
            <div className="space-y-2">
              <Label>Seleccionar caja (saldo disponible)</Label>
              <ReactSelect
                options={optionsCajas}
                onChange={(opt) =>
                  setCajaSelected(opt ? (opt as SimpleOption).value : null)
                }
                value={
                  cajaSelected
                    ? optionsCajas.find((o) => o.value === cajaSelected) ?? null
                    : null
                }
                isClearable
                isSearchable
                className="text-black"
                placeholder="Seleccione una caja a asignar"
              />
              {!cajaSelected && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Seleccione una caja para pagos en efectivo.
                </p>
              )}
              {cajaSelected && !cajaTieneSaldo && (
                <p className="text-[11px] text-amber-600 mt-1">
                  La caja seleccionada no tiene saldo suficiente para{" "}
                  {formatMoney(montoRecepcion)}.
                </p>
              )}
              {!algunaCajaConSaldo && (
                <p className="text-[11px] text-amber-600 mt-1">
                  Ninguna caja abierta tiene saldo suficiente. Cambie a método
                  bancario o abra un turno.
                </p>
              )}
            </div>
          )}

          {/* Banco (transferencia / tarjeta / cheque) */}
          {isBankMethod && (
            <div className="space-y-2">
              <Label htmlFor="cuentaBancaria">
                Cuenta Bancaria (requerida por método)
              </Label>
              <Select
                value={cuentaBancariaSelected}
                onValueChange={setCuentaBancariaSelected}
              >
                <SelectTrigger id="cuentaBancaria">
                  <SelectValue placeholder="Seleccione una cuenta bancaria" />
                </SelectTrigger>
                <SelectContent>
                  {(cuentasBancarias ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!cuentaBancariaSelected && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Requerida para {(metodoPago || "").toString().toLowerCase()}.
                </p>
              )}
            </div>
          )}

          {/* Mensaje de bloqueo externo */}
          {extraDisableReason && (
            <p className="text-[12px] text-amber-600">{extraDisableReason}</p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onContinue} disabled={!canContinue}>
              {continueLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function providerValue(v: string | undefined): string {
  return typeof v === "string" ? v : "";
}
