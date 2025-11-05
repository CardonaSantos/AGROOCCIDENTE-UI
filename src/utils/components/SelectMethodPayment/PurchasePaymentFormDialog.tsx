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
import { cn } from "@/lib/utils";

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
  //--->
  /** 'IN' (entrada de dinero) | 'OUT' (salida). Afecta validaciones de caja. */
  flow?: "IN" | "OUT";
  /** Layout del contenido: vertical (default) o dos columnas */
  layout?: "vertical" | "two-column";
  /** Clase extra para el <DialogContent/> (p.ej. max width) */
  contentClassName?: string;
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
    //nuevo
    contentClassName,
    flow = "OUT",
    layout = "vertical",
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

  // Para ENTRADA (flow='IN') no validamos saldo de caja
  const cajaTieneSaldo = isCashMethod
    ? flow === "OUT"
      ? !!selectedCaja &&
        Number(selectedCaja.disponibleEnCaja) >= Number(montoRecepcion)
      : !!selectedCaja // IN: basta con seleccionar caja
    : true;

  const algunaCajaConSaldo = React.useMemo(() => {
    if (flow === "IN") return (cajasDisponibles ?? []).length > 0; // IN: cualquier caja abierta
    return (cajasDisponibles ?? []).some(
      (c) => Number(c.disponibleEnCaja) >= Number(montoRecepcion)
    );
  }, [cajasDisponibles, montoRecepcion, flow]);

  const canContinue =
    !extraDisableReason &&
    (!requireObservaciones || !!observaciones.trim()) &&
    (!requireProveedor || !!proveedorSelected) &&
    !!metodoPago &&
    (!isBankMethod || !!cuentaBancariaSelected) &&
    (!isCashMethod || (!!cajaSelected && cajaTieneSaldo)); // cajaTieneSaldo ya contempla flow

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // antes: "sm:max-w-md"
          "sm:max-w-2xl md:max-w-3xl lg:max-w-5xl", // ➜ ancho horizontal
          contentClassName
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            layout === "two-column" ? "grid md:grid-cols-2 gap-6" : "space-y-4"
          )}
        >
          {/* Columna izquierda: children + observaciones */}
          <div className="space-y-4">
            {children}

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
          </div>

          {/* Columna derecha: método + caja/banco + mensajes + footer */}
          <div className="space-y-4">
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
                      ? optionsCajas.find((o) => o.value === cajaSelected) ??
                        null
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

                {/* Mensajes según flujo */}
                {flow === "OUT" && cajaSelected && !cajaTieneSaldo && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    La caja seleccionada no tiene saldo suficiente para{" "}
                    {formatMoney(montoRecepcion)}.
                  </p>
                )}
                {flow === "OUT" && !algunaCajaConSaldo && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Ninguna caja abierta tiene saldo suficiente. Cambie a método
                    bancario o abra un turno.
                  </p>
                )}
                {flow === "IN" && cajaSelected && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Este pago ingresará {formatMoney(montoRecepcion)} a la caja
                    seleccionada.
                  </p>
                )}
              </div>
            )}

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
                    Requerida para {(metodoPago || "").toString().toLowerCase()}
                    .
                  </p>
                )}
              </div>
            )}

            {extraDisableReason && (
              <p className="text-[12px] text-amber-600">{extraDisableReason}</p>
            )}

            {/* Footer (columna derecha) */}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={onContinue} disabled={!canContinue}>
                {continueLabel}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function providerValue(v: string | undefined): string {
  return typeof v === "string" ? v : "";
}
