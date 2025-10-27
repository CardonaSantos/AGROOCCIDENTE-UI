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
import { PageHeader } from "@/utils/components/PageHeaderPos";
import { Label } from "@/components/ui/label";
import { ReusableSelect } from "@/utils/components/ReactSelectComponent/ReusableSelect";
import { TipoPresentacion } from "@/Pages/newCreateProduct/interfaces/DomainProdPressTypes";
import { CategoriaWithCount } from "@/Pages/Categorias/CategoriasMainPage";
import { Search } from "lucide-react";

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
  fechaIngreso: string;
  fechaVencimiento: string;
};

export type Precios = {
  id: number;
  precio: number;
  rol: RolPrecio;
};

export type imagenesProducto = {
  id: number;
  url: string;
};

type SourceType = "producto" | "presentacion";

type ProductoPOS = {
  id: number;
  source: SourceType;
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
  categorias: CategoriaWithCount[];
  setQueryOptions: React.Dispatch<React.SetStateAction<NewQueryDTO>>;
  searchValue: string;
  handleImageClick: (images: string[]) => void;
  addToCart: (product: ProductoPOS) => void;
  data: ProductoData[];
  isLoadingProducts: boolean;
  queryOptions: NewQueryDTO;
  handleSearchItemsInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultMapToCartProduct(p: ProductoData): ProductoPOS;
  mapToCartProduct?: (p: ProductoData) => ProductoPOS;

  getRemainingFor: (p: ProductoData) => number; // 👈 NUEVO

  // server-side pagination props
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;

  /** opcional: si quieres forzar una altura máxima concreta (px) */
  maxDesktopHeightPx?: number;
  maxMobileHeightPx?: number;
  tiposPresentacion: TipoPresentacion[];
}

/** Barra de paginación compacta (usada arriba y abajo) */
function PaginationBar({
  page,
  totalPages,
  totalCount,
  from,
  to,
  limit,
  onPageChange,
  onLimitChange,
  isDisabled,
  showPageSize = true,
  className = "",
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  from: number;
  to: number;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (n: number) => void;
  isDisabled: boolean;
  showPageSize?: boolean;
  className?: string;
}) {
  return (
    <div
      role="navigation"
      className={`flex flex-wrap items-center justify-between gap-2 p-2 border-t bg-muted/30 ${className}`}
    >
      <div className="text-xs text-muted-foreground">
        Mostrando <span className="font-medium">{from}</span>–
        <span className="font-medium">{to}</span> de{" "}
        <span className="font-medium">{totalCount}</span>
      </div>

      <div className="flex items-center gap-2">
        {showPageSize && (
          <>
            <label className="text-xs">Filas:</label>
            <select
              className="h-8 rounded-md border px-2 text-sm text-black"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              disabled={isDisabled}
            >
              {[5, 10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="mx-1 text-muted-foreground">|</span>
          </>
        )}

        <button
          type="button"
          className="h-8 rounded-md border px-2 text-sm disabled:opacity-50"
          onClick={() => onPageChange(1)}
          disabled={isDisabled || page <= 1}
          aria-label="Primera página"
          title="Primera"
        >
          «
        </button>
        <button
          type="button"
          className="h-8 rounded-md border px-3 text-sm disabled:opacity-50"
          onClick={() => onPageChange(page - 1)}
          disabled={isDisabled || page <= 1}
          aria-label="Página anterior"
          title="Anterior"
        >
          ←
        </button>

        <span className="text-sm tabular-nums">
          {page} / {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          className="h-8 rounded-md border px-3 text-sm disabled:opacity-50"
          onClick={() => onPageChange(page + 1)}
          disabled={isDisabled || page >= totalPages}
          aria-label="Página siguiente"
          title="Siguiente"
        >
          →
        </button>
        <button
          type="button"
          className="h-8 rounded-md border px-2 text-sm disabled:opacity-50"
          onClick={() => onPageChange(totalPages)}
          disabled={isDisabled || page >= totalPages}
          aria-label="Última página"
          title="Última"
        >
          »
        </button>
      </div>
    </div>
  );
}

export default function TablePOS({
  data,
  handleSearchItemsInput,
  // queryOptions,
  addToCart,
  handleImageClick,
  isLoadingProducts,
  mapToCartProduct,
  defaultMapToCartProduct,
  limit,
  onLimitChange,
  onPageChange,
  page,
  totalCount,
  totalPages,
  maxDesktopHeightPx,
  maxMobileHeightPx,
  getRemainingFor,
  searchValue,
  tiposPresentacion,
  queryOptions,
  setQueryOptions,
  categorias,
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
    meta: {
      onAddToCart: (p: ProductoData) => {
        const mapper = mapToCartProduct ?? defaultMapToCartProduct;
        addToCart(mapper(p));
      },
      onPreviewImages: handleImageClick,
      getRemainingFor, // 👈 NUEVO
    },
  });

  const hasData = Array.isArray(data) && data.length > 0;

  // Rango mostrado (1–10 de N)
  const from = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalCount);

  /** ====== Alturas estimadas para scroll por "limit" ======
   * Ajusta si cambias densidad de filas:
   *  - HEADER ~ 44px  |  ROW ~ 56px  |  margen interior ~ 8px
   */
  const ESTIMATED_HEADER_H = 44;
  const ESTIMATED_ROW_H = 56;
  const ESTIMATED_PADDING = 8;

  // alto deseado del área scrolleable (solo el body)
  const computedBodyMaxH =
    ESTIMATED_HEADER_H +
    ESTIMATED_ROW_H * Math.max(5, limit) +
    ESTIMATED_PADDING;

  // límite final (permite forzar desde props o por viewport)
  const desktopBodyMaxH = Math.min(
    maxDesktopHeightPx ?? computedBodyMaxH,
    // no exceder el viewport en escritorio
    Math.max(320, Math.round(0.72 * window.innerHeight || computedBodyMaxH))
  );

  const mobileBodyMaxH = Math.min(
    maxMobileHeightPx ?? computedBodyMaxH,
    Math.max(280, Math.round(0.65 * window.innerHeight || computedBodyMaxH))
  );

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

  const selectedTiposEmpaque = React.useMemo(
    () =>
      tiposPresentacion.filter((tp) =>
        queryOptions.tipoEmpaque.includes(tp.id)
      ),
    [tiposPresentacion, queryOptions.tipoEmpaque]
  );

  const selectedCategorias = React.useMemo(
    () => categorias.filter((cat) => queryOptions.cats.includes(cat.id)),
    [categorias, queryOptions.cats]
  );

  const handleTipoEmpaqueChange = React.useCallback(
    (arr: TipoPresentacion[]) => {
      setQueryOptions((prev) => ({
        ...prev,
        tipoEmpaque: arr.map((t) => t.id),
      }));
    },
    [setQueryOptions]
  );

  const handleSelectCategoria = React.useCallback(
    (arr: CategoriaWithCount[]) => {
      setQueryOptions((prev) => ({
        ...prev,
        cats: arr.map((cat) => cat.id),
      }));
    },
    [setQueryOptions]
  );

  return (
    <div className="w-full">
      {/* Search */}
      <PageHeader title="POS" fallbackBackTo="/" sticky={false} />

      <div className="mb-3 grid grid-cols-1 sm:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)] gap-3 items-end">
        <div className="relative">
          {/* Icono izquierdo */}
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

          {/* Input con espacio para icono izq y botón der */}
          <Input
            id="q"
            type="search"
            placeholder="Buscar por nombre o código…"
            value={searchValue}
            onChange={handleSearchItemsInput}
            className="h-8 pl-8 pr-24" // 👈 pl para icono, pr para botón
          />
        </div>

        <div className="grid gap-1">
          <Label className="text-xs">Por tipo de presentación</Label>
          <ReusableSelect<TipoPresentacion>
            isClearable
            isMulti
            items={tiposPresentacion}
            getLabel={(t) => `${t.nombre} (relacionados:${t.productos})`}
            getValue={(t) => Number(t.id)}
            value={selectedTiposEmpaque}
            onChange={handleTipoEmpaqueChange}
            placeholder="Presentaciones"
            selectProps={{
              isSearchable: true,
              menuPortalTarget: document.body, // 👈 fuera del stacking del table
              menuPosition: "fixed", // 👈 estable en contenedores con overflow
              menuShouldScrollIntoView: false, // opcional
              styles: {
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                valueContainer: (b) => ({
                  ...b,
                  padding: "0 5px",
                }),
              },
            }}
          />
        </div>

        <div className="grid gap-1">
          <Label className="text-xs">Por categorías</Label>
          <ReusableSelect<CategoriaWithCount>
            isClearable
            isMulti
            items={categorias}
            getLabel={(t) => `${t.nombre} (relacionados:${t.productosCount})`}
            getValue={(t) => Number(t.id)}
            value={selectedCategorias}
            onChange={handleSelectCategoria}
            placeholder="Categorías"
            selectProps={{
              isSearchable: true,
              menuPortalTarget: document.body, // 👈 fuera del stacking del table
              menuPosition: "fixed", // 👈 estable en contenedores con overflow
              menuShouldScrollIntoView: false, // opcional
              styles: {
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                valueContainer: (b) => ({
                  ...b,
                  padding: "0 5px",
                }),
              },
            }}
          />
        </div>
      </div>

      {/* ===== DESKTOP ===== */}

      <div className="hidden md:flex flex-col rounded-xl border bg-card">
        {/* Paginación superior (compacta) */}
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          from={from}
          to={to}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          isDisabled={isLoadingProducts}
          showPageSize
          className="border-t-0"
        />

        {/* Área scrolleable con header sticky */}
        <div className="overflow-y-auto" style={{ maxHeight: desktopBodyMaxH }}>
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="text-left">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sort = header.column.getIsSorted();
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

            {isLoadingProducts && renderSkeleton(limit)}

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

        {/* Paginación inferior (compacta) */}
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          from={from}
          to={to}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          isDisabled={isLoadingProducts}
          showPageSize={false} // abajo solemos ocultar el selector de filas
        />
      </div>

      {/* ===== MOBILE ===== */}
      {/* Barra superior de paginación (¡afuera del contenedor hidden!) */}
      <div className="md:hidden">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          from={from}
          to={to}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          isDisabled={isLoadingProducts}
          showPageSize
          className="rounded-xl border bg-white"
        />
      </div>

      {/* Lista móvil scrolleable */}
      <div
        className="md:hidden space-y-2 overflow-y-auto rounded-xl border bg-white p-2"
        style={{ maxHeight: mobileBodyMaxH }}
      >
        {isLoadingProducts &&
          Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
            <div key={i} className="rounded-lg border p-3">
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
              // const stockTotal = (p.stocks ?? []).reduce(
              //   (a, s) => a + s.cantidad,
              //   0
              // );
              const remaining = getRemainingFor(p); // 👈 usar el cálculo que viene del padre

              return (
                <motion.div
                  key={`${p.__source ?? "producto"}-${p.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-lg border p-3 bg-white"
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
                      disabled={remaining <= 0}
                      title={
                        remaining <= 0
                          ? "Sin stock"
                          : `Agregar (disp. ${remaining})`
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
                    <span className="font-medium">Stock:</span> {remaining}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {!isLoadingProducts && !hasData && (
          <div className="rounded-lg border p-6 text-center text-muted-foreground bg-white">
            No se encontraron productos.
          </div>
        )}
      </div>

      {/* Barra inferior de paginación en mobile */}
      <div className="md:hidden mt-2">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          from={from}
          to={to}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          isDisabled={isLoadingProducts}
          showPageSize={false}
          className="rounded-xl border bg-white"
        />
      </div>
    </div>
  );
}
