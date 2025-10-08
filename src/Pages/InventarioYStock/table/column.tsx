// table/column.tsx
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { ProductoInventarioResponse } from "../interfaces/InventaryInterfaces";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Boxes,
  Calendar,
  Package,
  Tag,
  Store,
  EllipsisVertical,
  Eye,
  CircleAlert,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("es");

import { esTextSortingFn, numericStringSortingFn } from "../sortingFns";
import { ddmmyyyyToTime, numFromStr, sumBy } from "../tableFormatters";
import { formattMoneda as fmt } from "@/Pages/Utils/Utils";
import productPlaceHolder from "@/assets/PRODUCTPLACEHOLDER.png";
const columnHelper = createColumnHelper<ProductoInventarioResponse>();
type ImgItem = { url: string; id?: string };
const getImages = (p: any): { cover: string; items: ImgItem[] } => {
  const items: ImgItem[] = Array.isArray(p?.images) ? p.images : [];
  const cover = p?.image ?? items[0]?.url ?? productPlaceHolder;
  return { cover, items };
};

const parseDMY = (s?: string | null): number | null => {
  if (!s || !s.trim()) return null;
  const d = dayjs(s, "DD-MM-YYYY", true); // estricto
  return d.isValid() ? d.startOf("day").valueOf() : null;
};

const cmpDescNullsLast = (a: number | null, b: number | null) => {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a; // más reciente primero
};

/** Próximos vencimientos primero, luego vencidos, luego vacíos */
const cmpVencProximas = (aStr?: string | null, bStr?: string | null) => {
  const a = parseDMY(aStr);
  const b = parseDMY(bStr);
  const today = dayjs().startOf("day").valueOf();

  const cat = (ms: number | null) => (ms === null ? 2 : ms < today ? 1 : 0); // 0=futuro (próximo), 1=vencido, 2=vacío

  const ca = cat(a),
    cb = cat(b);
  if (ca !== cb) return ca - cb;

  // Dentro de cada categoría:
  // - futuros: asc (más próximo primero)
  // - vencidos: asc (más antiguo primero) — cámbialo a desc si prefieres “recién vencidos” arriba
  // - vacíos: iguales
  if (a === null && b === null) return 0;
  return (a ?? 0) - (b ?? 0);
};

export const columnsInventario: ColumnDef<ProductoInventarioResponse, any>[] = [
  // IMAGEN DEL PRODUCTO

  // PRODUCTO
  columnHelper.accessor("nombre", {
    id: "nombre",
    header: () => (
      <div className="flex items-center gap-1">
        <Tag className="w-4 h-4 hidden md:block" />
        <span>Producto</span>
      </div>
    ),
    cell: (info) => {
      const p = info.row.original as any;
      const { cover, items } = getImages(p);
      const totalImgs = Math.max(items.length || 0, 1);

      return (
        <div className="min-w-[180px] max-w-[260px]">
          <div className="flex items-start gap-2">
            {/* THUMBNAIL + OVERLAY + DIALOG TRIGGER */}
            <Dialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="relative group w-12 h-12 shrink-0 overflow-hidden rounded-md border bg-muted/30"
                      >
                        <img
                          src={cover}
                          alt={p?.nombre ?? "Producto"}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* contador de imágenes */}
                        <span className="absolute top-1 right-1 z-10 rounded bg-background/80 backdrop-blur px-1.5 py-0.5 text-[10px] leading-none">
                          {totalImgs}
                        </span>
                        {/* overlay al hover */}
                        <div className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Ver imágenes</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* DIALOG + CAROUSEL */}
              <DialogContent className="max-w-[min(92vw,680px)] sm:max-w-xl">
                <div className="space-y-2">
                  <p className="text-sm font-medium truncate">{p?.nombre}</p>
                  <span className="text-xs text-muted-foreground">
                    COD: {p?.codigoProducto}
                  </span>
                </div>

                <Carousel className="w-full">
                  <CarouselContent>
                    {(items.length ? items : [{ url: cover }]).map(
                      (img: ImgItem, idx: number) => (
                        <CarouselItem key={img.id ?? idx}>
                          <div className="aspect-video sm:aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                            <img
                              src={img.url}
                              alt={`${p?.nombre ?? "Producto"} ${idx + 1}`}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        </CarouselItem>
                      )
                    )}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </DialogContent>
            </Dialog>

            {/* TEXTO / METADATOS */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{p.nombre}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground truncate">
                  COD: {p.codigoProducto}
                </span>
                {p.tipoPresentacion ? (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    <Package className="w-3 h-3 mr-1" />
                    {p.tipoPresentacion}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
    sortingFn: esTextSortingFn,
  }),

  // DESCRIPCIÓN (oculta en móviles, wrap con 2 líneas)
  columnHelper.accessor("descripcion", {
    id: "descripcion",
    header: () => <span className="hidden sm:inline">Desc.</span>,
    cell: (info) => (
      <div className="hidden sm:block max-w-[260px]">
        <p className="text-[11px] leading-snug line-clamp-2">
          {info.getValue<string>()}
        </p>
      </div>
    ),
    enableSorting: false,
  }),

  // COSTO UNITARIO (numérico string)
  columnHelper.accessor("precioCosto", {
    id: "precioCosto",
    header: () => (
      <div className="flex items-center gap-1 justify-end">
        <span className="hidden md:inline">Costo</span>
      </div>
    ),
    cell: (info) => {
      const v = info.getValue<string>();
      return (
        <div className="text-right tabular-nums">
          <span className="text-xs">{v ? fmt(v) : "—"}</span>
        </div>
      );
    },
    enableSorting: true,
    sortingFn: numericStringSortingFn,
  }),

  // EXISTENCIAS TOTALES (derivado de stocksBySucursal)
  columnHelper.accessor(
    (row) => sumBy(row.stocksBySucursal ?? [], (s) => s.cantidad),
    {
      id: "existencias",
      header: () => (
        <div className="flex items-center gap-1 justify-end">
          <Boxes className="w-4 h-4 hidden md:block" />
          <span className="hidden md:inline">Exist.</span>
        </div>
      ),
      cell: (info) => (
        <div className="text-right tabular-nums">
          <span className="text-xs font-medium">{info.getValue<number>()}</span>
        </div>
      ),
      enableSorting: true,
      sortingFn: "basic",
    }
  ),

  // VALOR INVENTARIO (precioCosto * total existencias) — oculto en xs
  columnHelper.accessor(
    (row) => {
      const precio = numFromStr(row.precioCosto);
      const total = sumBy(row.stocksBySucursal ?? [], (s) => s.cantidad);
      return Number.isFinite(precio) ? precio * total : NaN;
    },
    {
      id: "valorInventario",
      header: () => (
        <div className="flex items-center gap-1 justify-end">
          <span className="hidden sm:inline">Valor</span>
        </div>
      ),
      cell: (info) => {
        const v = info.getValue<number>();
        return (
          <div className="text-right tabular-nums hidden sm:block">
            <span className="text-xs">{Number.isFinite(v) ? fmt(v) : "—"}</span>
          </div>
        );
      },
      enableSorting: true,
      sortingFn: "basic",
    }
  ),

  // INGRESOS RECIENTES (stock ingresos) — muestra 2 + popover
  columnHelper.accessor("stocks", {
    id: "ingresos",
    header: () => (
      <div className="flex items-center gap-1">
        <Calendar className="w-4 h-4 hidden md:block" />
        <span className="hidden md:inline">Ingresos</span>
      </div>
    ),
    cell: (info) => {
      const items = [...(info.row.original.stocks ?? [])].sort((x, y) =>
        cmpDescNullsLast(parseDMY(x.fechaIngreso), parseDMY(y.fechaIngreso))
      );

      const show = items.slice(0, 2);
      const extra = items.length - show.length;

      return (
        <div className="max-w-[220px]">
          {show.map((s, i) => (
            <div
              key={s.id ?? i}
              className="flex items-center gap-1 text-[11px]"
            >
              <span className="tabular-nums">{s.cantidad}</span>
              <span className="opacity-60">•</span>
              <span className="truncate">{s.fechaIngreso || "N/A"}</span>
            </div>
          ))}
          {extra > 0 ? (
            <Popover>
              <PopoverTrigger className="text-[11px] text-primary hover:underline dark:text-white">
                Ver {extra} más…
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {items.map((s, i) => (
                    <div
                      key={s.id ?? i}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="tabular-nums text-[11px]">
                        {s.cantidad} unidades
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-[11px]">
                        Ingresado: {s.fechaIngreso || "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>
      );
    },
    enableSorting: false,
  }),

  // VENCIMIENTOS (muestra 2 + alerta si alguno vencido) — oculta en xs
  columnHelper.accessor("stocks", {
    id: "vencimientos",
    header: () => (
      <div className="flex items-center gap-1">
        <Calendar className="w-4 h-4 hidden lg:block" />
        <span className="hidden lg:inline">Venc.</span>
      </div>
    ),
    cell: (info) => {
      const raw = info.row.original.stocks ?? [];
      const items = [...raw].sort((a, b) =>
        cmpVencProximas(a.fechaVencimiento, b.fechaVencimiento)
      );

      const show = items.slice(0, 2);
      const extra = items.length - show.length;

      const anyExpired = items.some(
        (s) =>
          !Number.isNaN(ddmmyyyyToTime(s.fechaVencimiento)) &&
          ddmmyyyyToTime(s.fechaVencimiento) < Date.now()
      );

      return (
        <div className="hidden lg:block max-w-[220px]">
          {show.map((s, i) => (
            <div
              key={s.id ?? i}
              className="flex items-center gap-1 text-[11px]"
            >
              <span className="truncate">{s.fechaVencimiento || "N/A"}</span>
            </div>
          ))}
          {extra > 0 ? (
            <Popover>
              <PopoverTrigger className="text-[11px] text-primary hover:underline dark:text-white">
                Ver {extra} más…
              </PopoverTrigger>
              <PopoverContent className="w-96">
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {items.map((s, i) => {
                    const todayJs = dayjs().startOf("day").toDate();
                    const todayDayJs = dayjs().startOf("day");

                    const d = dayjs(s.fechaVencimiento, "DD-MM-YYYY", true); // el true fuerza parseo estricto

                    const isStockVencido = dayjs(
                      s.fechaVencimiento
                    ).isSameOrBefore(todayJs);

                    const differenceBetween = todayDayJs.diff(d, "day");

                    return (
                      <div
                        key={s.id ?? i}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="text-[11px]">
                          Vence: {s.fechaVencimiento || "N/A"}
                        </span>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="tabular-nums text-[11px]">
                          {s.cantidad} unidades
                        </span>

                        {isStockVencido ? (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <CircleAlert className="w-auto h-3 text-red-600 dark:text-red-400 " />
                            <span className="text-[11px] text-red-600 dark:text-red-400">
                              Vencido desde hace: {differenceBetween} días
                            </span>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}

          {anyExpired ? (
            <span className="ml-1 mt-1 inline-block text-[10px] text-red-600 dark:text-red-400">
              ¡Hay productos vencidos!
            </span>
          ) : null}
        </div>
      );
    },
    enableSorting: false,
  }),

  // STOCK POR SUCURSAL — comprimido a pills; oculto en md- (solo desktop/tablet ancho)
  columnHelper.accessor("stocksBySucursal", {
    id: "sucursales",
    header: () => (
      <div className="hidden md:flex items-center gap-1">
        <Store className="w-4 h-4" />
        <span>Por suc.</span>
      </div>
    ),
    cell: (info) => {
      const s = info.row.original.stocksBySucursal ?? [];
      const show = s.slice(0, 3);
      const extra = s.length - show.length;

      return (
        <div className="hidden md:block max-w-[280px]">
          <div className="flex flex-wrap gap-1">
            {show.map((x) => (
              <Badge
                key={x.sucursalId}
                variant="outline"
                className="text-[10px]"
              >
                {x.nombre}: {x.cantidad}
              </Badge>
            ))}
            {extra > 0 ? (
              <Popover>
                <PopoverTrigger className="text-[11px] text-primary hover:underline">
                  +{extra}
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {s.slice(3).map((x) => (
                      <div
                        key={x.sucursalId}
                        className="text-sm flex items-center gap-2"
                      >
                        <Store className="w-4 h-4" />
                        <span className="truncate">{x.nombre}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="tabular-nums">{x.cantidad}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        </div>
      );
    },
    enableSorting: false,
  }),

  // ACCIONES (siempre al final)
  columnHelper.display({
    id: "acciones",
    header: () => <span className="sr-only">Acciones</span>,
    cell: () => (
      <div className="flex justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-1.5 rounded-md hover:bg-muted transition"
                aria-label="acciones"
              >
                <EllipsisVertical className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Más acciones</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
    enableSorting: false,
  }),
];
