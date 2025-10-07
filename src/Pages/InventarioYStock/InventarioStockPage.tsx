import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DesvanecerHaciaArriba from "@/Crm/Motion/DashboardAnimations";
import { Categorias, ProductCreate } from "./interfaces.interface";
import { useStore } from "@/components/Context/ContextSucursal";
import { createOneCategory, deleteOneCategory, updateCategory } from "./api";
import { toast } from "sonner";
import { SimpleProvider } from "@/Types/Proveedor/SimpleProveedor";
import Inventario from "./Inventario";
import { useApiQuery } from "@/hooks/genericoCall/genericoCallHook";
import { PaginatedInventarioResponse } from "./interfaces/InventaryInterfaces";
import { QueryTable } from "./interfaces/querytable";

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

  const { data: cats = [], refetch: reFetchCats } = useApiQuery<Categorias[]>(
    ["categorias"],
    "/categoria/",
    {
      // params: {}
    },
    {
      initialData: [],
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

  const createCategory = async (nombreCategorya: string) => {
    if (!nombreCategorya.trim()) {
      toast.info("Una categoría no puede estar vacía");
      return;
    }

    await toast.promise(createOneCategory(nombreCategorya), {
      loading: "Creando categoría…",
      success: "Categoría creada con éxito",
      error: "Error al crear categoría",
    });
    reloadInventaryData();
    setOpenCategory(false);
  };

  const deleteCategory = async (categoryID: number) => {
    if (!categoryID) {
      toast.info("No hay una categoría seleccionada");
      return;
    }

    await toast.promise(deleteOneCategory(categoryID), {
      loading: "Eliminando categoría...",
      success: "Categoría eliminada",
      error: "Error al eliminar categoría",
    });
    reloadInventaryData();
    // await loadInventoryData();
  };

  const updateOneCategory = async (
    nombreCategory: string,
    categoryID: number
  ) => {
    if (!nombreCategory && !categoryID) {
      toast.info("Datos insuficientes");
      return;
    }

    await toast.promise(updateCategory(nombreCategory, categoryID), {
      loading: "Actualizando categoría...",
      success: "Categoría actualizada",
      error: "Error al actualizar categoría",
    });
    reloadInventaryData();
    // setOpenCategory(false);
  };

  const reloadInventaryData = async () => {
    await reFetchInventario();
    await reFetchCats();
    await reFetchProvs();
  };

  //si cambia el filtro, regresa a primera pagina
  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [JSON.stringify(searchQuery)]);

  return (
    <motion.div {...DesvanecerHaciaArriba} className="w-full px-4">
      <Inventario
        setSearchQuery={setSearchQuery}
        categorias={cats}
        proveedores={provs}
        // PROPS PARA ABRIR EL MODAL
        openCategory={openCategory}
        setOpenCategory={setOpenCategory}
        loadInventoryData={reloadInventaryData}
        //createCategory
        createCategory={createCategory}
        deleteCategory={deleteCategory}
        updateOneCategory={updateOneCategory}
        //Para creacion de producto y limpieza al terminar de crear
        productCreate={productCreate}
        setProductCreate={setProductCreate}
        searchQuery={searchQuery}
        productsInventario={productsInventario}
        setPagination={setPagination}
        pagination={pagination}
        //Para cropear imagenes el resultado
      />
    </motion.div>
  );
}

export default InventarioStockPage;
