"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, AlertCircle } from "lucide-react";
import { ComprasTable } from "./compras-table";

// ⬇️ types
import type { PaginatedComprasResponse } from "./Interfaces/Interfaces1"; // <-- o donde moviste tus types
import type { GetRegistrosComprasQuery } from "./API/interfaceQuery";
import { useApiQuery } from "@/hooks/genericoCall/genericoCallHook";
import { keepPreviousData } from "@tanstack/react-query";
import { PageHeader } from "@/utils/components/PageHeaderPos";

// ⬇️ hook genérico

// Endpoint REST del backend
const ENDPOINT = "/compra-requisicion/get-registros-compras-con-detalle";

export function ComprasMainPage() {
  // Filtros / paginación controlados por estado local
  const [queryParams, setQueryParams] = useState<GetRegistrosComprasQuery>({
    page: 1,
    limit: 10,
    withDetalles: true,
  });

  // GET via React Query + Axios (usa axiosClient base)
  const { data, isLoading, isFetching, isError, error } =
    useApiQuery<PaginatedComprasResponse>(
      ["compras", queryParams], // 🔑 cache y refetch cuando cambien params
      ENDPOINT,
      { params: queryParams }, // 🔎 server ya soporta withDetalles
      {
        placeholderData: keepPreviousData, // 🧈 paginación suave sin “parpadeo”
        staleTime: 30_000, // ⏲️ evita refetchs agresivos
        refetchOnWindowFocus: true,
        // onError: () => toast.error("Error al cargar los datos de compras"),
      }
    );

  // Derivados seguros para no romper la UI
  const items = data?.items ?? [];
  const page = data?.page ?? queryParams.page!;
  const limit = data?.limit ?? queryParams.limit!;
  const pages = data?.pages ?? 0;
  const total = data?.total ?? 0;

  const handleChangePage = (newPage: number) => {
    setQueryParams((prev) => ({ ...prev, page: newPage }));
  };

  const handleChangeLimit = (newLimit: number) => {
    setQueryParams((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Skeleton inicial (primera carga sin datos)
  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gestión de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error “duro” (sin datos que mostrar)
  if (isError && items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error al cargar datos</h3>
          <p className="text-muted-foreground text-center">
            {(error as Error)?.message ?? "Error desconocido"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Módulo de compras"
        sticky={false}
        fallbackBackTo="/"
        subtitle="Administre sus registros de compras"
      />
      <ComprasTable
        data={items}
        page={page}
        limit={limit}
        pages={pages}
        total={total}
        // ⬇️ usa isFetching para mostrar loading suave mientras refetchea por paginación/filtros
        loading={isFetching}
        onChangePage={handleChangePage}
        onChangeLimit={handleChangeLimit}
      />
    </div>
  );
}
