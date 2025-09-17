// hooks/getProductosToPedidos/useProductosToPedidos.ts
import { keepPreviousData } from "@tanstack/react-query";
import type { ProductsResponse } from "@/Pages/Pedidos/Interfaces/productsList.interfaces";
import { useApiQuery } from "../genericoCall/genericoCallHook";

type Params = {
  page: number;
  pageSize: number;
  search?: string;
  // opcionales (servidor los acepta):
  sucursalId?: number;
  nombre?: string;
  codigoProducto?: string;
  codigoProveedor?: string;
};

export function useProductosToPedidos(params: Params) {
  const {
    page,
    pageSize,
    search,
    sucursalId,
    nombre,
    codigoProducto,
    codigoProveedor,
  } = params;

  return useApiQuery<ProductsResponse>(
    ["productos-to-pedidos", params],
    "/pedidos/productos-to-pedido",
    {
      params: {
        page,
        pageSize,
        ...(search ? { search } : {}),
        ...(typeof sucursalId === "number" ? { sucursalId } : {}),
        ...(nombre ? { nombre } : {}),
        ...(codigoProducto ? { codigoProducto } : {}),
        ...(codigoProveedor ? { codigoProveedor } : {}),
      },
    },
    {
      placeholderData: keepPreviousData,
      staleTime: 5 * 60 * 1000,
    }
  );
}
