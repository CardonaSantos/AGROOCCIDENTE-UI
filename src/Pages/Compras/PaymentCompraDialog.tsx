import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactSelectComponent from "react-select";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { CajaConSaldo } from "./compra-detalle";
type MetodoPago =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "TARJETA"
  | "CHEQUE"
  | "CREDITO"
  | "OTRO"
  | "CONTADO";

const METODO_PAGO_OPTIONS = [
  { value: "EFECTIVO" as const, label: "Efectivo", canal: "CAJA" as const },
  {
    value: "TRANSFERENCIA" as const,
    label: "Transferencia/Depósito",
    canal: "BANCO" as const,
  },
  { value: "TARJETA" as const, label: "Tarjeta", canal: "BANCO" as const },
  { value: "CHEQUE" as const, label: "Cheque", canal: "BANCO" as const },
];

interface Option {
  label: string;
  value: string;
}

interface PropsDialog {
  openFormPaymentDialog: boolean;
  setOpenFormPaymentDialog: React.Dispatch<React.SetStateAction<boolean>>;
  // helpers
  isBankMethod: (
    m?: "" | MetodoPago
  ) => m is "TRANSFERENCIA" | "TARJETA" | "CHEQUE";
  isCashMethod: (m?: "" | MetodoPago) => m is "EFECTIVO" | "CONTADO";
  // form state
  observaciones: string;
  setObservaciones: React.Dispatch<React.SetStateAction<string>>;
  proveedorSelected: string | undefined;
  setProveedorSelected: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;
  metodoPago: "" | MetodoPago;
  setMetodoPago: React.Dispatch<React.SetStateAction<"" | MetodoPago>>;
  // caja/banco
  optionsCajas: Option[];
  handleSelectCaja: (option: Option | null) => void;
  cajaSelected: string | null;
  setCajaSelected: React.Dispatch<React.SetStateAction<string | null>>;
  cajaTieneSaldo: boolean;
  montoRecepcion: number;
  cajasDisponibles: CajaConSaldo[];
  cuentaBancariaSelected: string;
  setCuentaBancariaSelected: React.Dispatch<React.SetStateAction<string>>;
  cuentasBancarias: { id: number; nombre: string }[];
  // UX
  canContinue: boolean;
  onContinue: () => void; // ✅ NUEVO
  proveedores: {
    id: number;
    nombre: string;
  }[];
}

function PaymentMethodCompraDialogConfirm({
  openFormPaymentDialog,
  setOpenFormPaymentDialog,

  isBankMethod,
  isCashMethod,

  observaciones,
  setObservaciones,
  proveedorSelected,
  setProveedorSelected,

  proveedores,

  metodoPago,
  setMetodoPago,
  optionsCajas,
  handleSelectCaja,
  cajaSelected,
  cajaTieneSaldo,
  montoRecepcion,
  cajasDisponibles,
  cuentaBancariaSelected,
  setCuentaBancariaSelected,
  cuentasBancarias,
  canContinue,
  onContinue, // ✅ NUEVO
}: PropsDialog) {
  return (
    <Dialog
      open={openFormPaymentDialog}
      onOpenChange={setOpenFormPaymentDialog}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preparar envío a stock</DialogTitle>
          <DialogDescription>
            Complete la información necesaria antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder="Observaciones acerca de la recepción de esta compra"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
            />
          </div>

          {/* Proveedor */}
          <div className="space-y-2">
            <Label htmlFor="proveedor">Seleccionar Proveedor</Label>
            <Select
              value={proveedorSelected}
              onValueChange={setProveedorSelected}
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
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label htmlFor="metodPago">Método de pago</Label>
            <Select
              value={metodoPago}
              onValueChange={(v) => setMetodoPago(v as MetodoPago)}
            >
              <SelectTrigger id="metodPago">
                <SelectValue placeholder="Seleccione un método de pago compra" />
              </SelectTrigger>
              <SelectContent>
                {METODO_PAGO_OPTIONS.map((opt) => (
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

          {/* Caja */}
          {isCashMethod(metodoPago) && (
            <div className="space-y-2">
              <Label>Seleccionar caja (saldo disponible)</Label>
              <ReactSelectComponent
                options={optionsCajas}
                onChange={handleSelectCaja}
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
                  {formattMonedaGT(montoRecepcion)}.
                </p>
              )}
              {!cajasDisponibles.some(
                (c) => Number(c.disponibleEnCaja) >= montoRecepcion
              ) && (
                <p className="text-[11px] text-amber-600 mt-1">
                  ` Ninguna caja abierta tiene saldo suficiente ($
                  {montoRecepcion}). Cambie a método bancario o abra un turno. `
                </p>
              )}
            </div>
          )}

          {/* Banco */}
          {isBankMethod(metodoPago) && (
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
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!cuentaBancariaSelected && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Requerida para {metodoPago?.toLowerCase()}.
                </p>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenFormPaymentDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={onContinue} disabled={!canContinue}>
              Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentMethodCompraDialogConfirm;
