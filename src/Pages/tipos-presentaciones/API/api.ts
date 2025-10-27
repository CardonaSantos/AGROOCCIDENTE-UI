// src/features/tipos-presentaciones/api.ts
import {
  keepPreviousData,
  QueryKey,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CreateTipoPresentacionInput,
  MessageResponse,
  PaginatedResponse,
  SingleResponse,
  TipoPresentacion,
  TipoPresentacionQuery,
  UpdateTipoPresentacionInput,
} from "../Interfaces/tiposPresentaciones.interfaces";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";

// ---- Query Keys (evita inconsistencias) ----
export const QK_TIPO_BASE = ["tipoPresentacion"] as const;
export const QK_TIPO_LIST = (params: TipoPresentacionQuery) =>
  [...QK_TIPO_BASE, "list", params] as QueryKey;
export const QK_TIPO_ONE = (id: number) =>
  [...QK_TIPO_BASE, "one", id] as QueryKey;

// ---- QUERIES ----
export function useTiposPresentacion(params: TipoPresentacionQuery) {
  return useApiQuery<PaginatedResponse<TipoPresentacion>>(
    QK_TIPO_LIST(params),
    "/tipo-presentacion",
    { params },
    {
      placeholderData: keepPreviousData,
    }
  );
}

export function useTipoPresentacion(id: number) {
  return useApiQuery<SingleResponse<TipoPresentacion>>(
    QK_TIPO_ONE(id),
    `/tipo-presentacion/${id}`
  );
}

// ---- MUTATIONS ----
export function useCreateTipoPresentacion() {
  const qc = useQueryClient();
  return useApiMutation<
    MessageResponse<TipoPresentacion>,
    CreateTipoPresentacionInput
  >("post", "/tipo-presentacion", undefined, {
    onSuccess: () => {
      // invalidar todas las listas
      qc.invalidateQueries({ queryKey: QK_TIPO_BASE });
    },
  });
}

export function useUpdateTipoPresentacion(id: number) {
  const qc = useQueryClient();
  return useApiMutation<
    MessageResponse<TipoPresentacion>,
    UpdateTipoPresentacionInput
  >("patch", `/tipo-presentacion/${id}`, undefined, {
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_TIPO_BASE });
      qc.invalidateQueries({ queryKey: QK_TIPO_ONE(id) });
    },
  });
}

export function useSoftDeleteTipoPresentacion(id: number) {
  const qc = useQueryClient();
  return useApiMutation<MessageResponse<TipoPresentacion>, void>(
    "delete",
    `/tipo-presentacion/${id}`,
    undefined,
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: QK_TIPO_BASE });
        qc.invalidateQueries({ queryKey: QK_TIPO_ONE(id) });
      },
    }
  );
}

export function useRestoreTipoPresentacion(id: number) {
  const qc = useQueryClient();
  return useApiMutation<MessageResponse<TipoPresentacion>, void>(
    "patch",
    `/tipo-presentacion/${id}/restore`,
    undefined,
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: QK_TIPO_BASE });
        qc.invalidateQueries({ queryKey: QK_TIPO_ONE(id) });
      },
    }
  );
}

export function useHardDeleteTipoPresentacion(id: number) {
  const qc = useQueryClient();
  return useApiMutation<MessageResponse<TipoPresentacion>, void>(
    "delete",
    `/tipo-presentacion/${id}/hard`,
    undefined,
    {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: QK_TIPO_BASE });
      },
    }
  );
}
