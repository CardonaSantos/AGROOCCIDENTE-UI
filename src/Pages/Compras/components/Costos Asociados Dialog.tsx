import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Tipos/enums necesarios
import { MetodoPagoMainPOS } from "@/Pages/POS/interfaces/methodPayment";
import {
  ClasificacionAdmin,
  CostoVentaTipo,
  MotivoMovimiento,
} from "@/Pages/Caja/Movimientos/movimientos-financieros";
import {
  CajaConSaldoOption,
  CostosAsociadosDialogResult,
  CuentaBancariaOption,
  MovimientoFinancieroDraft,
  ProrrateoMeta,
} from "../CostoAsociadoTypes";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  // Contexto
  sucursalId: number;
  proveedorId?: number;
  compraId?: number;
  compraSubtotal?: number;

  // Fuentes de selección
  cajasDisponibles?: CajaConSaldoOption[];
  cuentasBancarias?: CuentaBancariaOption[];

  // Defaults
  defaultMetodoPago?: MetodoPagoMainPOS | "";

  // Resultado
  onSubmit: (result: CostosAsociadosDialogResult) => void;

  className?: string;
};

// Helpers mínimos
const isBank = (m?: MetodoPagoMainPOS | "") =>
  m === "TRANSFERENCIA" || m === "TARJETA" || m === "CHEQUE";
const isCash = (m?: MetodoPagoMainPOS | "") =>
  m === "EFECTIVO" || m === "CONTADO";

const METODO_PAGO_OPTIONS: { value: MetodoPagoMainPOS; label: string }[] = [
  { value: MetodoPagoMainPOS.EFECTIVO, label: "Efectivo" },
  { value: MetodoPagoMainPOS.TRANSFERENCIA, label: "Transferencia" },
  { value: MetodoPagoMainPOS.TARJETA, label: "Tarjeta" },
  { value: MetodoPagoMainPOS.CHEQUE, label: "Cheque" },
  { value: MetodoPagoMainPOS.OTRO, label: "Otro" },
];

export function CostosAsociadosDialog({
  open,
  onOpenChange,
  sucursalId,
  proveedorId,
  compraId,
  compraSubtotal,
  cajasDisponibles = [],
  cuentasBancarias = [],
  defaultMetodoPago = MetodoPagoMainPOS.EFECTIVO,
  onSubmit,
  className,
}: Props) {
  // --- Inputs vigentes ---
  const [monto, setMonto] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState<MetodoPagoMainPOS | "">(
    defaultMetodoPago
  );
  const [descripcion, setDescripcion] = useState<string>("");

  // Dependientes de método
  const [cuentaBancariaId, setCuentaBancariaId] = useState<string>("");
  const [registroCajaId, setRegistroCajaId] = useState<string>("");

  // Prorrateo (único switch visible)
  const [aplicarProrrateo, setAplicarProrrateo] = useState<boolean>(true);

  // Prefill de descripción simplificado (solo costo asociado)
  useEffect(() => {
    const ref = compraId ? ` compra #${compraId}` : "";
    setDescripcion(`Costo asociado (FLETE)${ref}`.trim());
  }, [compraId]);

  const requiereBanco = isBank(metodoPago || undefined);
  const requiereCaja = isCash(metodoPago || undefined);

  const canSave = useMemo(() => {
    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) return false;
    if (!metodoPago) return false;
    if (requiereBanco && !cuentaBancariaId) return false;
    if (requiereCaja && !registroCajaId) return false;
    if (descripcion.trim().length === 0) return false;
    return true;
  }, [
    monto,
    metodoPago,
    requiereBanco,
    requiereCaja,
    cuentaBancariaId,
    registroCajaId,
    descripcion,
  ]);

  const handleConfirm = () => {
    const montoNum = Number(monto);

    // Valores fijos (ya no exponemos controles para esto)
    const motivo: MotivoMovimiento = "COSTO_ASOCIADO";
    const clasificacionAdmin: ClasificacionAdmin = "COSTO_VENTA";
    const costoVentaTipo: CostoVentaTipo = "FLETE";

    const mf: MovimientoFinancieroDraft = {
      sucursalId,
      proveedorId,
      motivo,
      clasificacionAdmin,
      metodoPago: (metodoPago || "EFECTIVO") as MetodoPagoMainPOS,
      descripcion: descripcion.trim(),
      afectaInventario: true,
      monto: Number(montoNum.toFixed(2)),
      costoVentaTipo,
      cuentaBancariaId: requiereBanco ? Number(cuentaBancariaId) : undefined,
      registroCajaId: requiereCaja ? Number(registroCajaId) : undefined,
    };

    // Prorrateo simplificado: base fija "COSTO" e incluirAntiguos=false
    const pr: ProrrateoMeta = {
      aplicar: aplicarProrrateo,
      base: "COSTO",
      incluirAntiguos: false,
    };

    onSubmit({ mf, prorrateo: pr });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-2xl md:max-w-3xl", className)}>
        <DialogHeader>
          <DialogTitle>Registrar costo asociado</DialogTitle>
          <DialogDescription>
            Este movimiento distribuirá el costo entre los productos de la
            compra (prorrateo).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monto */}
          <div className="space-y-1.5">
            <Label>Monto a registrar</Label>
            <Input
              inputMode="decimal"
              pattern="^[0-9]+([.,][0-9]{1,2})?$"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(",", "."))}
            />
            {typeof compraSubtotal === "number" && (
              <p className="text-[11px] text-muted-foreground">
                Subtotal de la compra: Q{Number(compraSubtotal).toFixed(2)}
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <Select
              value={metodoPago as string}
              onValueChange={(v) => setMetodoPago(v as MetodoPagoMainPOS)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un método" />
              </SelectTrigger>
              <SelectContent>
                {METODO_PAGO_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Caja (si efectivo/contado) */}
          {isCash(metodoPago || undefined) && (
            <div className="space-y-1.5">
              <Label>Asignar caja</Label>
              <Select value={registroCajaId} onValueChange={setRegistroCajaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una caja" />
                </SelectTrigger>
                <SelectContent>
                  {cajasDisponibles.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.label ?? `Caja #${c.id}`} · Disponible: Q
                      {Number(c.disponibleEnCaja).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Banco (si transferencia/tarjeta/cheque) */}
          {isBank(metodoPago || undefined) && (
            <div className="space-y-1.5">
              <Label>Cuenta bancaria</Label>
              <Select
                value={cuentaBancariaId}
                onValueChange={setCuentaBancariaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentasBancarias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Descripción */}
          <div className="md:col-span-2 space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Flete interno Huehuetenango → Tienda Central"
            />
          </div>

          {/* Switch Prorrateo */}
          <div className="md:col-span-2 border rounded-md p-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-0.5">
                <Label>Aplicar prorrateo a esta compra</Label>
                <p className="text-[11px] text-muted-foreground">
                  Distribuye este costo entre los productos de la compra.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={aplicarProrrateo}
                  onCheckedChange={setAplicarProrrateo}
                />
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="md:col-span-2">
            <Separator className="my-2" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                No aplicar
              </Button>
              <Button onClick={handleConfirm} disabled={!canSave}>
                Registrar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CostosAsociadosDialog;
