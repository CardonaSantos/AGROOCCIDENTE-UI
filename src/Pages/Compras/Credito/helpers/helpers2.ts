// helpers/helpers2.ts
import dayjs from "dayjs";
import {
  EngancheInput,
  InteresTipo,
  PlanCuotaFila,
  PlanCuotaModo,
  PlanPreview,
} from "../interfaces/types";
import { addDaysISO, round2 } from "./helpers1";

export function buildPlanPreview(args: {
  montoTotal: number;
  fechaEmisionISO: string;
  diasCredito: number;
  diasEntrePagos: number;
  n: number; // <-- CUOTAS FINANCIADAS (NO INCLUYE ENGANCHE)
  interesTipo: InteresTipo;
  interes: number; // tasa por periodo, ej. 0.02
  planCuotaModo: PlanCuotaModo;
  enganche: EngancheInput | null; // null = sin enganche
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

  const M = round2(montoTotal);
  // Enganche: si tipo = "%", valor viene en porcentaje (10 => 10%), por eso /100
  const e =
    planCuotaModo === PlanCuotaModo.PRIMERA_MAYOR && enganche
      ? round2(
          enganche.tipo === "%"
            ? M * (enganche.valor / 100)
            : enganche.valor ?? 0
        )
      : 0;

  if (e < 0) throw new Error("Enganche inválido.");
  if (e >= M) throw new Error("El enganche debe ser menor al monto.");

  const cuotas: PlanCuotaFila[] = [];
  let numero = 1;

  // (1) Enganche como CUOTA #1 (hoy = fechaEmisionISO)
  if (e > 0) {
    const id = `${dayjs(fechaEmisionISO).format("YYYYMMDD")}-${numero}`;
    cuotas.push({
      numero,
      fechaISO: dayjs(fechaEmisionISO).toDate().toISOString(),
      monto: e,
      id,
    });
    numero++;
  }

  // (2) Cuotas financiadas sobre P = M - e
  const P = round2(M - e);
  const restantes = Math.max(0, n);

  if (restantes === 0) {
    const totalAPagar = round2(cuotas.reduce((a, c) => a + c.monto, 0));
    const interesTotal = round2(totalAPagar - M);
    return {
      cuotas,
      interesTotal,
      principalFinanciado: P,
      totalAPagar,
    };
  }

  // Primera financiada: fechaEmision + diasCredito
  const firstDueISO = addDaysISO(fechaEmisionISO, diasCredito);

  if (interesTipo === InteresTipo.NONE) {
    // Reparto lineal con ajuste a la última cuota
    const base = Math.floor((P / restantes) * 100) / 100; // floor 2d
    let acum = 0;
    for (let k = 0; k < restantes; k++) {
      const fecha = addDaysISO(firstDueISO, diasEntrePagos * k);
      const isLast = k === restantes - 1;
      const monto = isLast ? round2(P - acum) : round2(base);
      const id = `${dayjs(fecha).format("YYYYMMDD")}-${numero}`;
      cuotas.push({ numero, fechaISO: fecha, monto, id });
      numero++;
      acum = round2(acum + monto);
    }

    const totalAPagar = round2(cuotas.reduce((a, c) => a + c.monto, 0));
    // Invariante: sin interés, total = M (enganche + financiadas)
    if (Math.abs(totalAPagar - M) > 0.01) {
      throw new Error(
        "Con interés NONE, la suma de cuotas debe igualar el monto original."
      );
    }
    return {
      cuotas,
      interesTotal: 0,
      principalFinanciado: P,
      totalAPagar: totalAPagar,
    };
  }

  if (interesTipo === InteresTipo.SIMPLE) {
    // Principal lineal, interés sobre saldo
    const principal = round2(P / restantes);
    let saldo = P;
    let interesTotal = 0;

    for (let k = 0; k < restantes; k++) {
      const fecha = addDaysISO(firstDueISO, diasEntrePagos * k);
      const interesK = round2(saldo * interes);
      const principalK = k < restantes - 1 ? principal : round2(saldo); // ajuste final
      const monto = round2(principalK + interesK);
      const id = `${dayjs(fecha).format("YYYYMMDD")}-${numero}`;
      cuotas.push({ numero, fechaISO: fecha, monto, id });
      numero++;
      interesTotal = round2(interesTotal + interesK);
      saldo = round2(saldo - principalK);
    }
    const totalAPagar = round2(cuotas.reduce((a, c) => a + c.monto, 0));
    return {
      cuotas,
      interesTotal,
      principalFinanciado: P,
      totalAPagar,
    };
  }

  // Interés compuesto (francés): cuota fija A
  const i = interes;
  const A =
    i > 0
      ? round2((P * i) / (1 - Math.pow(1 + i, -restantes)))
      : round2(P / restantes);
  let saldo = P;
  let interesTotal = 0;

  for (let k = 0; k < restantes; k++) {
    const fecha = addDaysISO(firstDueISO, diasEntrePagos * k);
    const interesK = round2(saldo * i);
    let principalK = round2(A - interesK);
    if (k === restantes - 1) principalK = round2(saldo); // ajuste final
    const monto = round2(principalK + interesK);
    const id = `${dayjs(fecha).format("YYYYMMDD")}-${numero}`;
    cuotas.push({ numero, fechaISO: fecha, monto, id });
    numero++;
    interesTotal = round2(interesTotal + interesK);
    saldo = round2(saldo - principalK);
  }

  const totalAPagar = round2(cuotas.reduce((a, c) => a + c.monto, 0));
  return {
    cuotas,
    interesTotal,
    principalFinanciado: P,
    totalAPagar,
  };
}
