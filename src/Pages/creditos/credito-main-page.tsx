import React from "react";
import { motion } from "framer-motion";
import DesvanecerHaciaArriba from "@/Pages/NewDashboard/components/dashboard/motion/desvanecer-hacia-arriba";
import { PageHeader } from "@/utils/components/PageHeaderPos";
import { useApiQuery } from "@/hooks/genericoCall/genericoCallHook";
import { CreditAuthorizationListResponse } from "@/Pages/NewDashboard/credit-authorizations/interfaces/Interfaces.interfaces";
function CreditoMainPageManage() {
  const CREDITS_QUERY_KEY = ["creditos-query-key"];
  const { data: creditosResponse, isLoading: isLoadingCreditos } =
    useApiQuery<CreditAuthorizationListResponse>(
      CREDITS_QUERY_KEY,
      "credito-authorization",
      {
        params: {},
      },
      {
        refetchOnMount: "always",
        staleTime: 0,
      }
    );
  console.log("Los registros de credito y meta son: ", creditosResponse);

  // const secureDataResponse = creditosResponse.

  return (
    <motion.div {...DesvanecerHaciaArriba} className="container p-4 space-y-4">
      <PageHeader
        title="Administrador de créditos"
        sticky={false}
        fallbackBackTo="/"
      />

      <h2>Datos</h2>
    </motion.div>
  );
}

export default CreditoMainPageManage;
