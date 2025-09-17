// requisicion.queries.ts
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import { AxiosRequestConfig } from "axios";
import {
  PagedResponse,
  RequisitionProductCandidate,
} from "./newMap/requisicion.interfaces";
import { keepPreviousData } from "@tanstack/react-query";

// GET candidatos (server-side pagination, search, sorting)
export const useRequisitionCandidatesQuery = (
  sucursalId: number,
  params: {
    page: number;
    pageSize: number;
    q?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  },
  options?: { enabled?: boolean }
) => {
  const config: AxiosRequestConfig = {
    params: {
      sucursalId,
      page: params.page,
      pageSize: params.pageSize,
      q: params.q || "",
      sortBy: params.sortBy || "priority",
      sortDir: params.sortDir || "asc",
    },
  };

  return useApiQuery<PagedResponse<RequisitionProductCandidate>>(
    ["requisition-candidates", sucursalId, params],
    "/requisicion/candidatos-requisicion",
    config,
    {
      enabled: !!sucursalId && (options?.enabled ?? true),
      placeholderData: keepPreviousData,
    }
  );
};

// POST crear requisición
export type CreateRequisitionLine =
  | {
      productoId: number;
      presentacionId?: never;
      cantidadSugerida: number;
      fechaExpiracion: string | null;
      precioCostoUnitario?: string; // decimal string
      actualizarCosto?: boolean;
    }
  | {
      productoId?: never;
      presentacionId: number;
      cantidadSugerida: number;
      fechaExpiracion: string | null;
      precioCostoUnitario?: string; // decimal string
      actualizarCosto?: boolean;
    };

export type CreateRequisitionDto = {
  sucursalId: number;
  usuarioId: number;
  lineas: CreateRequisitionLine[];
};

export const useCreateRequisitionMutation = () =>
  useApiMutation<any, CreateRequisitionDto>("post", "/requisicion");
