import { createColumnHelper } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { ProductoData } from "../interfaces/newProductsPOSResponse";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Eye, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Meta que inyecta TablePOS a la tabla (para acciones) */
declare module "@tanstack/table-core" {
  interface TableMeta<TData extends unknown> {
    onAddToCart?: (p: ProductoData) => void;
    onPreviewImages?: (images: string[]) => void;
  }
}

const columnHelper = createColumnHelper<ProductoData>();

const formatQ = (v: string | number) => `Q${Number(v || 0)}`;

export const columnsTablePos: ColumnDef<ProductoData, any>[] = [
  /** Producto (sortable) */
  columnHelper.accessor((row) => row.nombre, {
    id: "nombre",
    header: "Producto",
    sortingFn: "alphanumeric",
    meta: { thClass: "w-[50%]" },

    cell: (info) => {
      const p = info.row.original;

      // urls desde p.images[] y, si vino, p.image (algunos responses lo traen)
      const urls = [
        ...(Array.isArray(p.images)
          ? (p.images.map((im) => im?.url).filter(Boolean) as string[])
          : []),
        ...((p as any).image ? [(p as any).image as string] : []),
      ];
      const first = urls[0];

      const openPreview = () => {
        if (urls.length > 0) {
          info.table.options.meta?.onPreviewImages?.(urls);
        }
      };

      return (
        <div className="min-w-0 flex items-start gap-3">
          {/* Thumb */}
          <button
            type="button"
            onClick={openPreview}
            title={urls.length ? "Ver imágenes" : "Sin imagen"}
            className={`relative shrink-0 w-12 h-12 rounded-md overflow-hidden border 
                        bg-muted/40 ${
                          urls.length
                            ? "cursor-pointer group"
                            : "cursor-default"
                        }`}
          >
            {first ? (
              <>
                <img
                  src={first}
                  alt={p.nombre}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                {/* overlay + eye */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <Eye className="absolute inset-0 m-auto h-4 w-4 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                Sin imagen
              </div>
            )}
          </button>

          {/* Texto */}
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{p.nombre}</div>
            <div className="text-xs text-muted-foreground truncate">
              {p.codigoProducto}
            </div>
            {/* opcional: deja la desc compacta */}
            {p.descripcion && (
              <div className="mt-0.5 text-[11px] text-muted-foreground/90 line-clamp-1">
                {p.descripcion}
              </div>
            )}
          </div>
        </div>
      );
    },
  }),

  /** Precios (chips compactos) */
  columnHelper.display({
    id: "precios",
    header: "Precios",
    meta: { thClass: "w-[22%]" },

    cell: (info) => {
      const precios = info.row.original.precios ?? [];
      if (!precios.length) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }

      const MAX_INLINE = 3;
      const inline = precios.slice(0, MAX_INLINE);
      const rest = precios.slice(MAX_INLINE);

      return (
        <div className="flex items-center gap-2">
          {/* Inline: sin tags/chips, estilo texto simple en columnas */}
          <div className="flex flex-col text-xs leading-5">
            {inline.map((p) => (
              <span key={p.id}>
                {p.rol}: {formatQ(p.precio)}
              </span>
            ))}
          </div>

          {/* Popover con detalle completo si hay más de 3 */}
          {rest.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  +{rest.length} más
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80">
                <div className="text-sm">
                  <div className="font-medium mb-2">Todos los precios</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-1 pr-2">Rol</th>
                        <th className="py-1 pr-2">Tipo</th>
                        <th className="py-1 text-right">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {precios.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="py-1 pr-2">{p.rol}</td>
                          <td className="py-1 pr-2">{p.tipo ?? "—"}</td>
                          <td className="py-1 text-right">
                            {formatQ(p.precio)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      );
    },
  }),

  /** Detalle con popover (stocks por sucursal) */
  columnHelper.display({
    id: "detalle",
    header: "Det.",
    meta: { thClass: "w-[72px]" }, // icono + padding

    cell: (info) => {
      const p = info.row.original;
      return (
        <Popover>
          <PopoverTrigger className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted">
            <Eye className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm">
            <div className="space-y-2">
              <div>
                <div className="font-medium">Descripción</div>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {p.descripcion || "Sin descripción"}
                </p>
              </div>

              <div>
                <div className="font-medium">Stocks por sucursal</div>
                <div className="mt-1 space-y-1">
                  {Array.isArray(p.stocksBySucursal) &&
                  p.stocksBySucursal.length > 0 ? (
                    p.stocksBySucursal.map((s) => (
                      <div
                        key={`${s.sucursalId}-${s.nombre}`}
                        className="text-muted-foreground"
                      >
                        {s.nombre}:{" "}
                        <span className="font-medium">{s.cantidad}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">No hay datos</div>
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    },
  }),

  /** Stock total (sortable) */
  columnHelper.accessor(
    (row) => (row.stocks ?? []).reduce((acc, s) => acc + s.cantidad, 0),
    {
      id: "stockTotal",
      header: "Stock",
      sortingFn: "basic",
      meta: { thClass: "w-[80px]" },

      cell: (info) => {
        const total = info.getValue<number>() ?? 0;
        return <span className="text-sm">{total}</span>;
      },
    }
  ),

  /** Acciones */
  columnHelper.display({
    id: "accion",
    header: "Acción",
    meta: { thClass: "w-[96px]" }, // botón no se comprime

    cell: (info) => {
      const p = info.row.original;
      const stockTotal = (p.stocks ?? []).reduce(
        (acc, s) => acc + s.cantidad,
        0
      );
      const disabled = stockTotal <= 0;

      return (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => info.table.options.meta?.onAddToCart?.(p)}
            className="h-8 w-9 p-0 bg-violet-600 hover:bg-violet-700" // ancho fijo y compacto
            title={disabled ? "Sin stock" : "Agregar al carrito"}
          >
            <ShoppingBasket className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  }),
];
