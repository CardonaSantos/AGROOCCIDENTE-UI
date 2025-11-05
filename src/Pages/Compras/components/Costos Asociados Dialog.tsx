import * as React from "react";
import { useMemo, useState } from "react";
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

// Enums/Tipos del frontend
import { MetodoPagoMainPOS } from "@/Pages/POS/interfaces/methodPayment";
import {
  ClasificacionAdmin,
  CostoVentaTipo,
  MotivoMovimiento,
} from "@/Pages/Caja/Movimientos/movimientos-financieros";

// ---------------------------------------------------------------------------
// Tipos de datos auxiliares
// ---------------------------------------------------------------------------
export type CajaConSaldoOption = {
  id: number;
  label?: string;
  saldoInicial?: number | string;
  disponibleEnCaja: number | string;
};

export type CuentaBancariaOption = {
  id: number;
  nombre: string;
};

// Payload que espera tu DTO: dto.mf
export interface MovimientoFinancieroDraft {
  sucursalId?: number;
  motivo: MotivoMovimiento; // COMPRA_MERCADERIA | COSTO_ASOCIADO
  clasificacionAdmin?: ClasificacionAdmin; // COSTO_VENTA (por defecto)
  metodoPago: MetodoPagoMainPOS;
  descripcion: string;
  proveedorId?: number;
  afectaInventario: boolean; // true → prorratea al costo de inventario
  monto: number; // Q
  costoVentaTipo: CostoVentaTipo; // MERCADERIA, FLETE, ENCOMIENDA, TRANSPORTE, OTROS
  cuentaBancariaId?: number;
  registroCajaId?: number;
}

// Metadatos opcionales de prorrateo (frontend → backend)
export interface ProrrateoMeta {
  aplicar: boolean;
  base: "COSTO" | "CANTIDAD"; // cómo distribuir el costo asociado
  incluirAntiguos?: boolean; // <= NUEVO
}

export interface CostosAsociadosDialogResult {
  mf: MovimientoFinancieroDraft;
  prorrateo?: ProrrateoMeta;
}

// ---------------------------------------------------------------------------
// Props del componente reutilizable
// ---------------------------------------------------------------------------
interface CostosAsociadosDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  // Contexto de compra (para autocompletar)
  compraId?: number;
  sucursalId: number;
  proveedorId?: number;
  compraSubtotal?: number; // útil para mostrar referencia

  // Selecciones externas
  cajasDisponibles?: CajaConSaldoOption[];
  cuentasBancarias?: CuentaBancariaOption[];

  // Valores por defecto
  defaultMetodoPago?: MetodoPagoMainPOS | "";
  defaultMotivo?: MotivoMovimiento | ""; // default: COSTO_ASOCIADO
  defaultCostoVentaTipo?: CostoVentaTipo | ""; // default: FLETE

  // Callback al confirmar
  onSubmit: (result: CostosAsociadosDialogResult) => void;

  // Control de UI
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const isBankMethod = (m?: MetodoPagoMainPOS | "") =>
  m === "TRANSFERENCIA" || m === "TARJETA" || m === "CHEQUE";
const isCashMethod = (m?: MetodoPagoMainPOS | "") =>
  m === "EFECTIVO" || m === "CONTADO";

const METODO_PAGO_OPTIONS: { value: MetodoPagoMainPOS; label: string }[] = [
  { value: MetodoPagoMainPOS.EFECTIVO, label: "Efectivo" },
  { value: MetodoPagoMainPOS.CONTADO, label: "Contado" },
  { value: MetodoPagoMainPOS.TRANSFERENCIA, label: "Transferencia" },
  { value: MetodoPagoMainPOS.TARJETA, label: "Tarjeta" },
  { value: MetodoPagoMainPOS.CHEQUE, label: "Cheque" },
  { value: MetodoPagoMainPOS.OTRO, label: "Otro" },
];

const MOTIVO_OPTIONS: { value: MotivoMovimiento; label: string }[] = [
  { value: "COSTO_ASOCIADO", label: "Costo asociado (prorrateable)" },
  { value: "COMPRA_MERCADERIA", label: "Compra mercadería" },
];

// ---------------------------------------------------------------------------
// Componente principal (layout horizontal compacto)
// ---------------------------------------------------------------------------
export function CostosAsociadosDialog({
  open,
  onOpenChange,
  compraId,
  sucursalId,
  proveedorId,
  compraSubtotal,
  cajasDisponibles = [],
  cuentasBancarias = [],
  defaultMetodoPago = MetodoPagoMainPOS.EFECTIVO,
  defaultMotivo = "COSTO_ASOCIADO",
  defaultCostoVentaTipo = "FLETE",
  onSubmit,
  className,
}: CostosAsociadosDialogProps) {
  const [motivo, setMotivo] = useState<MotivoMovimiento | "">(defaultMotivo);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoMainPOS | "">(
    defaultMetodoPago
  );
  const [costoVentaTipo, setCostoVentaTipo] = useState<CostoVentaTipo | "">(
    defaultCostoVentaTipo
  );
  const [monto, setMonto] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");

  // Bancos / Caja
  const [cuentaBancariaId, setCuentaBancariaId] = useState<string>("");
  const [registroCajaId, setRegistroCajaId] = useState<string>("");

  // Prorrateo
  const [aplicarProrrateo, setAplicarProrrateo] = useState<boolean>(true);
  const [baseProrrateo, setBaseProrrateo] = useState<"COSTO" | "CANTIDAD">(
    "COSTO"
  );
  const [incluirAntiguos, setIncluirAntiguos] = useState<boolean>(false); // <= NUEVO

  // Prefill de descripción
  React.useEffect(() => {
    const base =
      motivo === "COSTO_ASOCIADO" ? "Costo asociado" : "Compra mercadería";
    const tipo =
      motivo === "COSTO_ASOCIADO"
        ? costoVentaTipo || "FLETE"
        : ("MERCADERIA" as CostoVentaTipo);
    const ref = compraId ? ` compra #${compraId}` : "";
    setDescripcion(`${base} (${tipo?.toString()})${ref}`.trim());
  }, [motivo, costoVentaTipo, compraId]);

  const requiereBanco = isBankMethod(metodoPago || undefined);
  const requiereCaja = isCashMethod(metodoPago || undefined);

  const canSave = useMemo(() => {
    const montoNum = Number(monto);
    const hasMonto = Number.isFinite(montoNum) && montoNum > 0;
    const metodoOk = Boolean(metodoPago);
    const motivoOk = Boolean(motivo);

    if (requiereBanco && !cuentaBancariaId) return false;
    if (requiereCaja && !registroCajaId) return false;
    if (motivo === "COSTO_ASOCIADO" && !costoVentaTipo) return false;

    return hasMonto && metodoOk && motivoOk && descripcion.trim().length > 0;
  }, [
    monto,
    metodoPago,
    motivo,
    cuentaBancariaId,
    registroCajaId,
    costoVentaTipo,
    requiereBanco,
    requiereCaja,
    descripcion,
  ]);

  const handleConfirm = () => {
    const montoNum = Number(monto);
    const mf: MovimientoFinancieroDraft = {
      sucursalId,
      proveedorId,
      motivo: (motivo || "COSTO_ASOCIADO") as MotivoMovimiento,
      clasificacionAdmin: "COSTO_VENTA",
      metodoPago: (metodoPago || "EFECTIVO") as MetodoPagoMainPOS,
      descripcion: descripcion.trim(),
      afectaInventario: true,
      monto: Number(montoNum.toFixed(2)),
      costoVentaTipo:
        motivo === "COSTO_ASOCIADO"
          ? ((costoVentaTipo || "FLETE") as CostoVentaTipo)
          : ("MERCADERIA" as CostoVentaTipo),
      cuentaBancariaId: requiereBanco ? Number(cuentaBancariaId) : undefined,
      registroCajaId: requiereCaja ? Number(registroCajaId) : undefined,
    };

    const pr: ProrrateoMeta | undefined =
      motivo === "COSTO_ASOCIADO"
        ? { aplicar: aplicarProrrateo, base: baseProrrateo, incluirAntiguos } // <= NUEVO
        : undefined;

    onSubmit({ mf, prorrateo: pr });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-2xl md:max-w-3xl", className)}>
        <DialogHeader>
          <DialogTitle>Registrar gasto / costo asociado</DialogTitle>
          <DialogDescription>
            Este movimiento ajustará el costo de los productos (prorrateo) o
            registrará una compra de mercadería.
          </DialogDescription>
        </DialogHeader>

        {/* GRID HORIZONTAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Motivo */}
          <div className="space-y-1.5">
            <Label>Motivo del movimiento</Label>
            <Select
              value={motivo as string}
              onValueChange={(v) => setMotivo(v as MotivoMovimiento)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVO_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          {/* Tipo de costo-venta (si es costo asociado) */}
          {motivo === "COSTO_ASOCIADO" && (
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

                  <div
                    className={cn(
                      "min-w-[220px]",
                      !aplicarProrrateo && "opacity-50 pointer-events-none"
                    )}
                  >
                    <Label className="sr-only">Base de prorrateo</Label>
                    <Select
                      value={baseProrrateo}
                      onValueChange={(v) =>
                        setBaseProrrateo(v as "COSTO" | "CANTIDAD")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Base de prorrateo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COSTO">
                          Por costo (subtotal de línea)
                        </SelectItem>
                        <SelectItem value="CANTIDAD">Por cantidad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* NUEVO: switch "Prorratear stocks anteriores" */}
              <div
                className={cn(
                  "mt-3 flex items-center justify-between",
                  !aplicarProrrateo && "opacity-50 pointer-events-none"
                )}
              >
                <div className="space-y-0.5">
                  <Label>Prorratear stocks anteriores</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Si lo activas, también se distribuirá en lotes anteriores
                    con existencia del mismo producto en esta sucursal.
                  </p>
                </div>
                <Switch
                  checked={incluirAntiguos}
                  onCheckedChange={setIncluirAntiguos}
                />
              </div>
            </div>
          )}

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
          {isCashMethod(metodoPago || undefined) && (
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
          {isBankMethod(metodoPago || undefined) && (
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

          {/* Descripción (a lo ancho) */}
          <div className="md:col-span-2 space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder={
                motivo === "COSTO_ASOCIADO"
                  ? "Ej. Flete interno Huehuetenango → Tienda Central"
                  : "Ej. Recepción de compra de mercadería"
              }
            />
          </div>

          {/* Prorrateo (solo si es costo asociado) */}
          {motivo === "COSTO_ASOCIADO" && (
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
                  <div
                    className={cn(
                      "min-w-[220px]",
                      !aplicarProrrateo && "opacity-50 pointer-events-none"
                    )}
                  >
                    <Label className="sr-only">Base de prorrateo</Label>
                    <Select
                      value={baseProrrateo}
                      onValueChange={(v) =>
                        setBaseProrrateo(v as "COSTO" | "CANTIDAD")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Base de prorrateo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COSTO">
                          Por costo (subtotal de línea)
                        </SelectItem>
                        <SelectItem value="CANTIDAD">Por cantidad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="md:col-span-2">
            {/* Separator fino y con poco margen para no alargar el modal */}
            <Separator className="my-2" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
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
