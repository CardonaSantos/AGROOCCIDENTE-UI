// /Pedidos/PedidosMainPage.tsx
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/components/Context/ContextSucursal";
import { toast } from "sonner";
import useClientesSelect from "@/hooks/getClientsSelect/use-get-clients-to-select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createPedido, getPedidos } from "../API/api";
import PedidosTable from "./PedidosTable";
import CreatePedidoCard from "./CreatePedidoCard";
import { PedidoCreate } from "../Interfaces/createPedido.interfaces";
import { keepPreviousData } from "@tanstack/react-query";
import useGetSucursales from "@/hooks/getSucursales/use-sucursales";
import { useProductosToPedidos } from "@/hooks/getProductosToPedidos/useProductosToPedidos";
import axios from "axios";
import { getApiErrorMessageAxios } from "@/Pages/Utils/UtilsErrorApi";
const API_URL = import.meta.env.VITE_API_URL;

type Option = { label: string; value: string };

export default function PedidosMainPage() {
  const sucursalId = useStore((s) => s.sucursalId) ?? 0;
  const userId = useStore((s) => s.userId) ?? 0;
  const [openDeleteRegist, setOpenDeleteRegist] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // ---------- Clientes para select ----------
  const {
    data: clientes,
    // isLoading: cLoading,
    // isError: cError,
  } = useClientesSelect(
    {},
    {
      onError: (e) =>
        toast.error((e as Error)?.message ?? "Error al cargar clientes"),
    }
  );

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

  const {
    data: productosResp,
    // isLoading: pLoading,
    // isFetching: pFetching,
  } = useProductosToPedidos({
    page: pageProd,
    pageSize: pageSizeProd,
    search,
  });

  const productos = productosResp?.data ?? [];

  const [openCreate, setOpenCreate] = useState<boolean>(false);

  // ---------- Crear pedido ----------
  const crearPedidoMut = useMutation({
    mutationFn: (body: PedidoCreate) => createPedido(body),
    onSuccess: () => {
      toast.success("Pedido creado");
      refetchPedidos();
      setOpenCreate(false);
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Error al crear pedido");
      setOpenCreate(false);
    },
  });

  const deletePedidoMut = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await axios.delete(
        `${API_URL}/pedidos/delete-regist-pedido/${id}`
      );
      return data;
    },
    onError: (err) => toast.error(getApiErrorMessageAxios(err)),
  });

  const handleDelete = (id: number) => {
    setIsDeleting(true);
    deletePedidoMut.mutate(id, {
      onSuccess: () => {
        toast.success("Pedido eliminado");
        refetchPedidos();
        setOpenDeleteRegist(false);
      },
      onError: (err) => {
        toast.error(getApiErrorMessageAxios(err));
      },
      onSettled: () => {
        setIsDeleting(false); // 🔥 siempre se ejecuta
        refetchPedidos();
      },
    });
  };

  // ---------- Listado de pedidos ----------
  const [pagePedidos, setPagePedidos] = useState(1);
  const pageSizePedidos = 10;

  const {
    data: pedidosResp,
    isLoading: listLoading,
    refetch: refetchPedidos,
  } = useQuery({
    queryKey: ["pedidos", pagePedidos, pageSizePedidos, sucursalId],
    queryFn: () =>
      getPedidos({
        page: pagePedidos,
        pageSize: pageSizePedidos,
        sucursalId,
        sortBy: "fecha",
        sortDir: "desc",
      }),
    placeholderData: keepPreviousData,
  });

  if (isLoading) return <p>Cargando sucursales…</p>;
  if (isError) return <p className="text-red-600">Error cargando sucursales</p>;

  return (
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
        />
      </TabsContent>
    </Tabs>
  );
}
