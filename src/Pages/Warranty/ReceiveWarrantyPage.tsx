"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useStore } from "@/components/Context/ContextSucursal"; // Asumiendo que esta ruta es correcta
import { motion } from "framer-motion";
import {
  fetchAllGarantias,
  fetchProvidersToWarranty,
  fetchVentas,
  submitWarrantyRegistration,
} from "./api"; // Nuevas funciones de API
import type {
  GarantiaFormData,
  ProveedoresResponse,
} from "./interfaces.interfaces"; // Nuevo archivo de tipos
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ProductoVenta,
  ProductoVentaToTable,
  VentaHistorialItem,
  VentasHistorial,
} from "./interfaces2.interfaces";
import CardGarantiaCreate from "./CardGarantiaCreate";
import DesvanecerHaciaArriba from "@/Crm/Motion/DashboardAnimations";
import { WarrantyList } from "./garantiasMap/warranty-list";
import { GarantiaDto } from "./interfacesTable";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";
import { useApiMutation } from "@/hooks/genericoCall/genericoCallHook";
// Sub-componentes para la sección de detalles
type OptionType = { value: number; label: string };
export default function ReceiveWarrantyPage() {
  // Store
  const userID = useStore((s) => s.userId) ?? 0;
  const sucursalID = useStore((s) => s.sucursalId) ?? 0;

  // Server data
  const [providers, setProviders] = useState<ProveedoresResponse[]>([]);
  const [ventas, setVentas] = useState<VentasHistorial>([]);
  const [garantias, setGarantias] = useState<GarantiaDto[]>([]);

  // UI state
  const [ventaSelected, setVentaSelected] = useState<VentaHistorialItem | null>(
    null
  );
  const [productoSelected, setProductoSelected] =
    useState<ProductoVenta | null>(null);
  const [productSelected, setProductSelected] = useState<ProductoVenta | null>(
    null
  );
  const [openSelectedProduct, setOpenSelectedProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductoVentaToTable | null>(null);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [selecProviderID, setSelecProviderID] = useState<OptionType | null>(
    null
  );

  // Form
  const [formData, setFormData] = useState<GarantiaFormData>({
    clienteId: 0,
    productoId: 0,
    comentario: "",
    proveedorId: 0,
    descripcionProblema: "",
    usuarioIdRecibe: userID,
    sucursalId: sucursalID,
    estado: "",
    ventaId: 1,
    cantidad: 1,
    ventaProductoID: 1,
  });

  // Inicializar/recargar data
  const loadInitialData = useCallback(async () => {
    try {
      const [providersData, ventasResponse, garantiasData] = await Promise.all([
        fetchProvidersToWarranty(),
        fetchVentas(),
        fetchAllGarantias(),
      ]);
      setProviders(providersData);
      setVentas(ventasResponse);
      setGarantias(garantiasData);
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Error al cargar datos iniciales");
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Sincronizar userID/sucursalID en el form si cambian
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      usuarioIdRecibe: userID,
      sucursalId: sucursalID,
    }));
  }, [userID, sucursalID]);

  // Select options
  const providerOptionSelect = useMemo<OptionType[]>(
    () => providers.map((prov) => ({ label: prov.nombre, value: prov.id })),
    [providers]
  );

  const optionsVenta = useMemo<OptionType[]>(
    () =>
      ventas.map((v) => ({
        label: `Venta No. #${v.id} | Cliente: ${v.cliente.nombre} | Productos: ${v.productos.length}`,
        value: v.id,
      })),
    [ventas]
  );

  // Handlers
  const handleChangeSelectVenta = useCallback(
    (opt: OptionType | null) => {
      if (!opt) {
        setVentaSelected(null);
        return;
      }
      const venta = ventas.find((v) => v.id === opt.value) ?? null;
      setVentaSelected(venta);
    },
    [ventas]
  );

  const handleChangeProvider = useCallback((selected: OptionType | null) => {
    setSelecProviderID(selected);
    setFormData((prev) => ({
      ...prev,
      proveedorId: selected ? selected.value : 0,
    }));
  }, []);

  // Crear garantía
  const [isSubmittingGarantia, setIsSubmittingGarantia] = useState(false);
  const handleSubmitRegistGarantia = useCallback(async () => {
    if (isSubmittingGarantia) return;
    setIsSubmittingGarantia(true);
    try {
      await toast.promise(
        submitWarrantyRegistration({
          ...formData,
          cantidadDevuelta: formData.cantidad,
        }),
        {
          loading: "Registrando garantía...",
          success: "Registro insertado correctamente",
          error: (error) => getApiErrorMessageAxios(error),
        }
      );

      // Reset form mínimo
      setFormData((prev) => ({
        ...prev,
        clienteId: 0,
        productoId: 0,
        comentario: "",
        proveedorId: 0,
        descripcionProblema: "",
        estado: "",
        ventaId: 1,
        cantidad: 1,
        ventaProductoID: 1,
        // mantener usuarioIdRecibe / sucursalId sincronizados por efecto
      }));
      setSelectedProduct(null);

      // Refrescar data
      await loadInitialData();
    } finally {
      setIsSubmittingGarantia(false);
    }
  }, [formData, isSubmittingGarantia, loadInitialData]);

  // Delete garantía
  const [garantiaSelected, setGarantiaSelected] = useState<number | null>(null);
  const [isOpenDelete, setIsOpenDelete] = useState(false);

  // IMPORTANTE: el endpoint depende del id seleccionado
  const deleteEndpoint =
    garantiaSelected != null
      ? `/warranty/${garantiaSelected}`
      : "/warranty/__unset__";

  const eliminarGarantia = useApiMutation<void, void>("delete", deleteEndpoint);

  const handleDelete = useCallback(() => {
    if (garantiaSelected == null) {
      toast.error("Selecciona una garantía válida");
      return;
    }
    eliminarGarantia.mutate(undefined, {
      onSuccess: async () => {
        toast.success("Garantía eliminada");
        await loadInitialData();
        setIsOpenDelete(false);
      },
      onError: (err) => {
        toast.error(getApiErrorMessageAxios(err));
        setIsOpenDelete(false);
      },
    });
  }, [garantiaSelected, eliminarGarantia, loadInitialData]);

  return (
    <motion.div {...DesvanecerHaciaArriba} className="w-full">
      <Tabs defaultValue="regist" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="regist" className="w-full">
            Registrar Garantía
          </TabsTrigger>
          <TabsTrigger value="warranties" className="w-full">
            Registros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regist" className="w-full">
          <CardGarantiaCreate
            optionsVenta={optionsVenta}
            ventaSelected={ventaSelected}
            setVentaSelected={setVentaSelected}
            selecProviderID={selecProviderID}
            setSelecProviderID={setSelecProviderID}
            productoSelected={productoSelected}
            setProductoSelected={setProductoSelected}
            ventas={ventas}
            handleChangeSelectVenta={handleChangeSelectVenta}
            providerOptionSelect={providerOptionSelect}
            handleChangeProvider={handleChangeProvider}
            productSelected={productSelected}
            setProductSelected={setProductSelected}
            //open dialog selected productg
            openSelectedProduct={openSelectedProduct}
            setOpenSelectedProduct={setOpenSelectedProduct}
            //nuevos
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            openProductDialog={openProductDialog}
            setOpenProductDialog={setOpenProductDialog}
            //FORMDATA
            setFormData={setFormData}
            formData={formData}
            //proveedores
            providers={providers}
            handleSubmitRegistGarantia={handleSubmitRegistGarantia}
            //truncador de boton
            isSubmittingGarantia={isSubmittingGarantia}
            setIsSubmittingGarantia={setIsSubmittingGarantia}
          />
        </TabsContent>
        <TabsContent value="warranties" className="w-full">
          <WarrantyList
            handleDelete={handleDelete}
            garantias={garantias}
            setGarantiaSelected={setGarantiaSelected}
            isOpenDelete={isOpenDelete}
            setIsOpenDelete={setIsOpenDelete}
            eliminarGarantia={eliminarGarantia}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
