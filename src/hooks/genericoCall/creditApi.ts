// /Creditos/hooks/creditApi.ts
import {
  keepPreviousData,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "./genericoCallHook";

// Tipos mínimos del API
export type CustomersToCredit = {
  id: number;
  nombre: string;
  telefono: string;
  dpi: string;
};
export type PrecioApi = { id: number; precio: string; rol: string };
export type PresentacionApi = {
  id: number;
  nombre: string;
  sku?: string | null;
  codigoBarras?: string | null;
  tipoPresentacion: string;
  precios: PrecioApi[];
  stockPresentaciones: { id: number; cantidad?: number | null }[];
};
export type ProductoApi = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  codigoProducto: string;
  precios: PrecioApi[];
  stock: { id: number; cantidad?: number | null }[];
  imagenesProducto?: { id: number; url: string }[];
  presentaciones: PresentacionApi[];
};

// ---- Clientes
export function useCustomersQuery() {
  const q = useApiQuery<CustomersToCredit[]>(
    ["credit", "customers"],
    "/client/get-clients",
    undefined,
    { staleTime: 5 * 60 * 1000 }
  );

  return {
    customers: q.data,
    customersLoading: q.isLoading,
    error: q.error,
    refetch: q.refetch,
  };
}

// ---- Registros de crédito (tabla)
export function useCreditRecordsQuery() {
  const q = useApiQuery<any[]>(
    ["credit", "records"],
    "/cuotas/get/credits",
    undefined,
    { staleTime: 30 * 1000 }
  );
  return {
    records: q.data,
    recordsLoading: q.isLoading,
    error: q.error,
    refetchRecords: q.refetch,
  };
}

// ---- Búsqueda de productos por nombre/código (ligero)
export function useSearchProducts(sucursalId: number, q: string) {
  // Prepara para endpoint de búsqueda. Si tu backend usa otro path, ajusta aquí.
  const enabled = (q ?? "").trim().length > 0;
  return useApiQuery<ProductoApi[]>(
    ["credit", "products", "search", sucursalId, q],
    "/products/search", // <-- ajusta si tu backend usa otro path
    { params: { q, sucursalId } },
    { enabled, placeholderData: keepPreviousData }
  );
}

// ---- Crear crédito
export function useCreateCreditoMutation(
  opts?: UseMutationOptions<any, unknown, any>
) {
  const qc = useQueryClient();
  const m = useApiMutation<any, any>("post", "/cuotas", undefined, {
    ...opts,
    onSuccess: (data, variables, ctx) => {
      qc.invalidateQueries({ queryKey: ["credit", "records"] });
      opts?.onSuccess?.(data, variables, ctx);
    },
  });
  return {
    createCredito: m.mutateAsync,
    isCreating: m.isPending,
    error: m.error,
  };
}
