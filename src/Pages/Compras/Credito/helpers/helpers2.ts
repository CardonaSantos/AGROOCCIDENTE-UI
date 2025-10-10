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
    // planCuotaModo,
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
      const id = `${dayjs(
        addDaysISO(start2ISO, diasEntrePagos * (k - 1))
      ).format("YYYYMMDD")}-${numero}`;

      const isLast = k === restantes;
      const monto = isLast ? round2(P - acum) : round2(base);
      cuotas.push({
        numero: numero++,
        fechaISO: addDaysISO(start2ISO, diasEntrePagos * (k - 1)),
        monto,
        id,
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
      const id = `${dayjs(
        addDaysISO(start2ISO, diasEntrePagos * (k - 1))
      ).format("YYYYMMDD")}-${numero}`;
      const interesK = round2(saldo * interes);
      const cuotaK = round2(capital + interesK);
      cuotas.push({
        numero: numero++,
        fechaISO: addDaysISO(start2ISO, diasEntrePagos * (k - 1)),
        monto: cuotaK,
        id,
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

    const id = `${dayjs(addDaysISO(start2ISO, diasEntrePagos * (k - 1))).format(
      "YYYYMMDD"
    )}-${numero}`;

    cuotas.push({
      numero: numero++,
      fechaISO: addDaysISO(start2ISO, diasEntrePagos * (k - 1)),
      monto: A,
      id: id,
    });
    interesTotal = round2(interesTotal + interesK);
    saldo = round2(saldo - capitalK);
  }
  const total = round2(cuotas.reduce((a, c) => a + c.monto, 0));
  return { cuotas, interesTotal, principalFinanciado: P, totalAPagar: total };
}
