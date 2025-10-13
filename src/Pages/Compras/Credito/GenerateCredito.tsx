import React, { useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/es";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TZGT } from "@/Pages/Utils/Utils"; // ej. "America/Guatemala"
import { Calendar, Percent, Receipt, Timer, Wallet } from "lucide-react";
import { toNumber } from "./helpers/helpers1";
import {
  CreditoCompraForm,
  GeneracionModo,
  InteresTipo,
  PlanCuotaModo,
  ProveedorOption,
  RecepcionValorada,
} from "./interfaces/types";
import { buildPlanPreview } from "./helpers/helpers2";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.locale("es");

interface GenerateProps {
  form: CreditoCompraForm;
  setForm: React.Dispatch<React.SetStateAction<CreditoCompraForm>>;
  proveedores: ProveedorOption[];
  recepciones?: RecepcionValorada[]; // para modo "POR_RECEPCION"
  compraTotal: number; // total de la compra (para default)

  cuentasBancarias: {
    id: number;
    nombre: string;
  }[];
}

export function GenerateCredito({
  form,
  setForm,
  proveedores,
  recepciones = [],
  compraTotal,
}: GenerateProps) {
  const hasRecepciones = recepciones.length > 0;
  // sincroniza monto base por modo
  const baseMonto = useMemo(() => {
    if (form.modo === "POR_RECEPCION" && form.recepcionId) {
      const r = recepciones.find((x) => x.id === form.recepcionId);
      return r?.valor ?? form.montoOriginal ?? compraTotal;
    }
    return form.montoOriginal ?? compraTotal;
  }, [
    form.modo,
    form.recepcionId,
    form.montoOriginal,
    recepciones,
    compraTotal,
  ]);

  const onNumber =
    (field: keyof CreditoCompraForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = toNumber(e.target.value || 0);
      setForm((p) => ({ ...p, [field]: isFinite(v) ? v : 0 }));
    };

  const onPercent =
    (field: keyof CreditoCompraForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = toNumber(e.target.value || 0);
      if (v > 1) v = v / 100; // si el usuario escribe 2 en lugar de 0.02, lo normalizamos
      setForm((p) => ({ ...p, [field]: isFinite(v) ? v : 0 }));
    };

  const onEngancheChange = (tipo: "Q" | "%", valor: number) => {
    setForm((p) => ({ ...p, enganche: { tipo, valor } }));
  };

  const preview = useMemo(
    () =>
      buildPlanPreview({
        montoTotal: baseMonto,
        fechaEmisionISO: form.fechaEmisionISO,
        diasCredito: form.diasCredito,
        diasEntrePagos: form.diasEntrePagos,
        n: form.cantidadCuotas,
        interesTipo: form.interesTipo,
        interes: form.interes,
        planCuotaModo: form.planCuotaModo,
        enganche:
          form.planCuotaModo === PlanCuotaModo.PRIMERA_MAYOR
            ? form.enganche
            : null,
      }),
    [baseMonto, form]
  );
  console.log("El form es: ", form);
  console.log("El recepciones es: ", recepciones);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Generar crédito de compra
        </CardTitle>
        <CardDescription>
          Define el plan de cuotas. Los campos avanzados son opcionales.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {/* Modo */}
        <div className="space-y-2">
          <Label>Modo</Label>
          <Select
            value={form.modo}
            onValueChange={(v: GeneracionModo) =>
              setForm((p) => ({ ...p, modo: v }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="POR_COMPRA">Por compra</SelectItem>
                <SelectItem value="POR_RECEPCION" disabled={!hasRecepciones}>
                  Por recepción
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {form.modo === "POR_RECEPCION" && (
            <div className="mt-2">
              <Label>Recepción</Label>
              <Select
                value={form.recepcionId ? String(form.recepcionId) : undefined}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, recepcionId: Number(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una recepción" />
                </SelectTrigger>
                <SelectContent>
                  {recepciones.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      #{r.id} • {r.folio ?? "REC"}-{r.id} • Q{" "}
                      {r.valor.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Proveedor */}
        <div className="space-y-2">
          <Label>Proveedor</Label>
          <Select
            value={String(form.proveedorId)}
            onValueChange={(v) =>
              setForm((p) => ({ ...p, proveedorId: Number(v) }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proveedor" />
            </SelectTrigger>
            <SelectContent>
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Monto base */}
        <div className="space-y-2">
          <Label>Monto a financiar (Q)</Label>
          <Input
            inputMode="decimal"
            value={String(form.montoOriginal ?? baseMonto)}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                montoOriginal: toNumber(e.target.value),
              }))
            }
          />
          <p className="text-[11px] text-muted-foreground">
            Default: total de compra o valor de la recepción.
          </p>
        </div>

        {/* Fechas y frecuencia */}
        <div className="space-y-2">
          <Label>Fecha de emisión</Label>
          <Input
            type="date"
            value={
              form.fechaEmisionISO
                ? dayjs(form.fechaEmisionISO).tz(TZGT).format("YYYY-MM-DD")
                : dayjs().tz(TZGT).format("YYYY-MM-DD") // fallback: hoy
            }
            onChange={(e) => {
              const raw = e.target.value;
              setForm((p) => ({
                ...p,
                fechaEmisionISO: raw
                  ? dayjs.tz(raw, TZGT).toISOString()
                  : dayjs().tz(TZGT).toISOString(), // si borra, vuelve a hoy
              }));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Días de crédito (Net X)</Label>
          <Input
            inputMode="numeric"
            value={form.diasCredito}
            onChange={onNumber("diasCredito")}
          />
        </div>
        <div className="space-y-2">
          <Label>Días entre pagos</Label>
          <Input
            inputMode="numeric"
            value={form.diasEntrePagos}
            onChange={onNumber("diasEntrePagos")}
          />
        </div>

        {/* Cuotas */}
        <div className="space-y-2">
          <Label>Cantidad de cuotas</Label>
          <Input
            inputMode="numeric"
            value={form.cantidadCuotas}
            onChange={onNumber("cantidadCuotas")}
          />
        </div>

        {/* Interés */}
        <div className="space-y-2">
          <Label>Tipo de interés</Label>
          <Select
            value={form.interesTipo}
            onValueChange={(v: InteresTipo) =>
              setForm((p) => ({ ...p, interesTipo: v }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={InteresTipo.NONE}>Sin interés</SelectItem>
                <SelectItem value={InteresTipo.SIMPLE}>
                  Simple (sobre saldo)
                </SelectItem>
                <SelectItem value={InteresTipo.COMPUESTO}>
                  Compuesto (francés)
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Interés por periodo</Label>
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <Input
              inputMode="decimal"
              placeholder="0.02 = 2%"
              value={String(form.interes)}
              onChange={onPercent("interes")}
              disabled={form.interesTipo === InteresTipo.NONE}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tasa por periodo (coincide con los días entre pagos). Acepta 0.02 o
            2 (se normaliza a 0.02).
          </p>
        </div>

        {/* Modo de generación */}
        <div className="space-y-2">
          <Label>Modo de generación</Label>
          <Select
            value={form.planCuotaModo}
            onValueChange={(v: PlanCuotaModo) =>
              setForm((p) => ({ ...p, planCuotaModo: v }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={PlanCuotaModo.IGUALES}>
                  Iguales (ajuste final)
                </SelectItem>
                <SelectItem value={PlanCuotaModo.PRIMERA_MAYOR}>
                  Primera mayor (enganche)
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Enganche (solo si PRIMERA_MAYOR) */}
        {form.planCuotaModo === PlanCuotaModo.PRIMERA_MAYOR && (
          <div className="space-y-2 md:col-span-2">
            <Label>Enganche / primera mayor</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={form.enganche?.tipo ?? "Q"}
                onValueChange={(v: "Q" | "%") =>
                  onEngancheChange(v, form.enganche?.valor ?? 0)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q">Quetzales</SelectItem>
                  <SelectItem value="%">Porcentaje</SelectItem>
                </SelectContent>
              </Select>
              <Input
                inputMode="decimal"
                value={String(form.enganche?.valor ?? 0)}
                onChange={(e) =>
                  onEngancheChange(
                    form.enganche?.tipo ?? "Q",
                    toNumber(e.target.value || 0)
                  )
                }
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.registrarPagoEngancheAhora}
                  onCheckedChange={(chk) =>
                    setForm((p) => ({ ...p, registrarPagoEngancheAhora: chk }))
                  }
                />
                <span className="text-sm">
                  Registrar pago del enganche ahora
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Si habilitas el registro automático del pago, el backend creará el
              pago aplicado a la cuota #1.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Calendar className="h-4 w-4" />
          <span>
            1ra cuota:{" "}
            {dayjs(preview.cuotas[0]?.fechaISO).tz(TZGT).format("DD/MM/YYYY")} •
            Q {preview.cuotas[0]?.monto.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Timer className="h-4 w-4" />{" "}
          <span>Cuotas: {preview.cuotas.length}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Wallet className="h-4 w-4" />{" "}
          <span>
            Total a pagar: Q {preview.totalAPagar.toFixed(2)} (interés: Q{" "}
            {preview.interesTotal.toFixed(2)})
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
