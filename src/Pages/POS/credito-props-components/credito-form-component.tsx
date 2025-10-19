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

// Genera cuotas considerando: enganche + interés simple (si aplica)
// PRIMERA_MAYOR: solo habilita enganche y reparte el resto IGUAL.
function generarCuotas({
  totalProductos,
  enganche,
  cuotasTotales,
  plan,
  fechaPrimeraCuota,
  diasEntrePagos,
  interesTipo,
  interesPorcentaje,
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

  const principalConInteres =
    interesTipo === "SIMPLE"
      ? r2(principalBase * (1 + (Number(interesPorcentaje) || 0) / 100))
      : principalBase;

  let pesos: number[] = [];
  if (plan === "IGUALES" || plan === "PRIMERA_MAYOR") {
    pesos = Array.from({ length: n }, () => 1);
  } else if (plan === "CRECIENTES") {
    pesos = Array.from({ length: n }, (_, i) => i + 1);
  } else {
    // DECRECIENTES
    pesos = Array.from({ length: n }, (_, i) => n - i);
  }

  const montos = repartirConPesos(principalConInteres, pesos);

  for (let i = 0; i < n; i++) {
    const fecha = dayjs(fechaPrimeraCuota)
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
};

// ========================= Componente =========================
export default function CreditoForm({
  value,
  onChange,
  //   onSubmit, volver a usar?
  handleCreateCreditRequest,
  isPendingCreditRequest,
  openCreateRequest,
  setOpenCreateRequest,
  autoRecalc = true,
  readOnly = false,
}: PropsCreditoForm) {
  const form = value;
  const setForm = onChange;

  const [editingCuotas, setEditingCuotas] = React.useState(true);
  // Auto-recalcular cuotas cuando cambian campos clave
  React.useEffect(() => {
    if (!autoRecalc) return;

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
          prev.fechaPrimeraCuota || dayjs().add(30, "day").format("YYYY-MM-DD"),
        diasEntrePagos: Number(prev.diasEntrePagos || 30),
        interesTipo: prev.interesTipo,
        interesPorcentaje: Number(prev.interesPorcentaje || 0),
      });

      return { ...prev, cuotasPropuestas: cuotas };
    });
  }, [
    autoRecalc,
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
          .reduce((a, c) => a + Number(c.monto || 0), 0)
      ),
    [form.cuotasPropuestas]
  );

  const engancheUI = React.useMemo(
    () =>
      r2(
        (form.cuotasPropuestas || []).find((c) => c.etiqueta === "ENGANCHE")
          ?.monto || 0
      ),
    [form.cuotasPropuestas]
  );

  const principalUI = React.useMemo(
    () => r2(Number(form.totalPropuesto || 0) - engancheUI),
    [form.totalPropuesto, engancheUI]
  );

  // =================== Mutadores ===================
  function setField<K extends keyof FormCreditoState>(
    key: K,
    v: FormCreditoState[K]
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
          prev.fechaPrimeraCuota || dayjs().add(30, "day").format("YYYY-MM-DD"),
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
    // if (onSubmit) onSubmit(payload);//volver a usar, una de ambas con la firma del payload ya puesto para poder hacer verificaciones
    if (handleCreateCreditRequest) handleCreateCreditRequest(payload);
    else {
      console.log("Payload solicitud crédito (sin onSubmit):", payload);
      alert("Payload construido. Revisa la consola del navegador.");
    }
  }

  // =================== Render ===================
  const planEsPrimeraMayor = form.planCuotaModo === "PRIMERA_MAYOR";

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
                        r2(Number(e.target.value || 0))
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
                        Math.max(1, Number(e.target.value || 1))
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
                        Math.max(1, Number(e.target.value || 30))
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
                        // Si NO es PRIMERA_MAYOR, limpiamos el enganche
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
                                  Math.min(100, Number(e.target.value || 0))
                                )
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
                          r2(Number(e.target.value || 0))
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
                                  updateCuota(idx, { fechaISO: e.target.value })
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

                  {/* ======= Mobile / <md: cards compactas ======= */}
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
                                updateCuota(idx, { fechaISO: e.target.value })
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
                <span>
                  Total = {Number(form.totalPropuesto || 0).toFixed(2)} GTQ
                </span>
                <span>· Enganche = {engancheUI.toFixed(2)}</span>
                <span>· Principal = {principalUI.toFixed(2)}</span>
                <span>· Suma cuotas = {sumCuotas.toFixed(2)}</span>
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
                  description="Se procederá a notificar a los administradores sobre el registro y se creará el credito a partir de tus datos ingresados. ¿Estás seguro de enviar estos datos? Está acción no se puede deshacer."
                  onOpenChange={setOpenCreateRequest}
                  open={openCreateRequest}
                  confirmButton={{
                    label: "Si, continuar y enviar petición de autorización",
                    disabled: isPendingCreditRequest,
                    loading: isPendingCreditRequest,
                    loadingText: "Enviando petición...",
                    onClick: () =>
                      handleCreateCreditRequest(buildSolicitudPayload(form)),
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

// ========================= Builder de payload =========================
export function buildSolicitudPayload(form: FormCreditoState) {
  const enganche =
    form.planCuotaModo === "PRIMERA_MAYOR"
      ? r2(Number(form.cuotaInicialPropuesta || 0))
      : 0;

  return {
    sucursalId: Number(form.sucursalId),
    clienteId: form.clienteId || undefined,
    nombreCliente: form.clienteId ? undefined : form.nombreCliente || undefined,
    telefonoCliente: form.clienteId
      ? undefined
      : form.telefonoCliente || undefined,
    direccionCliente: form.clienteId
      ? undefined
      : form.direccionCliente || undefined,

    totalPropuesto: r2(Number(form.totalPropuesto || 0)),
    cuotaInicialPropuesta: enganche,
    cuotasTotalesPropuestas: Number(form.cuotasTotalesPropuestas || 1),
    interesTipo: form.interesTipo,
    interesPorcentaje: Number(form.interesPorcentaje || 0),
    planCuotaModo: form.planCuotaModo,
    diasEntrePagos: Number(form.diasEntrePagos || 30),
    fechaPrimeraCuota: form.fechaPrimeraCuota,

    comentario: form.comentario || undefined,
    garantiaMeses: Number(form.garantiaMeses || 0),
    solicitadoPorId: form.solicitadoPorId,
    lineas: (form.lineas || []).map((l) => {
      const flagItem: string = l.presentacionId ? "PRESENTACION" : "PRODUCTO";
      return {
        productoId: l.productoId,
        presentacionId: l.presentacionId,
        cantidad: Number(l.cantidad || 0),
        precioUnitario: r2(Number(l.precioUnitario || 0)),
        descuento: l.descuento ? Number(l.descuento) : undefined,
        subtotal: r2(Number(l.subtotal ?? l.cantidad * l.precioUnitario)),
        nombreProductoSnapshot: l.nombreProductoSnapshot,
        presentacionNombreSnapshot: l.presentacionNombreSnapshot,
        codigoBarrasSnapshot: l.codigoBarrasSnapshot,
        flagItem: flagItem,
      };
    }),

    planPropuesto: {
      cuotasPropuestas: (form.cuotasPropuestas || []).map((c) => ({
        numero: c.numero,
        fechaISO: c.fechaISO,
        monto: r2(Number(c.monto || 0)),
        etiqueta: c.etiqueta,
      })),
    },
  };
}
