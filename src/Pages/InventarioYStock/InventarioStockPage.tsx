import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DesvanecerHaciaArriba from "@/Crm/Motion/DashboardAnimations";
import { Categorias, ProductCreate } from "./interfaces.interface";
import { useStore } from "@/components/Context/ContextSucursal";
import { SimpleProvider } from "@/Types/Proveedor/SimpleProveedor";
import Inventario from "./Inventario";
import { useApiQuery } from "@/hooks/genericoCall/genericoCallHook";
import { PaginatedInventarioResponse } from "./interfaces/InventaryInterfaces";
import { QueryTable } from "./interfaces/querytable";
import {
  CategoriaWithCount,
  CATS_LIST_QK,
} from "../Categorias/CategoriasMainPage";

function InventarioStockPage() {
  const recibidoPorId = useStore((s) => s.userId) ?? 0;
  const sucursalId = useStore((s) => s.sucursalId) ?? 0;
  //CATEGORIAS
  const [openCategory, setOpenCategory] = useState<boolean>(false);
  const [productCreate, setProductCreate] = useState<ProductCreate>({
    precioCostoActual: null,
    codigoProducto: "",
    codigoProveedor: "",
    categorias: [],
    descripcion: "",
    nombre: "",
    precioVenta: [],
    creadoPorId: recibidoPorId,
    stockMinimo: null,
    imagenes: [],
  });
  //DATA PARA INVENTARIO
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [searchQuery, setSearchQuery] = useState<QueryTable>({
    categorias: [],
    codigoProducto: "",
    fechaVencimiento: "",
    productoNombre: "",
    sucursalId: sucursalId,
    precio: "",
    tipoPresentacion: [],
  });

  const handleSelectCat = (ids: number[]) => {
    setSearchQuery((prev) => ({
      ...prev,
      categorias: ids,
    }));
  };

  const {
    data: productsInventario = {
      data: [],
      meta: {
        limit: 0,
        page: 0,
        totalCount: 0,
        totalPages: 0,
      },
    },
    refetch: reFetchInventario,
    isFetching: isloadingInventario,
  } = useApiQuery<PaginatedInventarioResponse>(
    [
      "productos-inventario",
      searchQuery,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    "products/products/for-inventary",
    {
      params: {
        ...searchQuery,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      },
    },
    {
      placeholderData: {
        data: [],
        meta: { totalCount: 0, totalPages: 0, page: 1, limit: 10 },
      },
    }
  );

  const { data: cats } = useApiQuery<CategoriaWithCount[]>(
    CATS_LIST_QK,
    "/categoria/all-cats-with-counts",
    undefined,
    {
      staleTime: 0,
      refetchOnMount: "always",
    }
  );

  const { data: provs = [], refetch: reFetchProvs } = useApiQuery<
    SimpleProvider[]
  >(
    ["proveedores"],
    "/proveedor/simple-proveedor",
    {
      // params: {}
    },
    {
      initialData: [],
    }
  );

  const reloadInventaryData = async () => {
    await reFetchInventario();
    await reFetchProvs();
  };
  const categoriasSecure = Array.isArray(cats) ? cats : [];

  //si cambia el filtro, regresa a primera pagina
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [JSON.stringify(searchQuery)]);
  console.log("los productos inventario son: ", productsInventario);

  return (
    <motion.div {...DesvanecerHaciaArriba} className="w-full px-4">
      <Inventario
        //filtrado-->
        handleSelectCat={handleSelectCat}
        //
        setSearchQuery={setSearchQuery}
        categorias={categoriasSecure}
        proveedores={provs}
        // PROPS PARA ABRIR EL MODAL
        openCategory={openCategory}
        setOpenCategory={setOpenCategory}
        loadInventoryData={reloadInventaryData}
        //createCategory
        //Para creacion de producto y limpieza al terminar de crear
        productCreate={productCreate}
        setProductCreate={setProductCreate}
        searchQuery={searchQuery}
        productsInventario={productsInventario}
        setPagination={setPagination}
        pagination={pagination}
        //Para cropear imagenes el resultado
        isloadingInventario={isloadingInventario}
      />
    </motion.div>
  );
}

export default InventarioStockPage;
