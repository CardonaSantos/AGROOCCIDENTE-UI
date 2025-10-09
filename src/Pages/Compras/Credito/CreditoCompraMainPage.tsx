import {
  CreditoCompraForm,
  EngancheInput,
  GenerateCredito,
  InteresTipo,
  PlanCuotaFila,
  PlanCuotaModo,
  PlanPreview,
  ProveedorOption,
  RecepcionValorada,
} from "./GenerateCredito";

import React, { useMemo, useState } from "react";
import dayjs from "dayjs";

import "dayjs/locale/es";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { TZGT } from "@/Pages/Utils/Utils"; // ej. "America/Guatemala"
import { AlertCircle } from "lucide-react";
import { useApiMutation } from "@/hooks/genericoCall/genericoCallHook";
import { SummaryCreditoCompra } from "./SummaryCreditoCompra";
interface CreditoCompraMainProps {
  compraId: number;
  proveedorId: number;
  compraTotal: number; // total de la compra (para default)
  proveedores: ProveedorOption[];
  recepciones?: RecepcionValorada[];
}
export default function CreditoCompraMainPage({
  compraId,
  proveedorId,
  compraTotal,
  proveedores,
  recepciones = [],
}: CreditoCompraMainProps) {
  const [enabled, setEnabled] = useState<boolean>(true);

  const [form, setForm] = useState<CreditoCompraForm>({
    proveedorId,
    compraId,
    modo: "POR_COMPRA",
    recepcionId: undefined,
    montoOriginal: undefined,
    fechaEmisionISO: dayjs().tz(TZGT).startOf("day").toDate().toISOString(),
    diasCredito: 0,
    diasEntrePagos: 15,
    cantidadCuotas: 4,
    interesTipo: InteresTipo.NONE,
    interes: 0,
    planCuotaModo: PlanCuotaModo.IGUALES,
    enganche: null,
    registrarPagoEngancheAhora: false,
  });

  const preview = useMemo(
    () =>
      buildPlanPreview({
        montoTotal:
          form.montoOriginal ??
          (form.modo === "POR_RECEPCION" && form.recepcionId
            ? recepciones.find((r) => r.id === form.recepcionId)?.valor ??
              compraTotal
            : compraTotal),
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
    [form, compraTotal, recepciones]
  );

  // POST mutation (usa tu hook genérico). Ajusta el tipo TData según tu API.
  const { mutateAsync, isPending } = useApiMutation<any, any>(
    "post",
    `/compras/${compraId}/cxp-documentos`,
    undefined,
    {
      onSuccess: () => {
        // TODO: toast + navigate / invalidate queries
      },
    }
  );

  const canSubmit = useMemo(() => {
    const base =
      form.montoOriginal ??
      (form.modo === "POR_RECEPCION" && form.recepcionId
        ? recepciones.find((r) => r.id === form.recepcionId)?.valor ??
          compraTotal
        : compraTotal);
    return base > 0 && form.cantidadCuotas >= 1 && form.diasEntrePagos > 0;
  }, [form, compraTotal, recepciones]);

  const onSubmit = async () => {
    const payload = {
      // mapea tu DTO del backend
      folioProveedor: undefined,
      fechaEmision: form.fechaEmisionISO,
      montoOriginal:
        form.montoOriginal ??
        (form.modo === "POR_RECEPCION" && form.recepcionId
          ? recepciones.find((r) => r.id === form.recepcionId)?.valor ??
            compraTotal
          : compraTotal),
      diasCredito: form.diasCredito,
      cantidadCuotas: form.cantidadCuotas,
      diasEntreCuotas: form.diasEntrePagos,
      interes: form.interes,
      tipoInteres: form.interesTipo,
      modoGeneracion: form.planCuotaModo,
      recepcionId: form.modo === "POR_RECEPCION" ? form.recepcionId : undefined,
      enganche:
        form.planCuotaModo === PlanCuotaModo.PRIMERA_MAYOR && form.enganche
          ? form.enganche
          : undefined,
      registrarPagoEngancheAhora: form.registrarPagoEngancheAhora,
      // pago: { metodoPago, sucursalId, referencia } // si vas a registrar pago del enganche ahora
    };
    await mutateAsync(payload as any);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label>Generar crédito de compra</Label>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled ? (
        <>
          <GenerateCredito
            form={form}
            setForm={setForm}
            proveedores={proveedores}
            recepciones={recepciones}
            compraTotal={compraTotal}
          />
          <SummaryCreditoCompra preview={preview} />

          <div className="flex items-center justify-end gap-2">
            {!canSubmit && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" /> Revisa monto, frecuencia y #
                cuotas.
              </div>
            )}
            <Button disabled={!canSubmit || isPending} onClick={onSubmit}>
              {isPending ? "Creando crédito…" : "Crear crédito"}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
function addDaysISO(baseISO: string, d: number) {
  return dayjs(baseISO)
    .tz(TZGT)
    .add(d, "day")
    .startOf("day")
    .toDate()
    .toISOString();
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const toNumber = (v: string | number) =>
  typeof v === "string" ? Number(v.replace(/,/g, ".")) : v;

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
