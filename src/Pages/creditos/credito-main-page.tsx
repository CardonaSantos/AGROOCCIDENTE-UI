import { motion } from "framer-motion";
import DesvanecerHaciaArriba from "@/Pages/NewDashboard/components/dashboard/motion/desvanecer-hacia-arriba";
import { PageHeader } from "@/utils/components/PageHeaderPos";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import type {
  CreditListResponse,
  NormalizedCredito,
} from "./interfaces/CreditoResponse";
import * as React from "react";
import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import CreditTable from "./components/table-creditos/header";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { useStore } from "@/components/Context/ContextSucursal";
import { toast } from "sonner";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";

function CreditoMainPageManage() {
  const userRol = useStore((state) => state.userRol) ?? "";
  const CREDITS_QUERY_KEY = ["creditos-query-key"];
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [search, setSearch] = React.useState("");

  const queryClient = useQueryClient();

  // guardamos el crédito a eliminar (para mostrar datos en el modal)
  const [creditoToDelete, setCreditoToDelete] =
    React.useState<NormalizedCredito | null>(null);

  // TODO: ajusta esta línea a tu sistema real de auth/roles.
  // Ejemplos: useAuthStore.getState().isAdmin || currentUser.roles.includes('ADMIN')
  const isAdmin: boolean = userRol === "ADMIN" ? true : false; // <— cámbialo por tu lógica real

  const { data: creditosResponse, isLoading } = useApiQuery<CreditListResponse>(
    CREDITS_QUERY_KEY,
    "credito",
    {
      params: {
        page,
        limit,
        q: search?.trim() || undefined, // ajusta el nombre del parámetro que espera tu API
      },
    },
    {
      refetchOnMount: "always",
      staleTime: 0,
      placeholderData: keepPreviousData,
    }
  );

  const [openDeletCredito, setOpenDeleteCredito] =
    React.useState<boolean>(false);
  const { mutateAsync: deleteCredito, isPending: isPendingDeleteCredito } =
    useApiMutation("delete", `credito/delete-credito/${creditoToDelete?.id}`);

  const handleAskDelete = (c: NormalizedCredito) => {
    setCreditoToDelete(c);
    setOpenDeleteCredito(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // tu hook ya usa selectedCreditoId en el path: credito/delete-credito/${selectedCreditoId}
      toast.promise(deleteCredito(undefined as any), {
        success: "Registro eliminado",
        loading: "Eliminando registro...",
        error: (error) => getApiErrorMessageAxios(error),
      });
      setOpenDeleteCredito(false);
      setCreditoToDelete(null);

      // revalidar/refetch
      await queryClient.invalidateQueries({ queryKey: CREDITS_QUERY_KEY });
    } catch (err) {
      console.error("Error al eliminar crédito:", err);
      // opcional: muestra un toast de error
    }
  };

  const credits = creditosResponse?.data ?? [];
  const meta = creditosResponse?.meta ?? {
    page,
    limit,
    total: 0,
    pages: 1,
    sortBy: "fechaInicio",
    sortOrder: "desc",
    hasMore: false,
  };

  return (
    <motion.div
      {...DesvanecerHaciaArriba}
      className="container p-4 space-y-4 mx-auto"
    >
      <PageHeader
        title="Administrador de créditos"
        sticky={false}
        fallbackBackTo="/"
      />

      <CreditTable
        data={credits}
        isLoading={isLoading}
        search={search}
        onSearchChange={(e) => {
          setSearch(e.target.value);
          // opcional: debounce + setPage(1)
          setPage(1);
        }}
        page={meta.page}
        limit={meta.limit}
        totalPages={meta.pages}
        totalCount={meta.total}
        onPageChange={setPage}
        onLimitChange={(n) => {
          setLimit(n);
          setPage(1);
        }}
        onOpenCredit={(c) => console.log("open credit", c)}
        onRegisterPayment={(c) => console.log("register payment", c)}
        onOpenHistory={(c) => console.log("open history", c)}
        // NUEVO:
        canDelete={isAdmin}
        onRequestDelete={handleAskDelete}
      />
      <AdvancedDialog
        title="Eliminar crédito"
        description="Se procederá a eliminar este registro de crédito"
        open={openDeletCredito}
        onOpenChange={setOpenDeleteCredito}
        confirmButton={{
          label: "Si, eliminar",
          onClick: () => handleConfirmDelete(),
          loading: isPendingDeleteCredito,
          disabled: isPendingDeleteCredito,
          loadingText: "Eliminando...",
        }}
        cancelButton={{
          label: "Cancelar",
          onClick: () => setOpenDeleteCredito(false),
        }}
      />
    </motion.div>
  );
}

export default CreditoMainPageManage;
