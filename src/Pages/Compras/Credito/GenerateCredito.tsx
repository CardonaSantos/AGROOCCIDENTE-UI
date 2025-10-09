import React, { useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TZGT } from "@/Pages/Utils/Utils"; // ej. "America/Guatemala"
import {
  AlertCircle,
  Calendar,
  Percent,
  Receipt,
  Timer,
  Wallet,
} from "lucide-react";

/************************************
 *  Dayjs setup
 ************************************/
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.locale("es");

/************************************
 *  Tipos
 ************************************/
export enum InteresTipo {
  NONE = "NONE",
  SIMPLE = "SIMPLE",
  COMPUESTO = "COMPUESTO",
}

export enum PlanCuotaModo {
  IGUALES = "IGUALES",
  PRIMERA_MAYOR = "PRIMERA_MAYOR",
}

export type GeneracionModo = "POR_COMPRA" | "POR_RECEPCION";

export type EngancheInput = { tipo: "Q" | "%"; valor: number } | null;

export interface CreditoCompraForm {
  proveedorId: number;
  compraId: number;
  modo: GeneracionModo;
  recepcionId?: number;
  montoOriginal?: number; // por defecto: total de compra o valor de recepción
  fechaEmisionISO: string; // ISO
  diasCredito: number; // Net X
  diasEntrePagos: number; // frecuencia entre cuotas
  cantidadCuotas: number; // n total (incluye la #1 si hay enganche)
  interesTipo: InteresTipo;
  interes: number; // tasa por periodo (ej. 0, 0.02)
  planCuotaModo: PlanCuotaModo;
  enganche: EngancheInput; // si modo PRIMERA_MAYOR
  registrarPagoEngancheAhora: boolean;
}

export interface ProveedorOption {
  id: number;
  nombre: string;
}
export interface RecepcionValorada {
  id: number;
  valor: number;
  folio?: string;
  fechaISO?: string;
}

/************************************
 *  Helpers numéricos
 ************************************/
const round2 = (n: number) => Math.round(n * 100) / 100;
const toNumber = (v: string | number) =>
  typeof v === "string" ? Number(v.replace(/,/g, ".")) : v;

/************************************
 *  Builder de plan (preview en UI)
 ************************************/
export type PlanCuotaFila = { numero: number; fechaISO: string; monto: number };
export type PlanPreview = {
  cuotas: PlanCuotaFila[];
  interesTotal: number;
  principalFinanciado: number; // total - enganche
  totalAPagar: number; // suma de cuotas
};

function addDaysISO(baseISO: string, d: number) {
  return dayjs(baseISO)
    .tz(TZGT)
    .add(d, "day")
    .startOf("day")
    .toDate()
    .toISOString();
}

function buildPlanPreview(args: {
  montoTotal: number;
  fechaEmisionISO: string;
  diasCredito: number;
  diasEntrePagos: number;
  n: number; // total de cuotas (incluye #1 si hay enganche en plan)
  interesTipo: InteresTipo;
  interes: number; // tasa por periodo
  planCuotaModo: PlanCuotaModo;
  enganche: EngancheInput; // null = sin enganche
}): PlanPreview {
  const {
    montoTotal,
    fechaEmisionISO,
    diasCredito,
    diasEntrePagos,
    n,
    interesTipo,
    interes,
    planCuotaModo,
    enganche,
  } = args;

  const firstDueISO = addDaysISO(fechaEmisionISO, diasCredito);
  const cuotas: PlanCuotaFila[] = [];

  // 1) Enganche como cuota #1 (en plan)
  const eng = enganche
    ? enganche.tipo === "%"
      ? round2(montoTotal * (enganche.valor / 100))
      : round2(enganche.valor)
    : 0;
  let numero = 1;
  if (eng > 0) {
    cuotas.push({ numero: numero++, fechaISO: firstDueISO, monto: eng });
  }

  const restantes = Math.max(0, n - (eng > 0 ? 1 : 0));
  const P = round2(montoTotal - eng); // principal financiado

  if (restantes === 0) {
    const total = round2(cuotas.reduce((a, c) => a + c.monto, 0));
    return {
      cuotas,
      interesTotal: 0,
      principalFinanciado: P,
      totalAPagar: total,
    };
  }

  const start2ISO =
    eng > 0 ? addDaysISO(firstDueISO, diasEntrePagos) : firstDueISO;

  if (interesTipo === InteresTipo.NONE) {
    // repartir P en 'restantes', ajuste a la última (o primera si quisieras moverlo)
    const base = Math.floor((P / restantes) * 100) / 100; // floor a 2d
    let acum = 0;
    for (let k = 1; k <= restantes; k++) {
      const isLast = k === restantes;
      const monto = isLast ? round2(P - acum) : round2(base);
      cuotas.push({
        numero: numero++,
        fechaISO: addDaysISO(start2ISO, diasEntrePagos * (k - 1)),
        monto,
      });
      acum = round2(acum + monto);
    }
    const total = round2(cuotas.reduce((a, c) => a + c.monto, 0));
    return {
      cuotas,
      interesTotal: 0,
      principalFinanciado: P,
      totalAPagar: total,
    };
  }

  if (interesTipo === InteresTipo.SIMPLE) {
    const capital = round2(P / restantes);
    let saldo = P;
    let interesTotal = 0;
    for (let k = 1; k <= restantes; k++) {
      const interesK = round2(saldo * interes);
      const cuotaK = round2(capital + interesK);
      cuotas.push({
        numero: numero++,
        fechaISO: addDaysISO(start2ISO, diasEntrePagos * (k - 1)),
        monto: cuotaK,
      });
      interesTotal = round2(interesTotal + interesK);
      saldo = round2(saldo - capital);
    }
    const total = round2(cuotas.reduce((a, c) => a + c.monto, 0));
    return { cuotas, interesTotal, principalFinanciado: P, totalAPagar: total };
  }

  // COMPUESTO (francés): cuota fija A sobre P y 'restantes'
  const i = interes;
  const A = round2((P * i) / (1 - Math.pow(1 + i, -restantes)));
  let interesTotal = 0;
  let saldo = P;
  for (let k = 1; k <= restantes; k++) {
    const interesK = round2(saldo * i);
    const capitalK = round2(A - interesK);
    cuotas.push({
      numero: numero++,
      fechaISO: addDaysISO(start2ISO, diasEntrePagos * (k - 1)),
      monto: A,
    });
    interesTotal = round2(interesTotal + interesK);
    saldo = round2(saldo - capitalK);
  }
  const total = round2(cuotas.reduce((a, c) => a + c.monto, 0));
  return { cuotas, interesTotal, principalFinanciado: P, totalAPagar: total };
}

/************************************
 *  GenerateCredito (formulario)
 ************************************/
interface GenerateProps {
  form: CreditoCompraForm;
  setForm: React.Dispatch<React.SetStateAction<CreditoCompraForm>>;
  proveedores: ProveedorOption[];
  recepciones?: RecepcionValorada[]; // para modo "POR_RECEPCION"
  compraTotal: number; // total de la compra (para default)
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
            value={dayjs(form.fechaEmisionISO).tz(TZGT).format("YYYY-MM-DD")}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                fechaEmisionISO: dayjs
                  .tz(e.target.value, TZGT)
                  .toDate()
                  .toISOString(),
              }))
            }
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
