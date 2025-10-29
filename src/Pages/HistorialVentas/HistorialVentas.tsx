// pages/ventas/HistorialVentasMain.tsx
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

registerLocale("es", es);

/** ---------- Filtros (UI) compatibles con QueryVentasTable ---------- */
type QueryVentasUI = {
  page: number;
  limit: number;
  // El backend sigue recibiendo estos nombres aunque los campos de data sean fecha/total
  sortBy: "fechaVenta" | "totalVenta" | "clienteNombre";
  sortDir: "asc" | "desc";
  sucursalId: number;
  texto?: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  referenciaPago?: string;
  codigoItem?: string;
  fechaDesde?: string; // 'YYYY-MM-DD'
  fechaHasta?: string; // 'YYYY-MM-DD'
  montoMin?: number;
  montoMax?: number;
  tipoComprobante?: TipoComprobante[];
  cats?: number[];
  //flags de filtrado ventas mias o global
  isVendedor: boolean;
  usuarioId: number;
  metodoPago?: string[];
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

/** Multi-select simple con checkboxes (para método de pago / comprobante) */
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

  // ---------- Estado de filtros ----------
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
  // UI: Dialog eliminar
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [ventaEliminar, setVentaEliminar] = useState<{
    venta: VentaResumen | null;
    motivo: string;
    adminPassword: string;
  }>({ venta: null, motivo: "", adminPassword: "" });
  const textoDeferred = useDeferredValue(texto);
  // Construimos objeto de query params compatibles con backend
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
      metodoPago: metodosPago.length ? metodosPago : undefined, // <--- AQUÍ
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
    ]
  );

  // ---------- Fetch con tu wrapper ----------
  const {
    data: ventasPage,
    isFetching, // 👈 usar este para spinners
    isError,
  } = useApiQuery<VentasApiResponse>(
    ventasHistorialKeys.listSucursal(sucursalId, queryParams),
    `/venta/find-my-sucursal-sales/${sucursalId}`,
    { params: queryParams },
    {
      enabled: Number.isFinite(sucursalId) && sucursalId > 0,
      placeholderData: keepPreviousData, // 👈 clave
      staleTime: 30_000,
      refetchOnWindowFocus: false, // 👈 evita “brincos”
    }
  );

  // ---------- Mutación para eliminar venta ----------
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

  // ---------- Handlers ----------
  const onChangePage = (next: number) => setPage(next);
  const onChangeLimit = (next: number) => {
    setLimit(next);
    setPage(1);
  };

  const onSortChange = (
    by: PaginationMeta["sortBy"],
    dir: PaginationMeta["sortDir"]
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
      usuarioId: userId, // ahora sí enviamos el usuario actual
      motivo: ventaEliminar.motivo,
      totalVenta: v.total,
      productos,
      ventaId: v.id,
      sucursalId,
      adminPassword: ventaEliminar.adminPassword,
    };
    console.log("El payload de eliminacion es: ", payload);

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
    <div className="max-w-7xl ">
      {/* Header */}
      <PageHeader
        title="Historial de ventas"
        fallbackBackTo="/"
        sticky={false}
        subtitle="Filtre y vea el detalle de sus ventas"
      />

      {/* Filtros */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">
                Texto
              </label>
              <Input
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  // setPage(1);
                }}
                placeholder="Buscar cliente, referencia, código, etc."
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
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
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Monto mínimo
              </label>
              <Input
                inputMode="decimal"
                value={montoMin}
                onChange={(e) => {
                  setMontoMin(e.target.value);
                  setPage(1);
                }}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Monto máximo
              </label>
              <Input
                inputMode="decimal"
                value={montoMax}
                onChange={(e) => {
                  setMontoMax(e.target.value);
                  setPage(1);
                }}
                placeholder="9999.00"
              />
            </div>

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

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="secondary"
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
              }}
            >
              Limpiar filtros
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Límite</span>
              <select
                className="h-8 rounded-md border bg-background px-2 text-sm"
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
