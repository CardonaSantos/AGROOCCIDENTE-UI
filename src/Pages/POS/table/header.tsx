// TablePOS.tsx
"use client";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
} from "@tanstack/react-table";
import { ProductoData } from "../interfaces/newProductsPOSResponse";
import { columnsTablePos } from "./colums";
import { Input } from "@/components/ui/input";
import { NewQueryDTO } from "../interfaces/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { SortingState } from "@tanstack/react-table";
import React from "react";
enum RolPrecio {
  PUBLICO = "PUBLICO",
  MAYORISTA = "MAYORISTA",
  ESPECIAL = "ESPECIAL",
  DISTRIBUIDOR = "DISTRIBUIDOR",
  PROMOCION = "PROMOCION",
  CLIENTE_ESPECIAL = "CLIENTE_ESPECIAL",
}

type Stock = {
  id: number;
  cantidad: number;
  fechaIngreso: string; // ISO
  fechaVencimiento: string; // ISO
};

export type Precios = {
  id: number;
  precio: number; // <- importante: number (parse de string del backend)
  rol: RolPrecio;
};

export type imagenesProducto = {
  id: number;
  url: string;
};

type SourceType = "producto" | "presentacion";

type ProductoPOS = {
  id: number;
  source: SourceType; // 👈 NUEVO
  nombre: string;
  descripcion: string;
  precioVenta: number;
  codigoProducto: string;
  creadoEn: string;
  actualizadoEn: string;
  stock: Stock[];
  precios: Precios[];
  imagenesProducto: imagenesProducto[];
};

interface Props {
  handleImageClick: (images: string[]) => void;
  addToCart: (product: ProductoPOS) => void;
  data: ProductoData[];
  isLoadingProducts: boolean;
  queryOptions: NewQueryDTO;
  handleSearchItemsInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultMapToCartProduct(p: ProductoData): ProductoPOS;
  mapToCartProduct?: (p: ProductoData) => ProductoPOS;
}

export default function TablePOS({
  data,
  handleSearchItemsInput,
  queryOptions,
  addToCart,
  handleImageClick,
  isLoadingProducts,
  mapToCartProduct,
  defaultMapToCartProduct,
}: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "nombre", desc: false },
  ]);

  const table = useReactTable({
    data,
    getRowId: (row) => `${row.__source}-${row.id}`,
    columns: columnsTablePos,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    /** pasamos funciones a las columnas vía meta */
    meta: {
      onAddToCart: (p: ProductoData) => {
        const mapper = mapToCartProduct ?? defaultMapToCartProduct;
        addToCart(mapper(p));
      },
      onPreviewImages: handleImageClick,
    },
  });

  /** --------- UI Helpers --------- */
  const renderSkeleton = (rows = 6) => (
    <tbody>
      {Array.from({ length: rows }).map((_, idx) => (
        <tr key={idx} className="animate-pulse">
          <td className="p-2 border-b">
            <Skeleton className="h-4 w-40" />
          </td>
          <td className="p-2 border-b">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="p-2 border-b">
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="p-2 border-b">
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="p-2 border-b">
            <Skeleton className="h-8 w-24" />
          </td>
        </tr>
      ))}
    </tbody>
  );

  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="w-full">
      {/* Search */}
      <div className="mb-3">
        <Input
          placeholder="Buscar por nombre o código…"
          value={queryOptions.nombreItem}
          onChange={handleSearchItemsInput}
          className="h-9"
        />
      </div>

      {/* Desktop: tabla */}

      <div className="hidden md:block overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="text-left">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sort = header.column.getIsSorted(); // false | 'asc' | 'desc'
                  return (
                    <th
                      key={header.id}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      className={`px-3 py-2 font-semibold select-none ${
                        canSort ? "cursor-pointer hover:bg-muted/60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {sort === "asc" && <span>▲</span>}
                        {sort === "desc" && <span>▼</span>}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {isLoadingProducts && renderSkeleton(6)}

          {!isLoadingProducts && hasData && (
            <tbody>
              <AnimatePresence initial={false}>
                {table.getRowModel().rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="hover:bg-muted/30"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-2 border-t align-top"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          )}

          {!isLoadingProducts && !hasData && (
            <tbody>
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No se encontraron productos con ese criterio.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {/* Mobile: tarjetas */}
      <div className="md:hidden space-y-2">
        {isLoadingProducts &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-3">
              <Skeleton className="h-4 w-44 mb-2" />
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-3 w-60 mb-3" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}

        {!isLoadingProducts && hasData && (
          <AnimatePresence initial={false}>
            {data.map((p) => {
              const precios = p.precios ?? [];
              const stockTotal = (p.stocks ?? []).reduce(
                (a, s) => a + s.cantidad,
                0
              );
              return (
                <motion.div
                  key={`${p.__source ?? "producto"}-${p.id}`} // 👈 clave única
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-xl border p-3 bg-white"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{p.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.codigoProducto}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        mapToCartProduct
                          ? addToCart(mapToCartProduct(p))
                          : addToCart(defaultMapToCartProduct(p))
                      }
                      className="rounded-lg px-3 py-2 bg-primary text-primary-foreground text-xs disabled:opacity-60"
                      disabled={stockTotal <= 0}
                      title={
                        stockTotal <= 0 ? "Sin stock" : "Agregar al carrito"
                      }
                    >
                      + Añadir
                    </button>
                  </div>

                  {p.descripcion && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {p.descripcion}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {precios.map((x) => (
                      <span key={x.id} className="rounded bg-muted px-2 py-1">
                        {x.rol}: Q{Number(x.precio) || 0}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 text-xs">
                    <span className="font-medium">Stock:</span> {stockTotal}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {!isLoadingProducts && !hasData && (
          <div className="rounded-xl border p-6 text-center text-muted-foreground bg-white">
            No se encontraron productos.
          </div>
        )}
      </div>
    </div>
  );
}
