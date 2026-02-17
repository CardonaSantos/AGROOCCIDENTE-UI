"use client";
import * as React from "react";
import dayjs from "dayjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarClock,
  Coins,
  CreditCard,
  DollarSign,
  FileCheck2,
  GripVertical,
  Hash,
} from "lucide-react";

import {
  FormCreditoState,
  InteresTipoCreditoVenta,
  PlanCuotaModo,
  PropuestaCuota,
} from "./credito-venta.interfaces";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import {
  BuildPayload,
  CuotaPropuestaPayload,
  InteresTipoServer,
  LineaPayload,
  PlanCuotaModoServer,
} from "../interfaces/buildpayload.interface";
import { toInt, toMoney } from "./helpers";

// ========================= Utils =========================
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function repartirConPesos(total: number, pesos: number[]): number[] {
  const sumPesos = pesos.reduce((a, b) => a + b, 0) || 1;
  const brutos = pesos.map((p) => (total * p) / sumPesos);
  const rounded = brutos.map(r2);
  const diff = r2(total - rounded.reduce((a, b) => r2(a + b), 0));
  if (Math.abs(diff) >= 0.01) {
    rounded[rounded.length - 1] = r2(rounded[rounded.length - 1] + diff);
  }
  return rounded;
}

function generarCuotas({
  totalProductos,
  enganche,
  cuotasTotales,
  plan,
  fechaPrimeraCuota,
  diasEntrePagos,
}: {
  totalProductos: number;
  enganche: number;
  cuotasTotales: number;
  plan: PlanCuotaModo;
  fechaPrimeraCuota: string; // YYYY-MM-DD
  diasEntrePagos: number;
  interesTipo: InteresTipoCreditoVenta;
  interesPorcentaje: number;
}): PropuestaCuota[] {
  const cuotas: PropuestaCuota[] = [];
  const hoy = dayjs().format("YYYY-MM-DD");

  if (enganche > 0) {
    cuotas.push({
      numero: 0,
      fechaISO: hoy,
      monto: r2(enganche),
      etiqueta: "ENGANCHE",
    });
  }

  const principalBase = Math.max(0, r2(totalProductos - enganche));
  const n = Math.max(1, Number(cuotasTotales) || 1);

  const principalParaRepartir = principalBase;

  let pesos: number[] = [];
  if (plan === "IGUALES" || plan === "PRIMERA_MAYOR") {
    pesos = Array.from({ length: n }, () => 1);
  } else if (plan === "CRECIENTES") {
    pesos = Array.from({ length: n }, (_, i) => i + 1);
  } else {
    pesos = Array.from({ length: n }, (_, i) => n - i);
  }

  const montos = repartirConPesos(principalParaRepartir, pesos);

  const primera = fechaPrimeraCuota || hoy;
  for (let i = 0; i < n; i++) {
    const fecha = dayjs(primera)
      .add(i * (Number(diasEntrePagos) || 30), "day")
      .format("YYYY-MM-DD");

    cuotas.push({
      numero: i + 1,
      fechaISO: fecha,
      monto: r2(montos[i]),
      etiqueta: "NORMAL",
    });
  }
  return cuotas;
}

// ========================= Tipos Props =========================
type PropsCreditoForm = {
  value: FormCreditoState;
  onChange: React.Dispatch<React.SetStateAction<FormCreditoState>>; // requerido
  onSubmit?: (payload: any) => void;
  handleCreateCreditRequest: (payload: any) => Promise<void>;
  autoRecalc?: boolean;
  readOnly?: boolean;
  isPendingCreditRequest: boolean;

  setOpenCreateRequest: React.Dispatch<React.SetStateAction<boolean>>;
  openCreateRequest: boolean;
  userRol: string;
  date: Date | undefined;
};

// ========================= Componente =========================
export default function CreditoForm({
  value,
  onChange,
  handleCreateCreditRequest,
  isPendingCreditRequest,
  openCreateRequest,
  setOpenCreateRequest,
  autoRecalc = true,
  readOnly = false,
  userRol,
}: PropsCreditoForm) {
  const form = value;
  const setForm = onChange;

  const [editingCuotas, setEditingCuotas] = React.useState(false);

  // Recalculo automático de cuotas (ignora interés) cuando NO estamos editando manualmente
  React.useEffect(() => {
    if (!autoRecalc || editingCuotas) return;

    setForm((prev) => {
      const enganche =
        prev.planCuotaModo === "PRIMERA_MAYOR"
          ? Number(prev.cuotaInicialPropuesta || 0)
          : 0;

      const cuotas = generarCuotas({
        totalProductos: Number(prev.totalPropuesto || 0),
        enganche,
        cuotasTotales: Number(prev.cuotasTotalesPropuestas || 1),
        plan: prev.planCuotaModo,
        fechaPrimeraCuota:
          prev.fechaPrimeraCuota || dayjs().format("YYYY-MM-DD"), // HOY por defecto
        diasEntrePagos: Number(prev.diasEntrePagos || 30),
        interesTipo: prev.interesTipo,
        interesPorcentaje: Number(prev.interesPorcentaje || 0),
      });

      return { ...prev, cuotasPropuestas: cuotas };
    });
  }, [
    autoRecalc,
    editingCuotas,
    form.totalPropuesto,
    form.cuotaInicialPropuesta,
    form.cuotasTotalesPropuestas,
    form.planCuotaModo,
    form.fechaPrimeraCuota,
    form.diasEntrePagos,
    form.interesTipo,
    form.interesPorcentaje,
    setForm,
  ]);

  // =================== Derivados UI ===================
  const sumCuotas = React.useMemo(
    () =>
      r2(
        (form.cuotasPropuestas || [])
          .filter((c) => c.etiqueta !== "ENGANCHE")
          .reduce((a, c) => a + Number(c.monto || 0), 0),
      ),
    [form.cuotasPropuestas],
  );

  // =================== Mutadores ===================
  function setField<K extends keyof FormCreditoState>(
    key: K,
    v: FormCreditoState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: v }));
  }

  function updateCuota(idx: number, patch: Partial<PropuestaCuota>) {
    setForm((prev) => {
      const next = [...(prev.cuotasPropuestas || [])];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, cuotasPropuestas: next };
    });
  }

  // Cambiar fecha de una cuota y REFLUIR las siguientes manteniendo el intervalo (diasEntrePagos)
  function updateCuotaFecha(idx: number, nuevaFechaISO: string) {
    setForm((prev) => {
      const next = [...(prev.cuotasPropuestas || [])];
      if (!next[idx]) return prev;

      const isEnganche =
        next[idx].etiqueta === "ENGANCHE" || next[idx].numero === 0;

      // Siempre actualizamos la fecha de la cuota editada
      next[idx] = { ...next[idx], fechaISO: nuevaFechaISO };

      // Si es ENGANCHE, no arrastramos fechas
      if (isEnganche) {
        return { ...prev, cuotasPropuestas: next };
      }

      const intervalo = Math.max(1, Number(prev.diasEntrePagos || 30));
      for (let j = idx + 1; j < next.length; j++) {
        // No refluimos a través del enganche si existiera en medio (por diseño sólo está al inicio)
        if (next[j].etiqueta === "ENGANCHE" || next[j].numero === 0) continue;
        const fecha = dayjs(nuevaFechaISO)
          .add((j - idx) * intervalo, "day")
          .format("YYYY-MM-DD");
        next[j] = { ...next[j], fechaISO: fecha };
      }

      // Mantener sincronizada la fechaPrimeraCuota si cambiamos la #1
      if (next[idx].numero === 1) {
        return {
          ...prev,
          fechaPrimeraCuota: nuevaFechaISO,
          cuotasPropuestas: next,
        };
      }

      return { ...prev, cuotasPropuestas: next };
    });
  }

  const handleRegenerarCuotas = React.useCallback(() => {
    setForm((prev) => {
      const enganche =
        prev.planCuotaModo === "PRIMERA_MAYOR"
          ? Number(prev.cuotaInicialPropuesta || 0)
          : 0;

      const cuotas = generarCuotas({
        totalProductos: Number(prev.totalPropuesto || 0),
        enganche,
        cuotasTotales: Number(prev.cuotasTotalesPropuestas || 1),
        plan: prev.planCuotaModo,
        fechaPrimeraCuota:
          prev.fechaPrimeraCuota || dayjs().format("YYYY-MM-DD"), // HOY por defecto
        diasEntrePagos: Number(prev.diasEntrePagos || 30),
        interesTipo: prev.interesTipo,
        interesPorcentaje: Number(prev.interesPorcentaje || 0),
      });

      return { ...prev, cuotasPropuestas: cuotas };
    });
  }, [setForm]);

  function handleSubmit() {
    const tieneCliente = !!form.clienteId || !!form.nombreCliente?.trim();
    if (!tieneCliente) {
      alert("Debes seleccionar un cliente o ingresar el snapshot del cliente.");
      return;
    }

    if (
      form.planCuotaModo === "PRIMERA_MAYOR" &&
      Number(form.cuotaInicialPropuesta) <= 0
    ) {
      alert("En PRIMERA_MAYOR, el enganche debe ser mayor a 0.");
      return;
    }

    const payload = buildSolicitudPayload(form);
    if (handleCreateCreditRequest) handleCreateCreditRequest(payload);
    else {
      console.log("Payload solicitud crédito (sin onSubmit):", payload);
      alert("Payload construido. Revisa la consola del navegador.");
    }
  }

  // =================== Render ===================
  const planEsPrimeraMayor = form.planCuotaModo === "PRIMERA_MAYOR";
  const totalUI = r2(form.totalPropuesto);

  const cuotas = Array.isArray(form.cuotasPropuestas)
    ? form.cuotasPropuestas
    : [];
  const engancheUI = r2(
    cuotas.find((c) => c?.etiqueta === "ENGANCHE" || c?.numero === 0)?.monto ??
      (form.planCuotaModo === "PRIMERA_MAYOR" ? form.cuotaInicialPropuesta : 0),
  );
  const principalUI = r2(totalUI - engancheUI);
  const sumCuotasSinEnganche = r2(
    cuotas
      .filter(
        (c) =>
          (c?.etiqueta ?? (c?.numero === 0 ? "ENGANCHE" : "NORMAL")) !==
          "ENGANCHE",
      )
      .reduce((acc, c) => acc + r2(c?.monto), 0),
  );

  // Como el interés NO se aplica a cuotas, hay consistencia si la suma de cuotas == principal
  const isConsistent = Math.abs(sumCuotasSinEnganche - principalUI) <= 0.01;
  const interesPct = Number(form?.interesPorcentaje || 0);
  const isVendedor: boolean = userRol != "ADMIN" ? true : false;

  return (
    <div className="mx-auto w-full max-w-6xl mt-2">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-4 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="h-5 w-5" /> Nueva solicitud de crédito
              </CardTitle>
              <CardDescription>
                Completa los datos y el plan de pago propuesto. Se enviará para
                aprobación.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Separator />

              {/* Económico */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Coins className="h-4 w-4" /> Total productos (GTQ)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.totalPropuesto}
                    disabled={readOnly}
                    onChange={(e) =>
                      setField(
                        "totalPropuesto",
                        r2(Number(e.target.value || 0)),
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cuotas totales</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.cuotasTotalesPropuestas}
                    disabled={readOnly}
                    onChange={(e) =>
                      setField(
                        "cuotasTotalesPropuestas",
                        Math.max(1, Number(e.target.value || 1)),
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Días entre pagos</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.diasEntrePagos}
                    disabled={readOnly}
                    onChange={(e) =>
                      setField(
                        "diasEntrePagos",
                        Math.max(1, Number(e.target.value || 30)),
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Fecha primera cuota</Label>
                  <Input
                    type="date"
                    value={form.fechaPrimeraCuota || ""}
                    disabled={readOnly}
                    onChange={(e) =>
                      setField("fechaPrimeraCuota", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Plan de cuotas</Label>
                  <Select
                    value={form.planCuotaModo}
                    onValueChange={(v: PlanCuotaModo) => {
                      setForm((prev) => ({
                        ...prev,
                        planCuotaModo: v,
                        cuotaInicialPropuesta:
                          v !== "PRIMERA_MAYOR"
                            ? 0
                            : prev.cuotaInicialPropuesta,
                      }));
                    }}
                  >
                    <SelectTrigger disabled={readOnly}>
                      <SelectValue placeholder="Selecciona plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IGUALES">Iguales</SelectItem>
                      <SelectItem value="PRIMERA_MAYOR">
                        Primera mayor
                      </SelectItem>
                      <SelectItem value="CRECIENTES">Crecientes</SelectItem>
                      <SelectItem value="DECRECIENTES">Decrecientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Interés</Label>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <Select
                        value={form.interesTipo}
                        onValueChange={(v: InteresTipoCreditoVenta) =>
                          setField("interesTipo", v)
                        }
                      >
                        <SelectTrigger disabled={readOnly}>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">Sin interés</SelectItem>
                          <SelectItem value="SIMPLE">Simple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      {form.interesTipo === "NONE" ? null : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={form.interesPorcentaje}
                            disabled={readOnly}
                            onChange={(e) =>
                              setField(
                                "interesPorcentaje",
                                Math.max(
                                  0,
                                  Math.min(100, Number(e.target.value || 0)),
                                ),
                              )
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha credito</Label>
                <Input
                  type="date"
                  value={form.fecha || undefined}
                  // disabled={readOnly}
                  onChange={(e) => setField("fecha", e.target.value)}
                />
              </div>

              {planEsPrimeraMayor && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Enganche (GTQ)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.cuotaInicialPropuesta}
                      disabled={readOnly}
                      onChange={(e) =>
                        setField(
                          "cuotaInicialPropuesta",
                          r2(Number(e.target.value || 0)),
                        )
                      }
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Editar cuotas manualmente
                  </span>
                </div>
                <Switch
                  disabled={isVendedor}
                  checked={editingCuotas}
                  onCheckedChange={setEditingCuotas}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRegenerarCuotas}
                >
                  Regenerar cuotas
                </Button>

                <Badge variant="outline" className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />{" "}
                  {(form.cuotasPropuestas || []).length} cuotas
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Principal:{" "}
                  {principalUI.toFixed(2)}
                </Badge>
                {engancheUI > 0 && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <DollarSign className="h-3 w-3" /> Enganche:{" "}
                    {engancheUI.toFixed(2)}
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Suma cuotas:{" "}
                  {sumCuotas.toFixed(2)}
                </Badge>
              </div>

              {/* Tabla de cuotas */}
              <Card className="mt-2 border-dashed">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">
                    Calendario de cuotas (propuesto)
                  </CardTitle>
                  <CardDescription>
                    Fechas y montos editables. El total final se confirmará al
                    aprobar.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                  {/* ======= Desktop / md+: tabla con header sticky ======= */}
                  <div className="hidden md:block">
                    <ScrollArea className="h-[360px]">
                      <div className="min-w-full">
                        <div className="grid grid-cols-12 sticky top-0 z-10 border-b bg-muted/50 backdrop-blur px-3 py-2 text-xs font-medium text-muted-foreground">
                          <div className="col-span-1">#</div>
                          <div className="col-span-5">Fecha</div>
                          <div className="col-span-4">Monto (GTQ)</div>
                          <div className="col-span-2 text-right">Etiqueta</div>
                        </div>

                        {(form.cuotasPropuestas || []).map((c, idx) => (
                          <div
                            key={`${c.numero}-${c.fechaISO}-${idx}`}
                            className="grid grid-cols-12 items-center px-3 py-2 odd:bg-muted/10 hover:bg-muted/20 transition-colors"
                          >
                            {/* Número */}
                            <div className="col-span-1 flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm tabular-nums">
                                {c.numero}
                              </span>
                            </div>

                            {/* Fecha */}
                            <div className="col-span-5 pr-2">
                              <Input
                                type="date"
                                value={c.fechaISO}
                                disabled={!editingCuotas}
                                onChange={(e) =>
                                  updateCuotaFecha(idx, e.target.value)
                                }
                                className="h-9"
                              />
                            </div>

                            {/* Monto con prefijo Q */}
                            <div className="col-span-4 pr-2">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  Q
                                </span>
                                <Input
                                  type="number"
                                  step={0.01}
                                  min={0}
                                  value={c.monto}
                                  disabled={!editingCuotas}
                                  onChange={(e) =>
                                    updateCuota(idx, {
                                      monto: r2(Number(e.target.value || 0)),
                                    })
                                  }
                                  className="h-9 pl-6"
                                />
                              </div>
                            </div>

                            {/* Etiqueta */}
                            <div className="col-span-2 flex justify-end">
                              {c.etiqueta === "ENGANCHE" ? (
                                <Badge variant="secondary" className="text-xs">
                                  ENGANCHE
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Normal
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="md:hidden px-3 pb-3 space-y-2">
                    {(form.cuotasPropuestas || []).map((c, idx) => (
                      <div
                        key={`m-${c.numero}-${c.fechaISO}-${idx}`}
                        className="rounded-lg border bg-background p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-medium">
                              {c.numero}
                            </span>
                            {c.etiqueta === "ENGANCHE" ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                ENGANCHE
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Normal
                              </Badge>
                            )}
                          </div>
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">
                              Fecha
                            </Label>
                            <Input
                              type="date"
                              value={c.fechaISO}
                              disabled={!editingCuotas}
                              onChange={(e) =>
                                updateCuotaFecha(idx, e.target.value)
                              }
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground">
                              Monto
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                Q
                              </span>
                              <Input
                                type="number"
                                step={0.01}
                                min={0}
                                value={c.monto}
                                disabled={!editingCuotas}
                                onChange={(e) =>
                                  updateCuota(idx, {
                                    monto: r2(Number(e.target.value || 0)),
                                  })
                                }
                                className="h-9 pl-6"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comentario opcional */}
              <div className="space-y-2">
                <Label>Comentario</Label>
                <Textarea
                  value={form.comentario || ""}
                  disabled={readOnly}
                  onChange={(e) => setField("comentario", e.target.value)}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">Comprobación:</span>
                <span> Total = {totalUI.toFixed(2)} GTQ</span>
                <span>· Enganche = {engancheUI.toFixed(2)}</span>
                <span>· Principal = {principalUI.toFixed(2)}</span>
                <span>· Suma cuotas = {sumCuotasSinEnganche.toFixed(2)}</span>
                {interesPct > 0 && (
                  <span>
                    · Interés (no aplicado a cuotas) = {interesPct.toFixed(2)}%
                  </span>
                )}
                {!isConsistent && (
                  <span className="text-red-500">
                    · Inconsistencia en montos
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSubmit}
                >
                  Recalcular y validar
                </Button>
                <Button
                  type="button"
                  onClick={() => setOpenCreateRequest(true)}
                  className="gap-2"
                >
                  <FileCheck2 className="h-4 w-4" /> Enviar a aprobación
                </Button>

                <AdvancedDialog
                  type="warning"
                  title="Autorización de Crédito Venta"
                  description="Se procederá a notificar a los administradores sobre el registro y se creará el crédito a partir de tus datos ingresados. ¿Estás seguro de enviar estos datos? Esta acción no se puede deshacer."
                  onOpenChange={setOpenCreateRequest}
                  open={openCreateRequest}
                  confirmButton={{
                    label: "Enviar solicitud",
                    disabled: isPendingCreditRequest,
                    loading: isPendingCreditRequest,
                    loadingText: "Enviando petición...",
                    onClick: () => {
                      (handleCreateCreditRequest(buildSolicitudPayload(form)),
                        setOpenCreateRequest(false));
                    },
                  }}
                  cancelButton={{
                    label: "Cancelar",
                    disabled: isPendingCreditRequest,
                    onClick: () => setOpenCreateRequest(false),
                  }}
                />
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function buildSolicitudPayload(form: FormCreditoState): BuildPayload {
  if (!form.clienteId) {
    throw new Error("clienteId es requerido por el DTO del servidor.");
  }

  const lineas: LineaPayload[] = (form.lineas || [])
    .map((l) => {
      const cantidad = toInt(l.cantidad);
      const precioUnitario = toMoney(l.precioUnitario);
      const precioListaRef = toMoney(
        (l as any).precioListaRef ?? cantidad * precioUnitario,
      );
      const subtotal = toMoney(l.subtotal ?? cantidad * precioUnitario);

      const productoId = l.productoId ?? undefined;
      const presentacionId = l.presentacionId ?? undefined;

      return {
        productoId,
        presentacionId,
        cantidad,
        precioUnitario,
        precioListaRef,
        subtotal,
        precioSeleccionadoId: l.precioSeleccionadoId,
      };
    })
    .filter((ln) => ln.productoId || ln.presentacionId);

  if (lineas.length === 0) {
    throw new Error(
      "Debe existir al menos una línea válida (producto o presentación).",
    );
  }

  const cuotasPropuestas: CuotaPropuestaPayload[] = (
    form.cuotasPropuestas || []
  )
    .map((c) => ({
      numero: toInt(c.numero),
      fechaISO: c.fechaISO,
      monto: toMoney(c.monto),
      etiqueta: c.etiqueta ?? (c.numero === 0 ? "ENGANCHE" : "NORMAL"),
    }))
    .sort((a, b) => a.numero - b.numero);

  if (cuotasPropuestas.length === 0) {
    throw new Error("Debe enviar al menos una cuota propuesta.");
  }

  const engancheDeCuotas =
    cuotasPropuestas.find((q) => q.etiqueta === "ENGANCHE")?.monto ?? 0;
  const enganchePorPlan =
    form.planCuotaModo === "PRIMERA_MAYOR"
      ? toMoney(form.cuotaInicialPropuesta)
      : 0;
  const cuotaInicialPropuesta =
    engancheDeCuotas > 0 ? engancheDeCuotas : enganchePorPlan || undefined;

  // ===== Cabecera =====
  const payload: BuildPayload = {
    sucursalId: toInt(form.sucursalId),
    clienteId: toInt(form.clienteId),
    totalPropuesto: toMoney(form.totalPropuesto),
    cuotaInicialPropuesta, // opcional si 0
    cuotasTotalesPropuestas: toInt(form.cuotasTotalesPropuestas || 1),
    interesTipo: form.interesTipo as InteresTipoServer,
    interesPorcentaje: toInt(form.interesPorcentaje || 0),
    planCuotaModo: form.planCuotaModo as PlanCuotaModoServer,
    diasEntrePagos: toInt(form.diasEntrePagos || 30),
    fechaPrimeraCuota: form.fechaPrimeraCuota || undefined,
    comentario: form.comentario || undefined,
    solicitadoPorId: toInt(form.solicitadoPorId),
    lineas,
    cuotasPropuestas,
    fecha: form.fecha,
  };

  return payload;
}
