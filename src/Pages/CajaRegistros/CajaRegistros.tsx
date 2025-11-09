import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Database, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Table from "./Table/Table";
import {
  RegistroCajaResponse,
  PaginatedRegistrosCajaResponse,
  lenghtData,
} from "./interfaces/registroscajas.interfaces";
import { getRegistrosCajas } from "./API/api"; // Asumiendo que existe
import { useStore } from "@/components/Context/ContextSucursal";
import MovimientosTable from "../movimientos-cajas/TableMovimientosCaja";
import { MovimientoCajaItem } from "../movimientos-cajas/Interfaces/registroCajas";
import { PagedResponseMovimientos } from "../movimientos-cajas/Interfaces/types";
import { getRegistrosMovimientos } from "../movimientos-cajas/API/api";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/utils/components/PageHeaderPos";

const DesvanecerHaciaArriba = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

function CajaRegistros() {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const sucursalIdFromStore = useStore((state) => state.sucursalId) ?? 0;
  const [pageData, setPageData] =
    useState<PaginatedRegistrosCajaResponse | null>(null);

  const [pageDataMovimientos, setPageDataMovimientos] =
    useState<PagedResponseMovimientos | null>(null);

  const cajas: RegistroCajaResponse[] = pageData?.items ?? [];
  const movimientos: MovimientoCajaItem[] = pageDataMovimientos?.items ?? [];

  const [registLenght, setRegistLenght] = useState<lenghtData>({
    cajasLength: 0,
    movimientosLength: 0,
  });

  const getData = async () => {
    setLoading(true);
    try {
      const dt = await getRegistrosCajas({
        page,
        limit,
      });
      setPageData(dt);
      setRegistLenght((prev) => ({
        ...prev,
        cajasLength: dt.total,
      }));
    } catch (error) {
      console.error("Error al obtener registros de caja:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDataMovimientoCaja = async () => {
    setLoading(true);
    try {
      const dt = await getRegistrosMovimientos({
        page,
        limit,
      });
      setPageDataMovimientos(dt);
      setRegistLenght((prev) => ({
        ...prev,
        movimientosLength: dt.total,
      }));
    } catch (error) {
      console.error("Error al obtener registros de caja:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
    getDataMovimientoCaja();
  }, [page, limit, sucursalIdFromStore]);

  const refreshData = () => {
    getData();
    getDataMovimientoCaja();
  };

  console.log("Los movimientos de cajas son: ", pageDataMovimientos);
  console.log("Los registros de cajas son: ", pageData);

  return (
    <motion.div
      className="container mx-auto space-y-4 p-3" // Reducido padding y espacio
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title="Registros de cajas y movimientos financieros"
        subtitle="Registre turnos en caja y movimientos financieros"
        sticky={false}
        fallbackBackTo="/"
      />
      {/* Header compacto */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">
                  Monitorea tus registros de cajas y movimientos financieros
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pageData && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Database className="h-3 w-3" />
                    <span>{pageData.total} registros</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={loading}
                  className="gap-1.5 h-8 text-xs bg-transparent" // Más compacto
                >
                  <RefreshCw
                    className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
                  />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs compactos */}
      <motion.div variants={itemVariants}>
        <Tabs className="w-full" defaultValue="registrarcaja">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 h-auto p-0.5 bg-muted">
            <TabsTrigger
              value="registrarcaja"
              className="w-full text-xs md:text-sm py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all" // Reducido padding y tamaño de texto
            >
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" />
                <span className="truncate">Registros de Caja</span>
                {cajas.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1">
                    {registLenght.cajasLength}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="movimientoscaja"
              className="w-full text-xs md:text-sm py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Database className="h-3 w-3" />
                <span className="truncate">Movimientos financieros</span>
                {cajas.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1">
                    {registLenght.movimientosLength}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registrarcaja" className="mt-4">
            <motion.div {...DesvanecerHaciaArriba} className="w-full">
              {loading ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />{" "}
                      <div className="text-muted-foreground text-sm">
                        Cargando registros...
                      </div>{" "}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Table
                  data={cajas}
                  page={page}
                  limit={limit}
                  pages={pageData?.pages ?? 0}
                  total={pageData?.total ?? 0}
                  loading={loading}
                  onChangePage={setPage}
                  onChangeLimit={setLimit}
                  // registLenght={registLenght}
                />
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="movimientoscaja" className="mt-4">
            <motion.div {...DesvanecerHaciaArriba} className="w-full">
              {loading ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />{" "}
                      <div className="text-muted-foreground text-sm">
                        Cargando registros...
                      </div>{" "}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <MovimientosTable
                  data={movimientos}
                  page={page}
                  limit={limit}
                  pages={pageData?.pages ?? 0}
                  total={pageData?.total ?? 0}
                  loading={loading}
                  onChangePage={setPage}
                  onChangeLimit={setLimit}
                  // registLenght={registLenght}
                />
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

export default CajaRegistros;
