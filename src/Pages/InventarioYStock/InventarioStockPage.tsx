import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DesvanecerHaciaArriba from "@/Crm/Motion/DashboardAnimations";
import axios from "axios";
import { Categorias, Category, ProductCreate } from "./interfaces.interface";
import { useStore } from "@/components/Context/ContextSucursal";
import { createOneCategory, deleteOneCategory, updateCategory } from "./api";
import { toast } from "sonner";
import { ProductsInventary } from "@/Types/Inventary/ProductsInventary";
import { SimpleProvider } from "@/Types/Proveedor/SimpleProveedor";
import Inventario from "./Inventario";
const API_URL = import.meta.env.VITE_API_URL;

function InventarioStockPage() {
  const recibidoPorId = useStore((s) => s.userId);

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
  const [productsInventary, setProductsInventary] = useState<
    ProductsInventary[]
  >([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<SimpleProvider[]>([]);

  const loadInventoryData = async () => {
    try {
      const [prods, cats, provs] = await Promise.all([
        axios.get<ProductsInventary[]>(
          `${API_URL}/products/products/for-inventary`
        ),
        axios.get<Categorias[]>(`${API_URL}/categoria/`),
        axios.get<SimpleProvider[]>(`${API_URL}/proveedor/simple-proveedor`),
      ]);
      setProductsInventary(prods.data);
      setCategorias(cats.data);
      setSuppliers(provs.data);
    } catch {
      toast.error("Error al cargar datos de inventario");
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

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

    await loadInventoryData();
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

    await loadInventoryData();
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

    await loadInventoryData();
    // setOpenCategory(false);
  };

  return (
    <motion.div {...DesvanecerHaciaArriba} className="w-full px-4">
      <Inventario
        products={productsInventary}
        categorias={categorias}
        proveedores={suppliers}
        // PROPS PARA ABRIR EL MODAL
        openCategory={openCategory}
        setOpenCategory={setOpenCategory}
        loadInventoryData={loadInventoryData}
        //createCategory
        createCategory={createCategory}
        deleteCategory={deleteCategory}
        updateOneCategory={updateOneCategory}
        //Para creacion de producto y limpieza al terminar de crear
        productCreate={productCreate}
        setProductCreate={setProductCreate}
        //Para cropear imagenes el resultado
      />
    </motion.div>
  );
}

export default InventarioStockPage;
