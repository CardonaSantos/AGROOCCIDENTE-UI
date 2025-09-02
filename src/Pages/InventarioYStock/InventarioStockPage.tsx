import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DesvanecerHaciaArriba from "@/Crm/Motion/DashboardAnimations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import {
  Categorias,
  Category,
  CroppedImage,
  ProductCreate,
  Provider,
  StockEntry,
} from "./interfaces.interface";
import { useStore } from "@/components/Context/ContextSucursal";
import {
  createOneCategory,
  deleteOneCategory,
  fetchProducts,
  fetchProviders,
  updateCategory,
} from "./api";
import { toast } from "sonner";
import { ProductsInventary } from "@/Types/Inventary/ProductsInventary";
import Stock from "./Stock";
import { SimpleProvider } from "@/Types/Proveedor/SimpleProveedor";
import { PrecioProductoInventario } from "../Inventario/preciosInterfaces.interface";
import Inventario from "./Inventario";
const API_URL = import.meta.env.VITE_API_URL;

function InventarioStockPage() {
  const sucursalId = useStore((s) => s.sucursalId);
  const recibidoPorId = useStore((s) => s.userId);
  const [products, setProducts] = useState<ProductsInventary[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDialogInspect, setIsDialogInspect] = useState<boolean>(false);
  //CATEGORIAS
  const [openCategory, setOpenCategory] = useState<boolean>(false);
  const [croppedImages, setCroppedImages] = useState<CroppedImage[]>([]);

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

  const [preciosProducto, setPreciosProducto] = useState<
    PrecioProductoInventario[]
  >([]);

  // Load initial data
  const loadData = async () => {
    try {
      const [prods, provs] = await Promise.all([
        fetchProducts(),
        fetchProviders(),
      ]);
      setProducts(prods);
      setProviders(provs);
    } catch (err) {
      toast.error("Error al cargar catálogo de inventario");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addEntry = (entry: StockEntry) => {
    setStockEntries((prev) => [...prev, entry]);
  };
  const removeEntry = (idx: number) => {
    setStockEntries((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateEntry = (entry: StockEntry) => {
    setStockEntries((prev) =>
      prev.map((e) => (e.productoId === entry.productoId ? entry : e))
    );
  };

  const submitStock = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await toast.promise(
        axios.post(`${API_URL}/stock`, {
          stockEntries,
          proveedorId: Number(selectedProviderId),
          sucursalId,
          recibidoPorId,
        }),
        {
          loading: "Enviando stocks...",
          success: "Stocks añadidos correctamente",
          error: "Error al enviar stocks",
        }
      );

      // On success, refresh data and reset state
      await loadData();
      setStockEntries([]);
      setSelectedProviderId("");
      setIsDialogInspect(false);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleClearNewProduct = () => {
    setProductCreate({
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
    setCroppedImages([]);
    setPreciosProducto([]);
  };

  const handleAddProduct = async (
    productCreate: ProductCreate,
    preciosProducto: PrecioProductoInventario[],
    croppedImages: CroppedImage[]
  ) => {
    if (
      !productCreate.nombre ||
      productCreate.categorias.length <= 0 ||
      !productCreate.codigoProducto ||
      !productCreate.precioCostoActual ||
      productCreate.precioCostoActual <= 0
    ) {
      toast.info("Algunos campos son obligatorios");
      return;
    }

    if (!recibidoPorId) {
      toast.warning("Falta informacion del usuario");
    }

    const formData = new FormData();
    formData.append("nombre", productCreate.nombre);
    formData.append("descripcion", productCreate.descripcion || "");
    formData.append("codigoProducto", productCreate.codigoProducto);
    formData.append("codigoProveedor", productCreate.codigoProveedor || "");
    formData.append(
      "stockMinimo",
      productCreate.stockMinimo?.toString() ?? "0"
    );
    formData.append(
      "precioCostoActual",
      productCreate.precioCostoActual!.toString()
    );

    formData.append("categorias", JSON.stringify(productCreate.categorias));
    formData.append("precioVenta", JSON.stringify(preciosProducto));
    // Añadir imágenes
    croppedImages.forEach((img) => {
      const file = new File([img.blob], img.fileName, { type: img.blob.type });
      formData.append("images", file);
    });

    await toast.promise(axios.post(`${API_URL}/products`, formData), {
      loading: "Creando producto…",
      success: "Producto creado",
      error: "Error al crear producto",
    });

    loadInventoryData();
    handleClearNewProduct();
  };

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
      <Tabs defaultValue="inventario" className="w-full">
        <TabsList className="flex w-full">
          <TabsTrigger value="inventario" className="w-1/2 text-center">
            Inventario
          </TabsTrigger>
          {/* <TabsTrigger value="stocks" className="w-1/2 text-center">
            Stocks
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="inventario" className="w-full">
          <Inventario
            products={productsInventary}
            categorias={categorias}
            proveedores={suppliers}
            onAddProduct={handleAddProduct}
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
            croppedImages={croppedImages}
            setCroppedImages={setCroppedImages}
            //Para los precios producto
            setPreciosProducto={setPreciosProducto}
            preciosProducto={preciosProducto}
          />
        </TabsContent>
        <TabsContent value="stocks" className="w-full">
          <Stock
            products={products}
            providers={providers}
            stockEntries={stockEntries}
            onAddEntry={addEntry}
            onRemoveEntry={removeEntry}
            onUpdateEntry={updateEntry}
            onSubmit={submitStock}
            selectedProviderId={selectedProviderId}
            setSelectedProviderId={setSelectedProviderId}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            isDialogInspect={isDialogInspect}
            setIsDialogInspect={setIsDialogInspect}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default InventarioStockPage;
