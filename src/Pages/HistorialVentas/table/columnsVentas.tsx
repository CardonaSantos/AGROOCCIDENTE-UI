// components/ventas/table/columnsVentas.tsx
import type { ColumnDef } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Eye,
  FileSpreadsheet,
  FileText,
  Trash2,
  Package,
  Calendar,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { VentaItem, VentaResumen } from "../interfaces/VentasHistorialResponse";

/** Meta para callbacks desde el contenedor (acciones) */
declare module "@tanstack/table-core" {
  interface TableMeta<TData extends unknown> {
    onView?: (row: VentaResumen) => void;
    onDelete?: (row: VentaResumen) => void;
  }
}

const columnHelper = createColumnHelper<VentaResumen>();

const formatFecha = (iso: string | null | undefined) =>
  iso ? format(new Date(iso), "dd/MM/yyyy", { locale: es }) : "—";

const formatHora = (iso: string | null | undefined) =>
  iso ? format(new Date(iso), "HH:mm", { locale: es }) : "—";

const ProductosMini = ({ items }: { items: VentaItem[] }) => {
  const count = items?.length ?? 0;
  const totalUnidades =
    items?.reduce((a, it) => a + (it?.cantidad ?? 0), 0) ?? 0;

  if (!count) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
        {totalUnidades} und
      </Badge>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <Package className="h-3.5 w-3.5 mr-1" />
            {count} ítems
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[420px]">
          <div className="text-sm">
            <div className="font-medium mb-2">Detalle de ítems</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1 pr-2">Nombre</th>
                  <th className="py-1 pr-2">Tipo</th>
                  <th className="py-1 pr-2 text-center">Cant.</th>
                  <th className="py-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const sub = (it.cantidad ?? 0) * (it.precioVenta ?? 0);
                  return (
                    <tr
                      key={`${it.type}-${it.ventaProductoId}`}
                      className="border-t"
                    >
                      <td className="py-1 pr-2">{it.nombre ?? "—"}</td>
                      <td className="py-1 pr-2">
                        {it.type === "PRESENTACION"
                          ? "Presentación"
                          : "Producto"}
                      </td>
                      <td className="py-1 pr-2 text-center">
                        {it.cantidad ?? 0}
                      </td>
                      <td className="py-1 text-right">
                        {formattMonedaGT(sub)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const columnsVentas: ColumnDef<VentaResumen, any>[] = [
  columnHelper.accessor((row) => row.id, {
    id: "id",
    header: "#",
    enableSorting: true,
    cell: (info) => (
      <span className="font-mono">#{info.getValue<number>()}</span>
    ),
    meta: { thClass: "w-[80px]" },
  }),

  // IMPORTANTE: usa id "clienteNombre" para que el sort server-side funcione
  columnHelper.display({
    id: "clienteNombre",
    header: "Cliente",
    enableSorting: true,
    cell: (info) => {
      const v = info.row.original;
      const nombre = v?.clienteNombre ?? "Consumidor Final";
      const tel = v?.clienteTelefono ?? null;
      return (
        <div className="min-w-0">
          <div className="truncate font-medium">{nombre}</div>
          <div className="text-xs text-muted-foreground truncate">
            {tel ? `Tel: ${tel}` : "Sin teléfono"}
          </div>
        </div>
      );
    },
  }),

  // IMPORTANTE: id "fechaVenta" para que al ordenar enviemos ese key al backend
  columnHelper.display({
    id: "fechaVenta",
    header: "Fecha",
    enableSorting: true,
    cell: (info) => {
      const v = info.row.original;
      return (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatFecha(v?.fecha)}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatHora(v?.hora)}
          </div>
        </div>
      );
    },
    meta: { thClass: "w-[120px]" },
  }),

  columnHelper.display({
    id: "items",
    header: "Ítems",
    enableSorting: false,
    cell: (info) => <ProductosMini items={info.row.original.items ?? []} />,
    meta: { thClass: "w-[180px]" },
  }),

  // IMPORTANTE: id "totalVenta" para sort server-side aunque el campo sea 'total'
  columnHelper.display({
    id: "totalVenta",
    header: "Total",
    enableSorting: true,
    cell: (info) => {
      const v = info.row.original;
      return (
        <span className="font-semibold">{formattMonedaGT(v.total ?? 0)}</span>
      );
    },
    meta: { thClass: "w-[120px]" },
  }),

  columnHelper.display({
    id: "acciones",
    header: "Acciones",
    enableSorting: false,
    cell: (info) => {
      const v = info.row.original;
      const resumen = (v.metodoPagoResumen || "").toUpperCase();
      const isCreditoOUnoRestringido =
        resumen.includes("CREDITO") ||
        resumen.includes("CRÉDITO") ||
        resumen.includes("OTRO");
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Ver detalles"
            onClick={() => info.table.options.meta?.onView?.(v)}
          >
            <Eye className="h-4 w-4" />
          </Button>

          <Link to={`/venta/generar-factura/${v.id}`}>
            <Button
              variant="outline"
              size="icon"
              aria-label="Imprimir Comprobante"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </Link>

          <Link to={`/garantía/generar-garantía/${v.id}`}>
            <Button
              variant="outline"
              size="icon"
              aria-label="Imprimir Garantía"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="icon"
            aria-label="Eliminar"
            disabled={isCreditoOUnoRestringido}
            onClick={() => info.table.options.meta?.onDelete?.(v)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    meta: { thClass: "w-[200px]" },
  }),
];
