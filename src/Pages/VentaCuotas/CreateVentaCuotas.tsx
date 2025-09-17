import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Calendar,
  ClipboardList,
  CreditCard,
  DollarSign,
  Loader2,
  Package,
  Percent,
  Plus,
  Save,
  SendHorizonal,
  ShoppingCart,
  Trash,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SelectM, { SingleValue } from "react-select"; // Importación correcta de react-select

import { toast } from "sonner";
import { useStore } from "@/components/Context/ContextSucursal";
import "react-datepicker/dist/react-datepicker.css";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditoRegistro } from "./CreditosType";
import { CreditRecordsTable } from "./CreditosRegistros";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Testigo {
  nombre: string;
  direccion: string;
  telefono: string;
}

interface Producto {
  productoId: number;
  cantidad: number;
  precioVenta: number;
}

interface FormData {
  clienteId: number;
  usuarioId: string;
  sucursalId: number;
  totalVenta: number;
  cuotaInicial: number;
  cuotasTotales: number;
  fechaInicio: string;
  estado: string;
  dpi: string;
  testigos: Testigo[];
  fechaContrato: string;
  montoVenta: number;
  garantiaMeses: string;
  productos: Producto[];
  diasEntrePagos: number;
  interes: number;
}

interface CustomersToCredit {
  id: number;
  nombre: string;
  telefono: string;
  dpi: string;
  creadoEn: string;
}

interface Precio {
  id: number;
  precio: number;
}

interface Stock {
  id: number;
  cantidad: number;
  fechaIngreso: string;
  fechaVencimiento: string | null;
}

interface ProductToCredit {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: string;
  creadoEn: string;
  actualizadoEn: string;
  precioCostoActual: number;
  precios: Precio[];
  stock: Stock[];
}

interface OptionTypeTS {
  label: string;
  value: number;
}

const API_URL = import.meta.env.VITE_API_URL;
//VERIFICAR PORQUE LA FUNCION NO MUESTRA EL PRODUCTO EN EL PDF
export default function CreateVentaCuotaForm() {
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;
  const userId = useStore((state) => state.userId) ?? 0;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    clienteId: 0,
    usuarioId: "",
    sucursalId: sucursalId,
    totalVenta: 0,
    cuotaInicial: 0,
    cuotasTotales: 0,
    fechaInicio: "", //MOVER AQUI
    estado: "ACTIVA",
    dpi: "",
    testigos: [],
    fechaContrato: "", //MOVER AQUI,
    montoVenta: 0,
    garantiaMeses: "",
    productos: [],
    diasEntrePagos: 0,
    interes: 0,
  });

  const handleChangeDate = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "fechaInicio" | "fechaContrato"
  ) => {
    const dateStr = e.target.value; // Toma el valor directamente como string en formato 'yyyy-MM-dd'
    setFormData((prevData) => ({
      ...prevData,
      [field]: dateStr, // Almacenamos solo la fecha sin la parte de la hora
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestigoChange = (
    index: number,
    field: keyof Testigo,
    value: string
  ) => {
    const newTestigos = [...formData.testigos];
    newTestigos[index] = { ...newTestigos[index], [field]: value };
    setFormData((prev) => ({ ...prev, testigos: newTestigos }));
  };

  const addTestigo = () => {
    setFormData((prev) => ({
      ...prev,
      testigos: [...prev.testigos, { nombre: "", direccion: "", telefono: "" }],
    }));
  };

  const removeTestigo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      testigos: prev.testigos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validaciones antes de enviar la data
    if (!formData.clienteId || Number(formData.clienteId) <= 0) {
      toast.info("Debe seleccionar un cliente.");
      setIsLoading(false);
      return;
    }

    if (!formData.cuotaInicial || Number(formData.cuotaInicial) <= 0) {
      toast.info("La cuota inicial debe ser mayor a 0.");
      setIsLoading(false);
      return;
    }

    if (!formData.cuotasTotales || Number(formData.cuotasTotales) <= 0) {
      toast.info("Debe especificar la cantidad de cuotas totales.");
      setIsLoading(false);
      return;
    }

    if (!formData.diasEntrePagos || Number(formData.diasEntrePagos) <= 0) {
      toast.info("Debe especificar los días entre pagos.");
      setIsLoading(false);
      return;
    }

    if (!formData.interes) {
      toast.info("Debe especificar el interés del credito.");
      setIsLoading(false);
      return;
    }

    if (!totalVentaCrédito || Number(totalVentaCrédito) <= 0) {
      toast.info("El monto total de la venta debe ser mayor a 0.");
      setIsLoading(false);
      return;
    }

    if (!formData.productos || formData.productos.length === 0) {
      toast.info("Debe agregar al menos un producto a la venta.");
      setIsLoading(false);
      return;
    }

    console.log("LOS DATOS A ENVIAR:", {
      ...formData,
      clienteId: Number(formData.clienteId),
      usuarioId: Number(formData.usuarioId),
      sucursalId: Number(formData.sucursalId),
      totalVenta: Number(formData.cuotaInicial), // INTENTANDO QUE LA VENTA SEA EL TOTAL DE LA CUOTA INICIAL
      cuotaInicial: Number(formData.cuotaInicial),
      cuotasTotales: Number(formData.cuotasTotales),
      montoVenta: Number(totalVentaCrédito),
      garantiaMeses: Number(formData.garantiaMeses),
      fechaInicio: formData.fechaInicio, // Enviamos la fecha de inicio correctamente
      fechaContrato: formData.fechaContrato,
    });

    try {
      const response = await axios.post(`${API_URL}/cuotas`, {
        ...formData,
        clienteId: Number(formData.clienteId),
        usuarioId: Number(userId),
        sucursalId: Number(sucursalId),
        totalVenta: Number(formData.cuotaInicial),
        montoTotalConInteres: montoTotalConInteres,
        cuotaInicial: Number(formData.cuotaInicial),
        cuotasTotales: Number(formData.cuotasTotales),
        montoVenta: Number(totalVentaCrédito),
        garantiaMeses: Number(formData.garantiaMeses),

        fechaInicio: formData.fechaInicio, // Mandamos solo la fecha (yyyy-MM-dd)
        fechaContrato: formData.fechaContrato, // Mandamos solo la fecha (yyyy-MM-dd)
      });

      if (response.status === 201) {
        toast.success("Se ha registrado correctamente el crédito.");

        // Reset form
        setFormData({
          clienteId: 0,
          usuarioId: "",
          sucursalId: sucursalId,
          totalVenta: 0,
          cuotaInicial: 0,
          cuotasTotales: 0,
          fechaInicio: "",
          estado: "ACTIVA",
          dpi: "",
          testigos: [],
          fechaContrato: "",
          montoVenta: 0,
          garantiaMeses: "",
          productos: [],
          diasEntrePagos: 0,
          interes: 0,
        });

        setCustomerSelected(null);
        setOpenCreate(false);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("Error al crear la venta a cuota:", error);
      toast.info(
        "No se pudo registrar el crédito. Verifique la disponibilidad de los productos, los datos ingresados y vuelva a intentarlo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const [customers, setCustomers] = useState<CustomersToCredit[]>([]);
  const [products, setProducts] = useState<ProductToCredit[]>([]);

  const getClientes = async () => {
    try {
      const respose = await axios.get(`${API_URL}/client/get-clients`);
      if (respose.status === 200) {
        setCustomers(respose.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir datos de clientes");
    }
  };

  const getProductos = async () => {
    try {
      const respose = await axios.get(
        `${API_URL}/products/sucursal/${sucursalId}`
      );
      if (respose.status === 200) {
        setProducts(respose.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir datos de clientes");
    }
  };

  useEffect(() => {
    getClientes();
    getProductos();
  }, []);

  const [productSelected, setProductSelected] =
    useState<ProductToCredit | null>(null);

  const [customerSelected, setCustomerSelected] =
    useState<SingleValue<OptionTypeTS> | null>(null);

  const handleChangeSelectCustomer = (option: SingleValue<OptionTypeTS>) => {
    setCustomerSelected(option);

    if (option) {
      //VERIFICAR QUE SÍ ESTE DISPONIBLE EL VALOR
      setFormData((previaData) => ({
        ...previaData,
        clienteId: option?.value,
      }));
    }
  };
  //EL VALOR DE LA SELECCIÓN, SERÁ EL QUE LE PASEMOS POR EL VALUE
  const optionsProductsFormat = products.map((prod) => ({
    value: prod.id,
    label: `${prod.nombre} (${prod.codigoProducto})`,
  }));

  const optionsCustomersFormat = customers.map((cust) => ({
    value: cust.id,
    label: `${cust.nombre} - ${cust.telefono} (${cust.dpi})`,
  }));

  //==============================================================>
  const [selectedPrice, setSelectedPrice] = useState<Precio | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const handleChangeSelectProduct = (option: OptionTypeTS) => {
    const product = products.find((prod) => prod.id === option.value);
    setProductSelected(product || null);
    setSelectedPrice(product?.precios[0] || null); // Selecciona el primer precio por defecto
    setQuantity(1); // Reinicia la cantidad
  };

  const handleChangeSelectPrice = (option: OptionTypeTS) => {
    const price = productSelected?.precios.find(
      (precio) => precio.id === option.value
    );
    setSelectedPrice(price || null);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(Number(e.target.value));
  };

  // Formatear precios para el select de precios
  const optionsPricesFormat =
    productSelected?.precios.map((price) => ({
      value: price.id,
      label: `${price.precio}`,
    })) || [];

  console.log("El producto seleccionado es: ", productSelected);

  const handleAddProduct = () => {
    if (productSelected && selectedPrice) {
      if (productSelected.id <= 0 || selectedPrice.precio <= 0) {
        toast.info("Faltan datos");
        return;
      }

      if (
        formData.productos.find(
          (prod) => prod.productoId === productSelected.id
        )
      ) {
        toast.info("Producto ya está en la lista");
        return;
      }

      // Crea un nuevo objeto de producto con los datos seleccionados
      const newProduct: Producto = {
        productoId: productSelected.id,
        cantidad: quantity,
        precioVenta: selectedPrice.precio,
      };

      // Calcula el nuevo montoVenta y totalVenta agregando el precio del producto seleccionado
      const newMontoVenta =
        formData.montoVenta + newProduct.precioVenta * quantity;
      const newTotalVenta =
        formData.totalVenta + newProduct.precioVenta * quantity;

      // Agrega el nuevo producto al array de productos en formData
      setFormData((prev) => ({
        ...prev,
        productos: [...prev.productos, newProduct],
        montoVenta: newMontoVenta,
        totalVenta: newTotalVenta,
      }));

      toast.success("Producto añadido");

      // Opcional: Limpiar el estado de la selección de producto, precio y cantidad
      setProductSelected(null);
      setSelectedPrice(null);
      setQuantity(1); // Resetea la cantidad a 1 si es necesario
    }
  };

  const handleDeleteFromData = async (id: number) => {
    // Elimina el producto de la lista de productos
    const updatedProductos = formData.productos.filter(
      (product) => product.productoId !== id
    );

    // Actualiza el estado con la nueva lista de productos
    setFormData((prev) => ({
      ...prev,
      productos: updatedProductos,
    }));

    // Recalcular el montoVenta y totalVenta después de eliminar el producto
    const newMontoVenta = updatedProductos.reduce(
      (total, product) => total + product.precioVenta * product.cantidad,
      0
    );
    const newTotalVenta = newMontoVenta; // Si quieres que totalVenta sea igual a montoVenta

    // Actualizar los valores de montoVenta y totalVenta en el estado
    setFormData((prevData) => ({
      ...prevData,
      montoVenta: newMontoVenta,
      totalVenta: newTotalVenta,
    }));

    toast.success("Producto eliminado de la lista");
  };

  console.log("El FORMDATA: ", formData);

  const totalVentaCrédito = formData.productos.reduce(
    (total, prod) => total + prod.precioVenta * prod.cantidad,
    0
  );

  const [openCreate, setOpenCreate] = useState(false);
  const [creditos, setCreditos] = useState<CreditoRegistro[]>([]);

  // Simplifica la función sin useCallback
  const getRegistCredits = async () => {
    try {
      const response = await axios.get(`${API_URL}/cuotas/get/credits`);
      setCreditos(response.data);
      console.log("Lista de créditos actualizada");
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener registros");
    }
  };

  // Ejecutar solo al montar el componente
  useEffect(() => {
    getRegistCredits();
  }, []); // <-- Array de dependencias vacío

  const calcularCuotas = () => {
    if (
      formData.totalVenta &&
      formData.cuotaInicial &&
      formData.interes &&
      formData.cuotasTotales
    ) {
      // Monto de interés sobre el total de la venta
      const montoInteres = formData.totalVenta * (formData.interes / 100);

      // Monto total con interés (precio original + interés)
      const montoTotalConInteres = formData.totalVenta + montoInteres;

      // Saldo restante después del enganche (basado en el monto total con interés)
      const saldoRestante = montoTotalConInteres - formData.cuotaInicial;

      // Pago por cuota (saldo restante dividido entre el número de cuotas)
      const pagoPorCuota = saldoRestante / formData.cuotasTotales;

      return {
        saldoRestante,
        montoInteres,
        montoTotalConInteres,
        pagoPorCuota,
      };
    }

    return {
      saldoRestante: 0,
      montoInteres: 0,
      montoTotalConInteres: 0,
      pagoPorCuota: 0,
    };
  };

  // Llamamos a la función para obtener los valores correctos
  const { saldoRestante, montoInteres, montoTotalConInteres, pagoPorCuota } =
    calcularCuotas();

  //DIFERENCIA ENTRE LA GANANCIA Y EL PRECIO DEL PRODUCTO PARA SACAR LOS PAGOS DE LAS CUOTAS

  const formatearMoneda = (cantidad: number) => {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(cantidad);
  };
  console.log("Los creditos son: ", creditos);

  return (
    <Tabs defaultValue="account" className="w-full">
      <div className="flex flex-col items-center w-full">
        <TabsList className="flex w-full max-w-5xl justify-center">
          <TabsTrigger value="account" className="flex-1 text-center">
            Registros de Créditos
          </TabsTrigger>
          <TabsTrigger value="password" className="flex-1 text-center">
            Registrar Nuevo Crédito
          </TabsTrigger>
        </TabsList>
      </div>
      {/* MOSTRAR LOS DATOS DE LOS REGISTROS DE CREDITOS */}
      <TabsContent value="account">
        <CreditRecordsTable
          userId={userId}
          sucursalId={sucursalId}
          getRegistCredits={getRegistCredits}
          records={creditos}
        />
      </TabsContent>
      {/* MOSTRAR LOS DATOS DE LOS REGISTROS DE CREDITOS */}

      <TabsContent value="password">
        <Card className="w-full max-w-5xl mx-auto shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <CreditCard className="h-6 w-6" />
              Crear Nuevo Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selección de productos */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                <div className="col-span-2">
                  <h3 className="text-center text-md font-semibold flex items-center justify-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Selección de productos
                  </h3>
                  <Separator className="my-2 border-t border-gray-300" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <Label className="mb-1 block">Producto</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <SelectM
                              className="text-black"
                              placeholder="Seleccione un producto"
                              isClearable={true}
                              value={
                                productSelected
                                  ? {
                                      value: productSelected.id,
                                      label: productSelected.nombre,
                                    }
                                  : null
                              }
                              onChange={(option) =>
                                handleChangeSelectProduct(
                                  option as OptionTypeTS
                                )
                              }
                              options={optionsProductsFormat}
                              classNames={{
                                control: (state) =>
                                  `!rounded-md !border-input !shadow-sm ${
                                    state.isFocused
                                      ? "!border-blue-500 !ring-1 !ring-blue-500"
                                      : ""
                                  }`,
                                placeholder: () => "text-muted-foreground",
                                menu: () =>
                                  "!bg-white dark:!bg-gray-800 !rounded-md !shadow-lg !border !border-input",
                                option: (state) =>
                                  `${
                                    state.isFocused
                                      ? "!bg-blue-50 dark:!bg-blue-900"
                                      : ""
                                  } ${
                                    state.isSelected
                                      ? "!bg-blue-100 dark:!bg-blue-800"
                                      : ""
                                  }`,
                              }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Seleccione el producto a vender
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Selección de precio */}
                  {productSelected && (
                    <div className="col-span-1">
                      <Label className="mb-1 block">Precio</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <SelectM
                                isClearable={true}
                                placeholder="Seleccione un precio"
                                className="text-black"
                                value={
                                  selectedPrice
                                    ? {
                                        value: selectedPrice.id,
                                        label: `${selectedPrice.precio}`,
                                      }
                                    : null
                                }
                                onChange={(option) =>
                                  handleChangeSelectPrice(
                                    option as OptionTypeTS
                                  )
                                }
                                options={optionsPricesFormat}
                                classNames={{
                                  control: (state) =>
                                    `!rounded-md !border-input !shadow-sm ${
                                      state.isFocused
                                        ? "!border-blue-500 !ring-1 !ring-blue-500"
                                        : ""
                                    }`,
                                  placeholder: () => "text-muted-foreground",
                                  menu: () =>
                                    "!bg-white dark:!bg-gray-800 !rounded-md !shadow-lg !border !border-input",
                                  option: (state) =>
                                    `${
                                      state.isFocused
                                        ? "!bg-blue-50 dark:!bg-blue-900"
                                        : ""
                                    } ${
                                      state.isSelected
                                        ? "!bg-blue-100 dark:!bg-blue-800"
                                        : ""
                                    }`,
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            Seleccione el precio del producto
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}

                  {/* Input para la cantidad */}
                  <div className="col-span-1">
                    <Label className="mb-1 block">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Botón para agregar el producto */}
                  <div className="col-span-1 flex items-end">
                    <Button
                      className="w-full"
                      variant="default"
                      type="button"
                      onClick={handleAddProduct}
                      disabled={!productSelected || !selectedPrice}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Agregar Producto
                    </Button>
                  </div>
                </div>

                {/* Productos seleccionados */}
                {formData.productos?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Productos seleccionados
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {formData.productos?.map((productForm) => {
                        const productoFind = products.find(
                          (prod) => prod.id === productForm.productoId
                        );
                        if (!productoFind) return null;

                        return (
                          <Card
                            key={productForm.productoId}
                            className="overflow-hidden border border-blue-100 dark:border-blue-900"
                          >
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                    {productoFind.nombre}
                                  </p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Cant: {productForm.cantidad}
                                    </Badge>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {formatearMoneda(productForm.precioVenta)}
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  onClick={() =>
                                    handleDeleteFromData(productForm.productoId)
                                  }
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">
                                    Eliminar producto
                                  </span>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Datos del cliente y crédito */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                <h3 className="text-center text-md font-semibold flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Datos del cliente y condiciones de crédito
                </h3>
                <Separator className="my-2 border-t border-gray-300" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="clienteId"
                      className="flex items-center gap-1"
                    >
                      <Users className="h-4 w-4" /> Cliente
                    </Label>
                    <SelectM
                      placeholder="Seleccione un cliente"
                      value={
                        customerSelected
                          ? {
                              value: customerSelected.value,
                              label: customerSelected.label,
                            }
                          : null
                      }
                      options={optionsCustomersFormat}
                      onChange={handleChangeSelectCustomer}
                      isClearable={true}
                      className="text-black"
                      classNames={{
                        control: (state) =>
                          `!rounded-md !border-input !shadow-sm ${
                            state.isFocused
                              ? "!border-blue-500 !ring-1 !ring-blue-500"
                              : ""
                          }`,
                        placeholder: () => "text-muted-foreground",
                        menu: () =>
                          "!bg-white dark:!bg-gray-800 !rounded-md !shadow-lg !border !border-input",
                        option: (state) =>
                          `${
                            state.isFocused
                              ? "!bg-blue-50 dark:!bg-blue-900"
                              : ""
                          } ${
                            state.isSelected
                              ? "!bg-blue-100 dark:!bg-blue-800"
                              : ""
                          }`,
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="fechaInicio"
                      className="flex items-center gap-1"
                    >
                      Fecha de inicio
                    </Label>
                    <input
                      type="date"
                      id="fechaInicio"
                      name="fechaInicio"
                      value={formData.fechaInicio} // Asignamos la fecha directamente del estado
                      onChange={(e) => handleChangeDate(e, "fechaInicio")} // Actualizamos la fecha
                      className="w-full py-2 px-3 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="cuotaInicial"
                      className="flex items-center gap-1"
                    >
                      <DollarSign className="h-4 w-4" /> Pago de Cuota Inicial
                      (enganche)
                    </Label>
                    <Input
                      id="cuotaInicial"
                      name="cuotaInicial"
                      type="number"
                      step="1"
                      required
                      value={formData.cuotaInicial}
                      onChange={handleInputChange}
                      className="focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="cuotasTotales"
                      className="flex items-center gap-1"
                    >
                      <ClipboardList className="h-4 w-4" /> Número de Cuotas
                      Totales
                    </Label>
                    <Input
                      type="number"
                      id="cuotasTotales"
                      name="cuotasTotales"
                      value={formData.cuotasTotales}
                      onChange={(e) =>
                        handleInputChange(
                          e as React.ChangeEvent<HTMLInputElement>
                        )
                      }
                      className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ingrese el número de cuotas"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="garantiaMeses"
                      className="flex items-center gap-1"
                    >
                      <Calendar className="h-4 w-4" /> Garantía (meses)
                    </Label>
                    <Input
                      id="garantiaMeses"
                      name="garantiaMeses"
                      type="number"
                      required
                      step="1"
                      value={formData.garantiaMeses}
                      onChange={handleInputChange}
                      className="focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="diasEntrePagos"
                      className="flex items-center gap-1"
                    >
                      <Calendar className="h-4 w-4" /> Días entre pagos
                      (intervalo)
                    </Label>
                    <Select
                      name="diasEntrePagos"
                      value={formData.diasEntrePagos.toString()}
                      onValueChange={(value) => {
                        const event = {
                          target: {
                            name: "diasEntrePagos",
                            value: value,
                          },
                        };
                        handleInputChange(
                          event as React.ChangeEvent<HTMLInputElement>
                        );
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione intervalo" />
                      </SelectTrigger>
                      <SelectContent>
                        {[7, 15, 30, 45, 60].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} días
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="interes"
                      className="flex items-center gap-1"
                    >
                      <Percent className="h-4 w-4" /> Porcentaje de interés
                    </Label>
                    <div className="flex gap-2 justify-center items-center">
                      <Input
                        id="interes"
                        name="interes"
                        type="number"
                        required
                        step="1"
                        value={formData.interes}
                        onChange={handleInputChange}
                        className="focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-lg font-medium">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="totalVenta"
                      className="flex items-center gap-1"
                    >
                      <DollarSign className="h-4 w-4" /> Total de la Venta
                    </Label>
                    <Input
                      id="totalVenta"
                      name="totalVenta"
                      type="number"
                      step="1"
                      required
                      value={totalVentaCrédito}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 rounded-lg p-4">
                <h3 className="mb-3 text-xl font-medium text-center">
                  Resumen del Crédito
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                      <DollarSign className="text-green-600 dark:text-green-400 h-5 w-5" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">
                        Saldo Restante a Pagar
                      </label>
                      <p className="text-lg font-semibold">
                        {formatearMoneda(saldoRestante)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                      <Percent className="text-blue-600 dark:text-blue-400 h-5 w-5" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">
                        Monto de Interés
                      </label>
                      <p className="text-lg font-semibold">
                        {formatearMoneda(montoInteres)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center gap-3">
                    <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-full">
                      <BarChart className="text-orange-600 dark:text-orange-400 h-5 w-5" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">
                        Monto Total con Interés
                      </label>
                      <p className="text-lg font-semibold">
                        {formatearMoneda(montoTotalConInteres)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                      <Calendar className="text-purple-600 dark:text-purple-400 h-5 w-5" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">
                        Pago por cada Cuota
                      </label>
                      <p className="text-lg font-semibold">
                        {typeof pagoPorCuota === "number" &&
                        !isNaN(pagoPorCuota) &&
                        isFinite(pagoPorCuota)
                          ? formatearMoneda(pagoPorCuota)
                          : "Calculando..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testigos */}
              <Accordion
                type="single"
                collapsible
                className="w-full border rounded-lg overflow-hidden"
              >
                <AccordionItem value="item-1" className="border-0">
                  <AccordionTrigger className="px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Añadir Testigos ({formData.testigos.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3">
                    <div className="space-y-4">
                      <Label className="mr-5 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Testigos
                      </Label>
                      {formData.testigos.map((testigo, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 md:grid-cols-4 gap-3"
                        >
                          <Input
                            placeholder="Nombre"
                            value={testigo.nombre}
                            onChange={(e) =>
                              handleTestigoChange(
                                index,
                                "nombre",
                                e.target.value
                              )
                            }
                            className="col-span-1 focus:ring-1 focus:ring-blue-500"
                          />
                          <Input
                            placeholder="Dirección"
                            value={testigo.direccion}
                            onChange={(e) =>
                              handleTestigoChange(
                                index,
                                "direccion",
                                e.target.value
                              )
                            }
                            className="col-span-1 md:col-span-2 focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="col-span-1 flex gap-2">
                            <Input
                              placeholder="Teléfono"
                              value={testigo.telefono}
                              onChange={(e) =>
                                handleTestigoChange(
                                  index,
                                  "telefono",
                                  e.target.value
                                )
                              }
                              className="flex-1 focus:ring-1 focus:ring-blue-500"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeTestigo(index)}
                              className="flex-shrink-0"
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Eliminar testigo</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={addTestigo}
                        variant="outline"
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Agregar Testigo
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Confirmación del registro */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setOpenCreate(true)}
                  type="button"
                  className="px-6 py-6 text-lg font-medium"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Iniciar Registro
                </Button>
              </div>

              <Dialog onOpenChange={setOpenCreate} open={openCreate}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl">
                      Confirmación de Registro
                    </DialogTitle>
                    <DialogDescription className="text-center">
                      ¿Estás seguro de que deseas proceder con la creación de
                      este registro de crédito con los datos actuales?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setOpenCreate(false)}
                      className="w-full"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <SendHorizonal className="mr-2 h-4 w-4" />
                          Confirmar
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
