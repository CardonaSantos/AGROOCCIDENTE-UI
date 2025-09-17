// /Pedidos/PedidosMainPage.tsx
"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/components/Context/ContextSucursal";
import { toast } from "sonner";
import useClientesSelect from "@/hooks/getClientsSelect/use-get-clients-to-select";
import PedidosTable from "./PedidosTable";
import CreatePedidoCard from "./CreatePedidoCard";
import { PedidoCreate } from "../Interfaces/createPedido.interfaces";
import { keepPreviousData } from "@tanstack/react-query";
import useGetSucursales from "@/hooks/getSucursales/use-sucursales";
import { useProductosToPedidos } from "@/hooks/getProductosToPedidos/useProductosToPedidos";
import { getApiErrorMessageAxios } from "@/Pages/Utils/UtilsErrorApi";
import { axiosClient } from "@/hooks/getClientsSelect/Queries/axiosClient";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import { motion } from "framer-motion";
import DesvanecerHaciaArriba from "@/Crm/Motion/DashboardAnimations";
import { PageHeader } from "@/utils/components/PageHeaderPos";
type Option = { label: string; value: string };

// (mínimo) tipo de respuesta del listado de pedidos
interface PedidosListResponse {
  data: any[]; // si tienes un tipo fuerte, cámbialo aquí
  page: number;
  pageSize: number;
  totalItems: number;
}

export default function PedidosMainPage() {
  const sucursalId = useStore((s) => s.sucursalId) ?? 0;
  const userId = useStore((s) => s.userId) ?? 0;

  const [openDeleteRegist, setOpenDeleteRegist] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------- Clientes para select ----------
  const { data: clientes } = useClientesSelect(
    {},
    {
      onError: (e) =>
        toast.error((e as Error)?.message ?? "Error al cargar clientes"),
    }
  );
  console.log("Los clientes son: ", clientes);

  const { data: sucursales, isLoading, isError } = useGetSucursales();

  const clientesOptions: Option[] = useMemo(
    () =>
      (clientes ?? []).map((c) => ({
        value: String(c.id),
        label: `${c.nombre} ${c.apellidos ?? ""}`.trim(),
      })),
    [clientes]
  );

  const sucursalesOptions: Option[] = useMemo(
    () =>
      (sucursales ?? []).map((c) => ({
        value: String(c.id),
        label: c.nombre,
      })),
    [sucursales]
  );

  // ---------- Productos (para seleccionar) ----------
  const [search, setSearch] = useState("");
  const [pageProd, setPageProd] = useState(1);
  const pageSizeProd = 10;

  const { data: productosResp } = useProductosToPedidos({
    page: pageProd,
    pageSize: pageSizeProd,
    search,
  });

  const productos = productosResp?.data ?? [];
  const [openCreate, setOpenCreate] = useState(false);

  // ---------- Crear pedido (POST /pedidos) ----------
  const crearPedidoMut = useApiMutation<any, PedidoCreate>(
    "post",
    "/pedidos/create-pedido",
    undefined,
    {
      onSuccess: () => {
        toast.success("Pedido creado");
        refetchPedidos();
        setOpenCreate(false);
      },
      onError: (e: any) => {
        toast.error(e?.message ?? "Error al crear pedido");
        setOpenCreate(false);
      },
    }
  );

  // ---------- Eliminar pedido (DELETE /pedidos/delete-regist-pedido/:id) ----------
  // Nota: usamos un mutationFn para path param dinámico (hasta que el wrapper soporte URL por variables)
  const deletePedidoMut = useApiMutation<any, { id: number }>(
    "delete",
    "/pedidos/delete-regist-pedido/:id",
    undefined,
    {
      mutationFn: async ({ id }) => {
        const { data } = await axiosClient.delete(
          `/pedidos/delete-regist-pedido/${id}`
        );
        return data;
      },
      onError: (err) => toast.error(getApiErrorMessageAxios(err)),
    }
  );

  const handleDelete = (id: number) => {
    setIsDeleting(true);
    deletePedidoMut.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Pedido eliminado");
          refetchPedidos();
          setOpenDeleteRegist(false);
        },
        onError: (err) => {
          toast.error(getApiErrorMessageAxios(err));
        },
        onSettled: () => {
          setIsDeleting(false);
          refetchPedidos();
        },
      }
    );
  };

  // ---------- Listado de pedidos (GET /pedidos) ----------
  const [pagePedidos, setPagePedidos] = useState(1);
  const pageSizePedidos = 10;

  const {
    data: pedidosResp,
    isFetching: listLoading,
    refetch: refetchPedidos,
  } = useApiQuery<PedidosListResponse>(
    ["pedidos", pagePedidos, pageSizePedidos, sucursalId],
    "/pedidos",
    {
      params: {
        page: pagePedidos,
        pageSize: pageSizePedidos,
        sucursalId,
        sortBy: "fecha",
        sortDir: "desc",
      },
    },
    {
      placeholderData: keepPreviousData,
    }
  );

  if (isLoading) return <p>Cargando sucursales…</p>;
  if (isError) return <p className="text-red-600">Error cargando sucursales</p>;

  const fetchAgain = async () => {
    refetchPedidos();
  };

  return (
    <motion.div {...DesvanecerHaciaArriba}>
      <PageHeader
        title="Pedidos"
        subtitle="Cree pedidos para clientes o su sucursal"
        fallbackBackTo="/"
        sticky={false}
      />
      <Tabs defaultValue="pedidos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="gPedido">Generar Pedido</TabsTrigger>
        </TabsList>

        {/* --- Crear Pedido --- */}
        <TabsContent value="gPedido" className="space-y-4">
          <CreatePedidoCard
            openCreate={openCreate}
            setOpenCreate={setOpenCreate}
            search={search}
            setSearch={setSearch}
            sucursalId={sucursalId}
            userId={userId}
            clientesOptions={clientesOptions}
            sucursalesOptions={sucursalesOptions}
            productos={productos}
            onSubmit={(body) => crearPedidoMut.mutateAsync(body)}
            submitting={crearPedidoMut.isPending}
            pageProd={pageProd}
            setPageProd={setPageProd}
            totalPages={productosResp?.totalPages ?? 1}
          />
        </TabsContent>

        {/* --- Tabla de pedidos --- */}
        <TabsContent value="pedidos" className="space-y-4">
          <PedidosTable
            isDeleting={isDeleting}
            setIsDeleting={setIsDeleting}
            handleDelete={handleDelete}
            openDeleteRegist={openDeleteRegist}
            setOpenDeleteRegist={setOpenDeleteRegist}
            data={pedidosResp?.data ?? []}
            page={pedidosResp?.page ?? 1}
            pageSize={pedidosResp?.pageSize ?? 10}
            totalItems={pedidosResp?.totalItems ?? 0}
            onPageChange={setPagePedidos}
            loading={listLoading}
            fetchAgain={fetchAgain}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
