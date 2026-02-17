import { useDeferredValue, useMemo, useState } from "react";
import { useStore } from "@/components/Context/ContextSucursal";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";
import dayjs from "dayjs";
registerLocale("es", es);
import { Badge } from "@/components/ui/badge";
import { formattMonedaGT } from "@/utils/formattMoneda";
import {
  PaginationMeta,
  TipoComprobante,
  VentaResumen,
  VentasApiResponse,
} from "./interfaces/VentasHistorialResponse";
import TableVentas from "./table/TableVentas";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import { PageHeader } from "@/utils/components/PageHeaderPos";
import VentaDetalleDialog from "../POS/VentaDetalleDialog";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { ventasHistorialKeys } from "./Keys/query";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";
import { useGetUsersToSelect } from "@/hooks/users/use-users";
import { OptionSelected } from "@/Types/ReactSelect/types.interfaces";
import ReactSelectComponent from "react-select";

type QueryVentasUI = {
  page: number;
  limit: number;
  sortBy: "fechaVenta" | "totalVenta" | "clienteNombre";
  sortDir: "asc" | "desc";
  sucursalId: number;
  texto?: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  referenciaPago?: string;
  codigoItem?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  montoMin?: number;
  montoMax?: number;
  tipoComprobante?: TipoComprobante[];
  cats?: number[];
  isVendedor: boolean;
  usuarioId: number;
  metodoPago?: string[];
  user: number | null;
};

const defaultMeta: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
  sortBy: "fechaVenta",
  sortDir: "desc",
};

function MultiChecks({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="border rounded-md p-2">
      <div className="text-xs font-medium mb-1">{label}</div>
      <div className="flex flex-wrap gap-3">
        {options.map((op) => {
          const checked = values.includes(op.value);
          return (
            <label
              key={op.value}
              className="text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                className="accent-primary"
                checked={checked}
                onChange={() => {
                  const next = checked
                    ? values.filter((v) => v !== op.value)
                    : [...values, op.value];
                  onChange(next);
                }}
              />
              <span>{op.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function HistorialVentasMain() {
  const queryClient = useQueryClient();
  const sucursalId = useStore((s) => s.sucursalId) ?? 0;
  const userId = useStore((s) => s.userId) ?? 0;
  const rol = useStore((s) => s.userRol) ?? "";

  const [texto, setTexto] = useState<string>("");
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);
  const [montoMin, setMontoMin] = useState<string>("");
  const [montoMax, setMontoMax] = useState<string>("");
  const [metodosPago, setMetodosPago] = useState<string[]>([]);
  const [comprobantes, setComprobantes] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [sortBy, setSortBy] = useState<QueryVentasUI["sortBy"]>("fechaVenta");
  const [sortDir, setSortDir] = useState<QueryVentasUI["sortDir"]>("desc");
  const [isOpenDetalle, setIsOpenDetalle] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] =
    useState<VentaResumen | null>(null);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [ventaEliminar, setVentaEliminar] = useState<{
    venta: VentaResumen | null;
    motivo: string;
    adminPassword: string;
  }>({ venta: null, motivo: "", adminPassword: "" });
  const textoDeferred = useDeferredValue(texto);
  const [userSelected, setUserSelected] = useState<number | null>(null);

  const isVendedor = rol === "VENDEDOR";

  const queryParams: QueryVentasUI = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortDir,
      sucursalId,
      texto: textoDeferred || undefined,
      fechaDesde: fechaDesde
        ? dayjs(fechaDesde).format("YYYY-MM-DD")
        : undefined,
      fechaHasta: fechaHasta
        ? dayjs(fechaHasta).format("YYYY-MM-DD")
        : undefined,
      montoMin: montoMin ? Number(montoMin) : undefined,
      montoMax: montoMax ? Number(montoMax) : undefined,
      isVendedor: rol !== "ADMIN",
      usuarioId: userId,
      tipoComprobante: comprobantes.length
        ? (comprobantes as TipoComprobante[])
        : undefined,
      metodoPago: metodosPago.length ? metodosPago : undefined,
      user: userSelected,
    }),
    [
      page,
      limit,
      sortBy,
      sortDir,
      sucursalId,
      textoDeferred,
      fechaDesde,
      fechaHasta,
      montoMin,
      montoMax,
      rol,
      userId,
      comprobantes,
      metodosPago,
      userSelected,
    ],
  );

  const handleSelectUserChange = (value: OptionSelected | null) => {
    setUserSelected(value ? value.value : null);
  };

  const {
    data: ventasPage,
    isFetching,
    isError,
  } = useApiQuery<VentasApiResponse>(
    ventasHistorialKeys.listSucursal(sucursalId, queryParams),
    `/venta/find-my-sucursal-sales/${sucursalId}`,
    { params: queryParams },
    {
      enabled: Number.isFinite(sucursalId) && sucursalId > 0,
      placeholderData: keepPreviousData,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  );

  const deleteMutation = useApiMutation<
    any,
    {
      usuarioId: number;
      motivo: string;
      ventaId: number;
      sucursalId: number;
      // Ajustado a nuevo payload de items
      productos: {
        cantidad: number;
        precioVenta: number;
        type: "PRODUCTO" | "PRESENTACION";
        productoId?: number;
        presentacionId?: number;
      }[];
      totalVenta: number;
      adminPassword: string;
    }
  >("post", "/sale-deleted", undefined, {
    onSuccess: () => {
      setIsOpenDelete(false);
      setVentaEliminar({ venta: null, motivo: "", adminPassword: "" });
      queryClient.invalidateQueries({ queryKey: ventasHistorialKeys.all });
    },
  });

  const meta = ventasPage?.meta ?? defaultMeta;
  const { data: rawUsers } = useGetUsersToSelect();
  const users = rawUsers ? rawUsers : [];

  const options: OptionSelected[] = users.map((u) => ({
    label: u.nombre,
    value: u.id,
  }));

  const totalVentas = useMemo(() => {
    const total =
      ventasPage?.data.reduce((acc, venta) => acc + venta.total, 0) ?? 0;

    return formattMonedaGT(total);
  }, [ventasPage]);

  // Handlers
  const onChangePage = (next: number) => setPage(next);
  const onChangeLimit = (next: number) => {
    setLimit(next);
    setPage(1);
  };

  const onSortChange = (
    by: PaginationMeta["sortBy"],
    dir: PaginationMeta["sortDir"],
  ) => {
    setSortBy(by as any);
    setSortDir(dir);
    setPage(1);
  };

  const handleViewVenta = (v: VentaResumen) => {
    setVentaSeleccionada(v);
    setIsOpenDetalle(true);
  };

  const handleAskDelete = (v: VentaResumen) => {
    setVentaEliminar({ venta: v, motivo: "", adminPassword: "" });
    setIsOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    const v = ventaEliminar.venta!;
    if (!ventaEliminar.adminPassword) {
      toast.info("Ingrese la contraseña de administrador");
      return;
    }
    if (!ventaEliminar.motivo.trim()) {
      toast.info("Ingrese el motivo de la eliminación");
      return;
    }
    const productos = (v.items ?? []).map((it) => ({
      cantidad: it.cantidad,
      precioVenta: it.precioVenta,
      type: it.type,
      productoId: it.type === "PRODUCTO" ? it.productoId : undefined,
      presentacionId:
        it.type === "PRESENTACION" ? it.presentacionId : undefined,
    }));

    const payload = {
      usuarioId: userId,
      motivo: ventaEliminar.motivo,
      totalVenta: v.total,
      productos,
      ventaId: v.id,
      sucursalId,
      adminPassword: ventaEliminar.adminPassword,
    };

    toast.promise(deleteMutation.mutateAsync(payload), {
      loading: "Eliminando registro...",
      success: "Venta eliminada",
      error: (error) => getApiErrorMessageAxios(error),
    });
  };

  // ---------- UI ----------
  if (isError) {
    return (
      <div className="p-6 text-center text-destructive">
        Error al cargar ventas.
      </div>
    );
  }

  if (!ventasPage) {
    return (
      <div className="p-6 text-center text-muted-foreground">No hay datos.</div>
    );
  }
  return (
    <div className="max-w-7xl container mx-auto">
      <PageHeader
        title="Historial de ventas"
        fallbackBackTo="/"
        sticky={false}
        subtitle="Filtre y vea el detalle de sus ventas"
      />

      {/* Filtros */}
      <Card className="mb-6 border-none shadow-sm bg-card/50">
        <CardContent className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-4 lg:col-span-5">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Búsqueda general
              </label>
              <Input
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar cliente, referencia, código..."
                className="bg-background"
              />
            </div>

            <div className="col-span-12 md:col-span-4 lg:col-span-3">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Vendedor / Usuario
              </label>
              <ReactSelectComponent
                isDisabled={isVendedor}
                options={options}
                value={
                  userSelected
                    ? (options.find((opt) => opt.value === userSelected) ??
                      null)
                    : null
                }
                onChange={handleSelectUserChange}
                placeholder="Todos"
                className="text-sm"
                isClearable
              />
            </div>

            {/* 3. Rango de Fechas */}
            <div className="col-span-6 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Desde
              </label>
              <DatePicker
                locale="es"
                selected={fechaDesde}
                onChange={(d) => {
                  setFechaDesde(d);
                  setPage(1);
                }}
                isClearable
                placeholderText="Inicio"
                className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="col-span-6 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Hasta
              </label>
              <DatePicker
                locale="es"
                selected={fechaHasta}
                onChange={(d) => {
                  setFechaHasta(d);
                  setPage(1);
                }}
                isClearable
                placeholderText="Fin"
                className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="border-t border-border/50" />

          {/* --- NIVEL 2: Filtros Financieros y TOTALES --- */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Columna Izquierda: Montos y Checks (8 columnas) */}
            <div className="col-span-12 lg:col-span-8 space-y-4">
              {/* Montos */}
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Monto Mín ($)
                  </label>
                  <Input
                    inputMode="decimal"
                    value={montoMin}
                    onChange={(e) => {
                      setMontoMin(e.target.value);
                      setPage(1);
                    }}
                    placeholder="0.00"
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Monto Max ($)
                  </label>
                  <Input
                    inputMode="decimal"
                    value={montoMax}
                    onChange={(e) => {
                      setMontoMax(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Max"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Checks */}
              <div className="flex flex-wrap gap-x-8 gap-y-2 pt-1">
                <div className="min-w-[150px]">
                  <MultiChecks
                    label="Método de pago"
                    options={[
                      { value: "EFECTIVO", label: "Contado" },
                      { value: "TARJETA", label: "Tarjeta" },
                      { value: "TRANSFERENCIA", label: "Transferencia" },
                      { value: "CREDITO", label: "Crédito" },
                      { value: "OTRO", label: "Otro" },
                    ]}
                    values={metodosPago}
                    onChange={(v) => {
                      setMetodosPago(v);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="min-w-[120px]">
                  <MultiChecks
                    label="Comprobante"
                    options={[
                      { value: "RECIBO", label: "Recibo" },
                      { value: "FACTURA", label: "Factura" },
                    ]}
                    values={comprobantes}
                    onChange={(v) => {
                      setComprobantes(v);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha: TOTALES (4 columnas) */}
            {/* AQUÍ PONDRÁS TU TOTAL */}
            <div className="col-span-12 lg:col-span-4 flex flex-col justify-center">
              <div className="bg-muted/30 border border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center h-full min-h-[100px] text-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Total Filtrado
                </span>
                {/* Aquí renderizas tu variable de total */}
                <span className="text-2xl font-bold text-primary">
                  {totalVentas ? totalVentas : "--.--"}
                </span>
              </div>
            </div>
          </div>

          {/* --- NIVEL 3: Acciones Footer --- */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTexto("");
                setFechaDesde(null);
                setFechaHasta(null);
                setMontoMin("");
                setMontoMax("");
                setMetodosPago([]);
                setComprobantes([]);
                setSortBy("fechaVenta");
                setSortDir("desc");
                setPage(1);
                // Si necesitas limpiar el usuario también, agrégalo aquí:
                // handleSelectUserChange(null);
              }}
              className="text-muted-foreground hover:text-destructive text-xs"
            >
              Limpiar filtros
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filas:</span>
              <select
                className="h-8 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                value={limit}
                onChange={(e) => onChangeLimit(Number(e.target.value))}
              >
                {[10, 20, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selección actual (para eliminar) */}
      {ventaEliminar.venta && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">#{ventaEliminar.venta.id}</Badge>
          <span className="text-muted-foreground">
            {ventaEliminar.venta.clienteNombre ?? "CF"}
          </span>
          <span className="ml-2 font-medium">
            {formattMonedaGT(ventaEliminar.venta.total)}
          </span>
        </div>
      )}

      {/* Tabla */}
      <TableVentas
        pageData={ventasPage}
        isLoading={isFetching}
        onSortChange={onSortChange}
        onViewVenta={handleViewVenta}
        onDeleteVenta={handleAskDelete}
      />

      <VentaDetalleDialog
        open={isOpenDetalle}
        onOpenChange={setIsOpenDetalle}
        venta={ventaSeleccionada as any}
        onDeleteClick={handleAskDelete}
      />

      {/* Paginación server-side */}
      <div className="flex items-center justify-center gap-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChangePage(1)}
          disabled={!meta.hasPrev}
        >
          Primero
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChangePage(Math.max(1, meta.page - 1))}
          disabled={!meta.hasPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm">
          Página <b>{meta.page}</b> de <b>{meta.totalPages || 1}</b>
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onChangePage(Math.min(meta.totalPages || 1, meta.page + 1))
          }
          disabled={!meta.hasNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChangePage(meta.totalPages || 1)}
          disabled={!meta.hasNext}
        >
          Último
        </Button>
      </div>

      {/* Dialog Eliminar */}
      <AdvancedDialog
        type="warning"
        open={isOpenDelete}
        onOpenChange={setIsOpenDelete}
        title="Eliminación de venta"
        description="Se procederá a eliminar esta venta y los registros ligados a ella."
        question="¿Estás seguro de ello?"
        confirmButton={{
          label: "Si, continuar y eliminar",
          onClick: handleConfirmDelete,
          loading: deleteMutation.isPending,
          loadingText: "Eliminando registro...",
          disabled: deleteMutation.isPending,
        }}
        cancelButton={{
          label: "Cancelar",
          onClick: () => {
            setIsOpenDelete(false);
          },
          disabled: deleteMutation.isPending,
          loadingText: "Cancelando...",
        }}
        children={
          <div className="space-y-2">
            <Textarea
              placeholder="Motivo de la eliminación"
              value={ventaEliminar.motivo}
              onChange={(e) =>
                setVentaEliminar((prev) => ({
                  ...prev,
                  motivo: e.target.value,
                }))
              }
            />
            <Input
              type="password"
              placeholder="Contraseña de administrador"
              value={ventaEliminar.adminPassword}
              onChange={(e) =>
                setVentaEliminar((prev) => ({
                  ...prev,
                  adminPassword: e.target.value,
                }))
              }
            />
          </div>
        }
      />
    </div>
  );
}
