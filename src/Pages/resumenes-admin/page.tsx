"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, AlertTriangle } from "lucide-react";

import { fetchResumen, getSucursalesArray } from "./api/api";

import { KPICard } from "./_components/kpi-card";
import { SalesChart } from "./_components/sales-chart";
import { ExpensesChart } from "./_components/expenses-chart";
import { ComparisonChart } from "./_components/comparison-chart";
import { DepositsTable } from "./_components/deposits-table";
import { DashboardSkeleton } from "./_components/loading-skeleton";
import { formattFecha, TZGT } from "../Utils/Utils";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { formatPercentage } from "./format";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import { toast } from "sonner";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";
import ReactSelectComponent from "react-select";
import { Label } from "@/components/ui/label";
import { es } from "date-fns/locale";
import { ResumenDiarioAdminResponse } from "./interfaces/resumen";

type Option = { value: string; label: string };
type Sucursal = { id: number; nombre: string };

export default function ResumenDiarioPage() {
  const todayStr = () => dayjs().tz(TZGT).format("YYYY-MM-DD");

  const [data, setData] = useState<ResumenDiarioAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // React Select (sucursales)
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const options: Option[] = sucursales.map((s) => ({
    label: s.nombre,
    value: String(s.id),
  }));
  const [sucursalSelected, setSucursalSelected] = useState<Option | null>(null);

  // Fecha (día)
  const [date, setDate] = useState<string>(todayStr());

  const handleSelectSucursal = (optionSelected: Option | null) => {
    setSucursalSelected(optionSelected);
  };

  const handleChangeDate = (selected: Date | null) => {
    if (!selected) {
      setDate(todayStr());
      return;
    }
    setDate(dayjs(selected).tz(TZGT).format("YYYY-MM-DD"));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!sucursalSelected || !date) return;
      const result = await fetchResumen(String(sucursalSelected.value), date);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };
  console.log("La data es: ", data);

  const loadSucursales = async () => {
    try {
      const dt = await getSucursalesArray();
      setSucursales(dt);
      if (dt.length > 0 && !sucursalSelected) {
        setSucursalSelected({ label: dt[0].nombre, value: String(dt[0].id) });
      }
    } catch (e) {
      toast.error(getApiErrorMessageAxios(e));
    }
  };

  useEffect(() => {
    loadSucursales();
  }, []);

  useEffect(() => {
    if (sucursalSelected && date) {
      loadData();
    }
  }, [sucursalSelected, date]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  // ---- KPIs derivados (se mantienen) ----
  const utilidadOperativa =
    data.ventas.total -
    data.egresos.costosVenta.total -
    data.egresos.gastosOperativos.total;

  const margenOperativo =
    data.ventas.total > 0 ? utilidadOperativa / data.ventas.total : 0;

  // ---- Shortcuts de transferencias/comparativos ----
  const dep = data.transferencias.depositoCierre;
  const comp = data.comparativos;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              Resumen Diario – Sucursal #{data.sucursalId}
            </h1>
            <p className="text-muted-foreground">{formattFecha(data.fecha)}</p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refrescar
          </Button>
        </div>
      </motion.div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label className="font-medium">Selecciona una fecha:</Label>
            <DatePicker
              isClearable={false}
              locale={es}
              selected={dayjs.tz(date, "YYYY-MM-DD", TZGT).toDate()}
              onChange={handleChangeDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/yyyy"
              className="border rounded p-2 text-black font-semibold"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="font-medium" htmlFor="Sucursal">
              Seleccionar sucursal:
            </Label>
            <ReactSelectComponent
              id="Sucursal"
              options={options}
              onChange={handleSelectSucursal}
              value={sucursalSelected}
              isClearable
              isSearchable
              placeholder="Seleccione una sucursal"
            />
          </div>

          <div className="flex items-end">
            <div className="text-sm text-muted-foreground">
              Sucursal seleccionada:{" "}
              <span className="font-medium">
                {sucursalSelected?.label ?? "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <KPICard
          title="Caja – Final Operativo"
          value={data.caja.finalOperativo}
          subtitle={`Operativo = Inicio (${formattMonedaGT(
            data.caja.inicio
          )}) + Ingresos (${formattMonedaGT(
            data.caja.ingresos
          )}) − Egresos s/ Cierre (${formattMonedaGT(
            data.caja.egresosSinCierre
          )})`}
          index={0}
        />
        <KPICard
          title="Caja – Final Físico"
          value={data.caja.finalFisico}
          subtitle={`Físico = Inicio + Ingresos − Egresos (${formattMonedaGT(
            data.caja.egresos
          )})`}
          index={1}
        />
        <KPICard
          title="Banco – Final"
          value={data.banco.final}
          subtitle={`Inicio: ${formattMonedaGT(
            data.banco.inicio
          )} | Ingresos: ${formattMonedaGT(
            data.banco.ingresos
          )} | Egresos: ${formattMonedaGT(data.banco.egresos)}`}
          index={2}
        />
        <KPICard
          title="Ventas del Día"
          value={data.ventas.total}
          subtitle={`${
            data.ventas.cantidad
          } transacciones • Ticket: ${formattMonedaGT(
            data.ventas.ticketPromedio
          )}`}
          index={3}
        />
        <KPICard
          title="Utilidad Operativa"
          value={utilidadOperativa}
          subtitle={`Margen: ${formatPercentage(margenOperativo)}`}
          badge={{
            text: utilidadOperativa >= 0 ? "Positiva" : "Negativa",
            variant: utilidadOperativa >= 0 ? "default" : "destructive",
          }}
          index={4}
        />
        <KPICard
          title="Depósito de Cierre"
          value={dep.montoBanco}
          subtitle={`${
            dep.cantidad
          } depósitos • Caja → Banco: ${formattMonedaGT(dep.montoCaja)}`}
          index={5}
        />
        <KPICard
          title="Cuadre Caja vs Efectivo"
          value={data.comparativos.variacionCajaVsVentasEfectivo}
          subtitle={`Neto Caja (op): ${formattMonedaGT(
            data.comparativos.netoCajaOperativo
          )} • Efectivo ventas: ${formattMonedaGT(
            data.comparativos.efectivoVentas
          )}`}
          badge={{
            text: data.comparativos.alertas.length > 0 ? "Alerta" : "OK",
            variant:
              data.comparativos.alertas.length > 0 ? "destructive" : "default",
          }}
          index={6}
        />
      </div>

      {/* Semáforos (ventas y depósito) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Semáforos del día</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span>Ventas en efectivo</span>
              <Badge variant={comp.ventasOk ? "default" : "destructive"}>
                {comp.ventasOk ? "OK" : "Revisar"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Ingresos caja por ventas
              {comp.ingresosCajaPorVentasEstimado ? " (estimado)" : ""}:{" "}
              <b>{formattMonedaGT(comp.ingresosCajaPorVentas)}</b> • Efectivo
              reportado: <b>{formattMonedaGT(data.ventas.efectivo)}</b> •
              Diferencia:{" "}
              <b>{formattMonedaGT(comp.deltaVentasCajaVsEfectivo)}</b>
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span>Depósito de cierre</span>
              <Badge variant={comp.depositoOk ? "default" : "destructive"}>
                {comp.depositoOk ? "OK" : "Excede disponible"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Disponible antes de depositar:{" "}
              <b>{formattMonedaGT(comp.cajaDisponibleAntesDeDepositar)}</b> •
              Depósito caja: <b>{formattMonedaGT(comp.depositoCierreCaja)}</b> •
              Exceso: <b>{formattMonedaGT(comp.excesoDeposito)}</b>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alertas (si las hay) */}
      {data.comparativos.alertas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {data.comparativos.alertas.map((msg, i) => (
                  <div key={i}>{msg}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={data.ventas.porMetodo} />
        <ExpensesChart
          costosVenta={{
            caja: data.egresos.costosVenta.caja,
            banco: data.egresos.costosVenta.banco,
          }}
          gastosOperativos={{
            caja: data.egresos.gastosOperativos.caja,
            banco: data.egresos.gastosOperativos.banco,
          }}
        />
        <ComparisonChart
          netoCajaOperativo={data.comparativos.netoCajaOperativo}
          efectivoVentas={data.comparativos.efectivoVentas}
        />

        {/* Transferencias / Validaciones */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Transferencias (Caja ⇆ Banco)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-muted-foreground">
                    Depósito de cierre → Banco
                  </div>
                  <div className="font-medium">
                    {formattMonedaGT(dep.montoBanco)}
                  </div>
                  <div className="text-muted-foreground">
                    Desde Caja (egreso): {formattMonedaGT(dep.montoCaja)}
                  </div>
                  <div className="text-muted-foreground">
                    Cantidad: {dep.cantidad}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    Transferencia Banco → Caja
                  </div>
                  <div className="font-medium">
                    {formattMonedaGT(data.transferencias.bancoACaja)}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-muted-foreground">
                    Caja disp. antes de depositar
                  </div>
                  <div className="font-medium">
                    {formattMonedaGT(
                      data.transferencias.validaciones
                        .cajaDisponibleAntesDeDepositar
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    Exceso de depósito
                  </div>
                  <div className="font-medium">
                    {formattMonedaGT(
                      data.transferencias.validaciones.excesoDeposito
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabla de Depósitos por cuenta */}
      <DepositsTable deposits={dep.porCuenta} />
    </div>
  );
}
