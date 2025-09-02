"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Building2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { format } from "date-fns";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { TZGT } from "@/Pages/Utils/Utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getHistoricoGlobal } from "../api/api";
import { es } from "date-fns/locale";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("es");

/**
 * \n==================== INTERFACES ALINEADAS AL SERVER ====================
 */
interface DayRow {
  fecha: string; // YYYY-MM-DD
  snapshotId: number | null;
  caja: { inicio: number; ingresos: number; egresos: number; final: number };
  banco: { inicio: number; ingresos: number; egresos: number; final: number };
  ventas: { total: number; cantidad: number };
  depositos: { monto: number; cantidad: number };
  flags: { sinSnapshot: boolean };
}

interface HistoricoGlobalResponse {
  scope: "GLOBAL" | "SUCURSAL";
  filtro: { from: string; to: string; tz: string; sucursalId: number | null };
  days: DayRow[];
  periodSummary: {
    caja: { ingresos: number; egresos: number; final: number };
    banco: { ingresos: number; egresos: number; final: number };
    ventas: { total: number; cantidad: number };
    depositos: { monto: number; cantidad: number };
  };
  periodEnd: { cajaFinal: number; bancoFinal: number };
  topSucursales: Array<{
    sucursalId: number;
    cajaFinal: number;
    bancoFinal: number;
  }>;
}

// ==================== HELPERS ====================
const currency = (n?: number) =>
  (n ?? 0).toLocaleString("es-GT", {
    style: "currency",
    currency: "GTQ",
    maximumFractionDigits: 2,
  });

const formatCompact = (n?: number) => {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
};

type RangeTuple = [Date | null, Date | null];

function HistoricoGlobal() {
  const [dateRange, setDateRange] = useState<RangeTuple>([
    dayjs().tz(TZGT).subtract(9, "day").startOf("day").toDate(),
    dayjs().tz(TZGT).startOf("day").toDate(),
  ]);

  const [startDate, endDate] = dateRange;
  const handleSelectRange = (update: [Date | null, Date | null] | null) => {
    if (!update) return setDateRange([null, null]);
    const [start, end] = update;
    setDateRange([start, end]);
  };

  // Fechas para el server (YYYY-MM-DD en zona GT)
  const fromISO = startDate
    ? dayjs(startDate).tz(TZGT).format("YYYY-MM-DD")
    : null;
  const toISO = endDate ? dayjs(endDate).tz(TZGT).format("YYYY-MM-DD") : null;

  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<HistoricoGlobalResponse | null>(
    null
  );

  async function fetchData() {
    if (!fromISO || !toISO) return;
    try {
      setLoading(true);
      const dt = await getHistoricoGlobal(fromISO, toISO); // el controller setea tz por defecto
      setHistorico(dt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Debounce sencillo
  useEffect(() => {
    if (!fromISO || !toISO) return;
    const id = setTimeout(fetchData, 400);
    return () => clearTimeout(id);
  }, [fromISO, toISO]);

  // ==================== DERIVADOS PARA GRAFICAS ====================
  const trendData = useMemo(() => {
    if (!historico?.days?.length)
      return [] as Array<{ fecha: string; total: number }>;
    return historico.days.map((d) => ({
      fecha: format(new Date(d.fecha), "dd/MM"),
      total: (d.caja?.final ?? 0) + (d.banco?.final ?? 0),
    }));
  }, [historico]);

  const flowData = useMemo(() => {
    if (!historico?.days?.length)
      return [] as Array<{
        fecha: string;
        ingresos: number;
        egresos: number;
        ventas: number;
        depositos: number;
      }>;
    return historico.days.map((d) => ({
      fecha: format(new Date(d.fecha), "dd/MM"),
      ingresos: (d.caja?.ingresos ?? 0) + (d.banco?.ingresos ?? 0),
      egresos: (d.caja?.egresos ?? 0) + (d.banco?.egresos ?? 0),
      ventas: d.ventas?.total ?? 0,
      depositos: d.depositos?.monto ?? 0,
    }));
  }, [historico]);

  // Tendencias (comparar primer vs último día)
  const cajaTrendUp = useMemo(() => {
    const days = historico?.days ?? [];
    if (days.length < 2) return undefined;
    const first = days[0].caja?.final ?? 0;
    const last = days[days.length - 1].caja?.final ?? 0;
    return last >= first;
  }, [historico]);

  const bancoTrendUp = useMemo(() => {
    const days = historico?.days ?? [];
    if (days.length < 2) return undefined;
    const first = days[0].banco?.final ?? 0;
    const last = days[days.length - 1].banco?.final ?? 0;
    return last >= first;
  }, [historico]);

  // ==================== UI ====================
  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <DatePicker
              locale={es}
              selectsRange
              startDate={startDate ?? undefined}
              endDate={endDate ?? undefined}
              onChange={handleSelectRange}
              onChangeRaw={(e) => {
                if (e) e.preventDefault();
              }}
              isClearable
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecciona rango"
              className="h-10 w-[280px] sm:w-[320px] rounded-md border border-input bg-background pl-9 pr-9 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2"
              popperClassName="z-50"
              popperPlacement="bottom-start"
              showPopperArrow={false}
              dayClassName={() =>
                "rounded-md text-sm hover:bg-accent hover:text-accent-foreground"
              }
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
          </div>
        </CardContent>
      </Card>

      {historico && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            title="Caja Final"
            value={currency(historico.periodSummary?.caja?.final)}
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
            trend={cajaTrendUp}
          />
          <KpiCard
            title="Banco Final"
            value={currency(historico.periodSummary?.banco?.final)}
            icon={<Building2 className="h-5 w-5 text-blue-600" />}
            trend={bancoTrendUp}
          />
          <KpiCard
            title="Ventas Totales"
            value={currency(historico.periodSummary?.ventas?.total)}
            sub={`${
              historico.periodSummary?.ventas?.cantidad ?? 0
            } transacciones`}
            icon={<CreditCard className="h-5 w-5 text-purple-600" />}
          />
          <KpiCard
            title="Depósitos"
            value={currency(historico.periodSummary?.depositos?.monto)}
            sub={`${
              historico.periodSummary?.depositos?.cantidad ?? 0
            } depósitos`}
            icon={<TrendingUp className="h-5 w-5 text-orange-600" />}
          />
        </div>
      )}

      {/* GRAFICOS */}
      {historico && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Flujo combinado */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Flujo de Efectivo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={flowData}>
                  <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatCompact}
                  />
                  <Tooltip formatter={(v: number) => currency(v)} />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#10B981"
                    fillOpacity={0.2}
                  />
                  <Area
                    type="monotone"
                    dataKey="egresos"
                    stroke="#EF4444"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Balance total */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Balance Total (Caja+Banco)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatCompact}
                  />
                  <Tooltip formatter={(v: number) => currency(v)} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ventas vs Depósitos por día */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Ventas vs Depósitos (diario)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={flowData}>
                  <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatCompact}
                  />
                  <Tooltip formatter={(v: number) => currency(v)} />
                  <Bar dataKey="ventas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="depositos"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top sucursales (solo si viene) */}
          {historico.topSucursales?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Top Sucursales (saldo final en rango)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 pr-3 font-medium">Sucursal</th>
                        <th className="py-2 pr-3 font-medium">Caja Final</th>
                        <th className="py-2 pr-3 font-medium">Banco Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historico.topSucursales.map((s) => (
                        <tr
                          key={s.sucursalId}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="py-2 pr-3">#{s.sucursalId}</td>
                          <td className="py-2 pr-3">{currency(s.cajaFinal)}</td>
                          <td className="py-2 pr-3">
                            {currency(s.bancoFinal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* DETALLE DIARIO */}
      {historico && historico.days.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalle Diario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3 font-medium">Fecha</th>
                    <th className="py-2 pr-3 font-medium">Caja</th>
                    <th className="py-2 pr-3 font-medium">Banco</th>
                    <th className="py-2 pr-3 font-medium">Ventas</th>
                    <th className="py-2 pr-3 font-medium">Depósitos</th>
                    <th className="py-2 pr-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.days.map((d) => (
                    <tr key={d.fecha} className="border-b hover:bg-muted/50">
                      <td className="py-2 pr-3 font-medium">
                        {format(new Date(d.fecha), "dd/MM")}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {currency(d.caja?.final)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            +{currency(d.caja?.ingresos)} -
                            {currency(d.caja?.egresos)}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {currency(d.banco?.final)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            +{currency(d.banco?.ingresos)} -
                            {currency(d.banco?.egresos)}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {currency(d.ventas?.total)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {d.ventas?.cantidad ?? 0} trans.
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {currency(d.depositos?.monto)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {d.depositos?.cantidad ?? 0} dep.
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {d.flags?.sinSnapshot ? (
                            <Badge variant="secondary" className="text-xs">
                              Sin snapshot
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="text-xs bg-green-100 text-green-800"
                            >
                              OK
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && (!historico || historico.days.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Selecciona un rango de fechas para ver el histórico.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default HistoricoGlobal;

function KpiCard({
  title,
  value,
  sub,
  icon,
  trend,
}: {
  title: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  trend?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-lg font-semibold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="flex flex-col items-center gap-1">
            {icon}
            {trend !== undefined &&
              (trend ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
