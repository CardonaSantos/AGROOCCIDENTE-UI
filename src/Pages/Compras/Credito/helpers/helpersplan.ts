// helpers/plan.ts
import dayjs from "dayjs";
import {
  CreditoCompraForm,
  PlanCuotaFila,
  PlanPreview,
  RecepcionValorada,
} from "../interfaces/types";
import { buildPlanPreview } from "./helpers2";

export function getMontoBase(
  form: CreditoCompraForm,
  compraTotal: number,
  recepciones: RecepcionValorada[]
) {
  if (form.modo === "POR_RECEPCION" && form.recepcionId) {
    const r = recepciones.find((x) => x.id === form.recepcionId);
    return form.montoOriginal ?? r?.valor ?? compraTotal;
  }
  return form.montoOriginal ?? compraTotal;
}

export function previewFrom(
  form: CreditoCompraForm,
  compraTotal: number,
  recepciones: RecepcionValorada[]
): PlanPreview {
  return buildPlanPreview({
    montoTotal: getMontoBase(form, compraTotal, recepciones),
    fechaEmisionISO: form.fechaEmisionISO,
    diasCredito: form.diasCredito,
    diasEntrePagos: form.diasEntrePagos,
    n: form.cantidadCuotas,
    interesTipo: form.interesTipo,
    interes: form.interes,
    planCuotaModo: form.planCuotaModo,
    enganche: form.planCuotaModo === "PRIMERA_MAYOR" ? form.enganche : null,
  });
}

/** Garantiza un id estable si la cuota no trae id */
export const ensureId = (c: PlanCuotaFila): PlanCuotaFila =>
  c.id
    ? c
    : { ...c, id: `${c.numero}-${dayjs(c.fechaISO).format("YYYYMMDD")}` };

export function cuotasForSubmit(
  isManual: boolean,
  cuotasOverride: PlanCuotaFila[] | null,
  form: CreditoCompraForm,
  compraTotal: number,
  recepciones: RecepcionValorada[]
): PlanCuotaFila[] {
  if (isManual && cuotasOverride && cuotasOverride.length)
    return cuotasOverride;
  const prev = previewFrom(form, compraTotal, recepciones);
  return prev.cuotas.map(ensureId);
}
