import { motion } from "framer-motion";
import DesvanecerHaciaArriba from "@/Pages/NewDashboard/components/dashboard/motion/desvanecer-hacia-arriba";
import { PageHeader } from "@/utils/components/PageHeaderPos";
import { useApiQuery } from "@/hooks/genericoCall/genericoCallHook";
import type { CreditListResponse } from "./interfaces/CreditoResponse";
import * as React from "react";
import { keepPreviousData } from "@tanstack/react-query";
import CreditTable from "./components/table-creditos/header";

function CreditoMainPageManage() {
  const CREDITS_QUERY_KEY = ["creditos-query-key"];
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [search, setSearch] = React.useState("");

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
      />
    </motion.div>
  );
}

export default CreditoMainPageManage;
