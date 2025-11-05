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
  SquarePen,
  PowerOff,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ddmmyyyyToTime, sumBy } from "../tableFormatters";
import { formattMoneda as fmt } from "@/Pages/Utils/Utils";
import productPlaceHolder from "@/assets/PRODUCTPLACEHOLDER.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";

// (opcional) mantén meta para otros callbacks
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    onDisableProduct?: (row: TData) => void;
  }
}

const columnHelper = createColumnHelper<ProductoInventarioResponse>();

type ImgItem = { url: string; id?: string };
const getImages = (p: any): { cover: string; items: ImgItem[] } => {
  const items: ImgItem[] = Array.isArray(p?.images) ? p.images : [];
  const cover = p?.image ?? items[0]?.url ?? productPlaceHolder;
  return { cover, items };
};

const parseDMY = (s?: string | null): number | null => {
  if (!s || !s.trim()) return null;
  const d = dayjs(s, "DD-MM-YYYY", true);
  return d.isValid() ? d.startOf("day").valueOf() : null;
};

const cmpDescNullsLast = (a: number | null, b: number | null) => {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
};

const cmpVencProximas = (aStr?: string | null, bStr?: string | null) => {
  const a = parseDMY(aStr);
  const b = parseDMY(bStr);
  const today = dayjs().startOf("day").valueOf();
  const cat = (ms: number | null) => (ms === null ? 2 : ms < today ? 1 : 0);
  const ca = cat(a),
    cb = cat(b);
  if (ca !== cb) return ca - cb;
  if (a === null && b === null) return 0;
  return (a ?? 0) - (b ?? 0);
};

// 🔧 Columna Costo (se añade solo si NO es vendedor)
const COSTO_COL: ColumnDef<ProductoInventarioResponse, any> =
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
  });

const PRORRATEO_COL = columnHelper.accessor(
  (row) => {
    const latest = [...(row.stocks ?? [])]
      .filter((s) => s.prorrateo?.ultimaFecha)
      .sort(
        (a, b) =>
          dayjs(b.prorrateo!.ultimaFecha).valueOf() -
          dayjs(a.prorrateo!.ultimaFecha).valueOf()
      )[0];

    // Ordena por el costo final (lo que muestra el UI)
    return latest?.prorrateo?.precioCostoFinal ?? null;
  },
  {
    id: "prorrateo",
    header: () => (
      <div className="flex items-center gap-1 justify-end">
        <span className="hidden md:inline">Prorrateo</span>
      </div>
    ),
    cell: (info) => {
      const stocks = info.row.original.stocks ?? [];
      const prorrateados = [...stocks]
        .filter((s) => s.prorrateo?.ultimaFecha)
        .sort(
          (a, b) =>
            dayjs(b.prorrateo!.ultimaFecha).valueOf() -
            dayjs(a.prorrateo!.ultimaFecha).valueOf()
        );

      const latest = prorrateados[0];
      const v = latest?.prorrateo?.precioCostoFinal;

      if (!prorrateados.length) {
        return (
          <div className="text-right tabular-nums">
            <span className="text-xs">—</span>
          </div>
        );
      }

      return (
        <div className="text-right tabular-nums">
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-xs underline-offset-2 hover:underline text-right w-full">
                {v != null ? fmt(v) : "—"}
              </button>
            </PopoverTrigger>

            <PopoverContent className="w-96">
              <div className="space-y-2">
                <h4 className="font-medium text-sm mb-1">
                  Detalle de prorrateo
                </h4>
                <div className="max-h-60 overflow-y-auto divide-y">
                  {prorrateados.map((s) => (
                    <div
                      key={s.id}
                      className="py-1 text-[11px] flex flex-col space-y-0.5"
                    >
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          ID stock #{s.id}
                        </span>
                        <span>{s.fechaIngreso || "—"}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2">
                        <div>
                          <span className="text-muted-foreground">
                            Por unidad:
                          </span>{" "}
                          {fmt(s.prorrateo?.porUnidad ?? 0)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Costo final:
                          </span>{" "}
                          {fmt(s.prorrateo?.precioCostoFinal ?? 0)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Asignado:
                          </span>{" "}
                          {fmt(s.prorrateo?.sumaAsignado ?? 0)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Fecha última:
                          </span>{" "}
                          {dayjs(s.prorrateo?.ultimaFecha).format(
                            "DD/MM/YYYY HH:mm"
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    },
    enableSorting: true,
    sortingFn: "basic",
  }
);

const VALOR_INVENTARIO: ColumnDef<ProductoInventarioResponse, any> =
  columnHelper.accessor(
    (row) => {
      // Usa SOLO la sucursal visible en la tabla:
      const items = row.stocks ?? [];
      const total = items.reduce((acc, s) => {
        const costo = s.prorrateo?.precioCostoFinal ?? 0;
        return acc + Number(s.cantidad ?? 0) * Number(costo);
      }, 0);
      return total;
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
  );

export const makeColumnsInventario = (
  rolUser: string
): ColumnDef<ProductoInventarioResponse, any>[] => {
  const cols: ColumnDef<ProductoInventarioResponse, any>[] = [
    // NOMBRE / PRODUCTO
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
        const tp = (p as any).tipoPresentacion;
        const tpLabel = typeof tp === "string" ? tp : tp?.nombre ?? "";
        return (
          <div className="min-w-[180px] max-w-[260px]">
            <div className="flex items-start gap-2">
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
                          <span className="absolute top-1 right-1 z-10 rounded bg-background/80 backdrop-blur px-1.5 py-0.5 text-[10px] leading-none">
                            {totalImgs}
                          </span>
                          <div className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Ver imágenes</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

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

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{p.nombre}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground truncate">
                    COD: {p.codigoProducto}
                  </span>
                  {tpLabel ? (
                    <Badge
                      variant="secondary"
                      className="h-5 px-1.5 text-[10px]"
                    >
                      <Package className="w-3 h-3 mr-1" />
                      {tpLabel}
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

    // DESCRIPCIÓN
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

    // EXISTENCIAS
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
            <span className="text-xs font-medium">
              {info.getValue<number>()}
            </span>
          </div>
        ),
        enableSorting: true,
        sortingFn: "basic",
      }
    ),

    // INGRESOS
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

    // VENCIMIENTOS
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
                      const d = dayjs(s.fechaVencimiento, "DD-MM-YYYY", true);
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
                              <Separator
                                orientation="vertical"
                                className="h-4"
                              />
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

    // POR SUCURSAL
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

    // ACCIONES
    columnHelper.display({
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      size: 48,
      cell: (info) => {
        const stop = (e: React.MouseEvent) => e.stopPropagation();
        const productoId = info.row.original.productoId;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Más acciones"
                        onClick={stop}
                        onMouseDown={stop}
                      >
                        <EllipsisVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Más acciones</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    to={`/editar-producto/${productoId}`}
                    className="flex items-center gap-2"
                    onClick={stop}
                  >
                    <SquarePen className="w-4 h-4" />
                    Editar producto
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(String(info.row.original.id))
                      .catch(() => {});
                  }}
                >
                  <Copy className="w-4 h-4" />
                  Copiar ID
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-700 flex items-center gap-2"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <PowerOff className="w-4 h-4" />
                      Desactivar producto
                    </DropdownMenuItem>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Desactivar producto</DialogTitle>
                      <DialogDescription>
                        Esta acción desactivará “{info.row.original.nombre}”.
                        Podrás reactivarlo más tarde.
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button variant="destructive">Confirmar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ];

  // 👉 Añade la columna COSTO solo si NO es vendedor
  if (rolUser !== "VENDEDOR") {
    // la insertamos después de "descripcion" (posición 2)
    cols.splice(2, 0, COSTO_COL);
  }

  if (rolUser !== "VENDEDOR") {
    cols.splice(3, 0, PRORRATEO_COL);
  }

  if (rolUser !== "VENDEDOR") {
    cols.splice(5, 0, VALOR_INVENTARIO);
  }

  return cols;
};
