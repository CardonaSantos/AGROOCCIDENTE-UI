import React, { useEffect, useMemo, useState } from "react";
import {
  ProductoData,
  ProductosResponse,
} from "../POS/interfaces/newProductsPOSResponse";
import { useApiQuery } from "@/hooks/genericoCall/genericoCallHook";
import { keepPreviousData } from "@tanstack/react-query";
import { NewQueryDTO } from "../POS/interfaces/interfaces";
import { useDebouncedValue } from "../cuentas-bancarias/useDebouncedValue";
import { useStore } from "@/components/Context/ContextSucursal";
import TablePOS from "../POS/table/header";
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

interface CartItem {
  uid: string; // 👈 clave única (source+id)
  id: number;
  source: SourceType; // 👈 NUEVO
  nombre: string;
  quantity: number;
  selectedPriceId: number;
  selectedPrice: number;
  selectedPriceRole: RolPrecio;
  precios: Precios[];
  stock: { cantidad: number }[];
}

function CreditoMainPage() {
  const sucursalId = useStore((s) => s.sucursalId) ?? 0;

  // Paginación + filtros mínimos que consume TablePOS
  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [queryOptions, setQueryOptions] = useState<NewQueryDTO>({
    cats: [],
    codigoItem: "",
    codigoProveedor: "",
    nombreItem: "",
    priceRange: "",
    tipoEmpaque: "",
    sucursalId,
    limit,
    page,
  });

  // sincróniza page/limit/sucursal con el query
  useEffect(() => {
    setQueryOptions((prev) => ({ ...prev, sucursalId, limit, page }));
  }, [sucursalId, limit, page]);

  // debounce para nombreItem
  const debouncedNombre = useDebouncedValue(queryOptions.nombreItem, 400);

  // parámetros finales para la API (limpiando vacíos)
  const apiParams = useMemo(() => {
    const nombre = debouncedNombre?.trim();
    const p: Partial<NewQueryDTO> = { ...queryOptions };

    if (!nombre) delete p.nombreItem;
    else p.nombreItem = nombre;

    if (!p.codigoItem) delete p.codigoItem;
    if (!p.codigoProveedor) delete p.codigoProveedor;
    if (!p.tipoEmpaque) delete p.tipoEmpaque;
    if (!p.priceRange) delete p.priceRange;
    if (!p.cats?.length) delete p.cats;

    return p as NewQueryDTO;
  }, [queryOptions, debouncedNombre]);

  // Fetch productos para la tabla
  const {
    data: productsResponse = {
      data: [],
      meta: {
        limit: 10,
        page: 1,
        totalCount: 0,
        totalPages: 1,
        totals: { presentaciones: 0, productos: 0 },
      },
    },
    isFetching: isLoadingProducts,
    refetch,
  } = useApiQuery<ProductosResponse>(
    ["products-pos-response", apiParams],
    "products/get-products-presentations-for-pos",
    { params: apiParams },
    {
      refetchOnWindowFocus: false,
      placeholderData: keepPreviousData,
    }
  );

  // Datos normalizados que consume TablePOS
  const productos: ProductoData[] = Array.isArray(productsResponse.data)
    ? productsResponse.data
    : [];

  const meta = productsResponse.meta ?? {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0,
  };

  // Handlers que exige TablePOS
  const handlePageChange = (nextPage: number) => {
    setPage(Math.max(1, Math.min(nextPage, meta.totalPages || 1)));
  };

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const handleSearchItemsInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQueryOptions((prev) => ({ ...prev, nombreItem: v, page: 1 }));
  };

  const handleImageClick = (images: string[]) => {
    // aquí puedes abrir tu dialog/carrusel si lo necesitas
    console.log("Images:", images);
  };

  // Mínima implementación para cumplir con la firma
  const addToCart = (product: ProductoPOS) => {
    console.log("Add to cart:", product);
  };

  // Mapper por defecto exactamente con el tipo que espera TablePOS
  function defaultMapToCartProduct(p: ProductoData): ProductoPOS {
    return {
      id: p.id,
      // TablePOS usa esta fuente para diferenciar producto/presentación
      source: (p.__source as SourceType) ?? "producto",
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      precioVenta: 0,
      codigoProducto: p.codigoProducto,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
      stock: (p.stocks ?? []).map((s) => ({
        id: s.id,
        cantidad: s.cantidad,
        fechaIngreso: s.fechaIngreso || "",
        fechaVencimiento: s.fechaVencimiento || "",
      })),
      precios: (p.precios ?? []).map((pr) => ({
        id: pr.id,
        precio: Number(pr.precio) || 0,
        rol: (pr.rol as RolPrecio) ?? RolPrecio.PUBLICO,
      })),
      imagenesProducto: (p.images ?? [])
        .filter((im) => !!im?.url)
        .map((im) => ({ id: im.id ?? 0, url: im.url ?? "" })),
    } as ProductoPOS;
  }

  // (opcional) si cambiaste filtros externamente
  useEffect(() => {
    refetch();
  }, [apiParams, refetch]);

  return (
    <div className="min-w-0">
      <TablePOS
        defaultMapToCartProduct={defaultMapToCartProduct}
        addToCart={addToCart}
        handleImageClick={handleImageClick}
        isLoadingProducts={isLoadingProducts}
        handleSearchItemsInput={handleSearchItemsInput}
        queryOptions={queryOptions}
        data={productos}
        // Paginación server-side
        page={meta.page}
        limit={meta.limit}
        totalPages={meta.totalPages}
        totalCount={meta.totalCount}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}

export default CreditoMainPage;
