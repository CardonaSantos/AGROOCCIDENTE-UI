"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Coins, Package, Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { toast } from "sonner";
import type { ProductosResponse } from "@/Types/Venta/ProductosResponse";
import { useStore } from "@/components/Context/ContextSucursal";
import SelectM from "react-select";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatearMoneda } from "@/Crm/CrmServices/crm-service.types";
// Importar los nuevos componentes
import ProductList from "./ProductList";
import CartCheckout from "./CartCheckout";
import DialogImages from "../DialogImages";
import { TipoComprobante } from "./interfaces";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { ComprobanteSelector } from "./Components/ComprobanteSelector";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";

dayjs.extend(localizedFormat);
dayjs.locale("es");

function formatearFechaUTC(fecha: string) {
  return dayjs(fecha).format("DD/MM/YYYY hh:mm A");
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("GTQ", "Q");
};

const API_URL = import.meta.env.VITE_API_URL;

//========================================>
type Stock = {
  id: number;
  cantidad: number;
  fechaIngreso: string;
  fechaVencimiento: string;
};

type Precios = {
  id: number;
  precio: number;
  rol: RolPrecio;
};

enum RolPrecio {
  PUBLICO = "PUBLICO",
  MAYORISTA = "MAYORISTA",
  ESPECIAL = "ESPECIAL",
  DISTRIBUIDOR = "DISTRIBUIDOR",
  PROMOCION = "PROMOCION",
  CLIENTE_ESPECIAL = "CLIENTE_ESPECIAL",
}

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta?: number;
  codigoProducto: string;
  creadoEn: string;
  actualizadoEn: string;
  stock: Stock[];
  precios: Precios[];
};

interface CartItem {
  id: number;
  nombre: string;
  quantity: number;
  selectedPriceId: number;
  selectedPrice: number;
  selectedPriceRole: RolPrecio; // Nuevo campo para el rol del precio seleccionado
  precios: Precios[];
  stock: { cantidad: number }[];
}

type Client = {
  id: number;
  nombre: string;
  apellidos: string;

  telefono: string;
  dpi: string;
  iPInternet: string;
  direccion: string;
  actualizadoEn: Date;
};

interface Venta {
  id: number;
  clienteId: number | null;
  fechaVenta: string;
  horaVenta: string;
  totalVenta: number;
  direccionClienteFinal: string | null;
  nombreClienteFinal: string | null;
  sucursalId: number;
  telefonoClienteFinal: string | null;
  imei: string;
}

interface Customer {
  id: number;
  nombre: string;
  telefono?: string;
  dpi?: string;
}

export default function PuntoVenta() {
  const userId = useStore((state) => state.userId) ?? 0;
  const [cart, setCart] = useState<CartItem[]>([]);
  const sucursalId = useStore((state) => state.sucursalId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productos, setProductos] = useState<ProductosResponse[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("CONTADO");

  const [tipoComprobante, setTipoComprobante] =
    useState<TipoComprobante | null>(TipoComprobante.RECIBO);

  const [referenciaPago, setReferenciaPago] = useState<string>("");

  const [openSection, setOpenSection] = useState(false);
  const [ventaResponse, setventaResponse] = useState<Venta | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [precioReques, setPrecioRequest] = useState<number | null>(null);
  const [openReques, setOpenRequest] = useState(false);
  const [openImage, setOpenImage] = useState(false);
  const [imagesProduct, setImagesProduct] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isDisableButton, setIsDisableButton] = useState(false);
  const [selectedCustomerID, setSelectedCustomerID] = useState<Customer | null>(
    null
  );

  //CLIENTE
  const [activeTab, setActiveTab] = useState("existing");
  const [nombre, setNombre] = useState<string>("");
  const [apellidos, setApellidos] = useState<string>("");

  const [dpi, setDpi] = useState<string>("");
  const [imei, setImei] = useState<string>("");
  const [telefono, setTelefono] = useState<string>("");
  const [direccion, setDireccion] = useState<string>("");
  const [observaciones, setObservaciones] = useState<string>("");

  console.log("Los productos son: ", productos);

  const getCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/client/get-all-customers`);
      if (response.status === 200) {
        setClients(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir clientes previos");
    }
  };

  useEffect(() => {
    getCustomers();
  }, []);

  useEffect(() => {
    if (sucursalId) {
      getProducts();
    }
  }, [sucursalId]);

  const addToCart = (product: Producto) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const initialPriceId = product.precios[0]?.id;
      const initialPrice = product.precios[0]?.precio || 0;
      const newCartItem: CartItem = {
        ...product,
        quantity: 1,
        selectedPriceId: initialPriceId,
        selectedPrice: initialPrice,
        selectedPriceRole: RolPrecio.PUBLICO, // Valor por defecto, ajusta según lógica de negocio
      };
      setCart([...cart, newCartItem]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleClose = () => {
    setOpenSection(false);
  };

  const handleCompleteSale = async () => {
    setIsDisableButton(true);
    const saleData = {
      usuarioId: userId,
      sucursalId: sucursalId,
      clienteId: selectedCustomerID?.id,
      productos: cart.map((prod) => ({
        productoId: prod.id,
        cantidad: prod.quantity,
        selectedPriceId: prod.selectedPriceId,
      })),
      metodoPago: paymentMethod || "CONTADO",
      tipoComprobante: tipoComprobante,
      referenciaPago: referenciaPago,
      monto: cart.reduce(
        (acc, prod) => acc + prod.selectedPrice * prod.quantity,
        0
      ),
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),

      telefono: telefono.trim(),
      direccion: direccion.trim(),
      dpi: dpi.trim(),
      observaciones: observaciones.trim(),
      imei: imei.trim(),
    };

    const isCustomerInfoProvided =
      saleData.nombre && saleData.telefono && saleData.direccion;

    if (
      saleData.monto > 1000 &&
      !saleData.clienteId &&
      !isCustomerInfoProvided
    ) {
      toast.warning(
        "Para ventas mayores a 1000 es necesario ingresar o seleccionar un cliente"
      );
      setIsDisableButton(false);
      return;
    }

    if (!tipoComprobante) {
      toast.info("Seleccione Recibo o Factura");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/venta`, saleData);
      if (response.status === 201) {
        toast.success("Venta completada con éxito");
        setReferenciaPago("");
        setPaymentMethod("CONTADO");
        setTipoComprobante(TipoComprobante.RECIBO);
        setIsDialogOpen(false);
        setCart([]);
        getProducts();
        setImei("");
        setventaResponse(response.data);
        setSelectedCustomerID(null);
        setNombre("");
        setApellidos("");
        setTelefono("");
        setDireccion("");
        setDpi("");
        setObservaciones("");
        setTimeout(() => {
          setOpenSection(true);
        }, 1000);
        setTimeout(() => {
          setIsDisableButton(false);
        }, 1000);

        getCustomers();
      }
    } catch (error) {
      toast.error(getApiErrorMessageAxios(error));
      setIsDisableButton(false);
    }
  };

  const getProducts = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/products/sucursal/${sucursalId}`
      );
      if (response.status === 200) {
        setProductos(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al obtener productos.");
    }
  };

  // Función actualizada para manejar cambio de precio y rol
  const updatePrice = (
    productId: number,
    newPrice: number,
    newRole: RolPrecio
  ) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              selectedPrice: newPrice,
              selectedPriceRole: newRole,
              selectedPriceId:
                item.precios.find(
                  (price) => price.precio === newPrice && price.rol === newRole
                )?.id || item.selectedPriceId,
            }
          : item
      )
    );
  };

  async function handleMakeRequest() {
    if (precioReques && precioReques <= 0) {
      toast.info("La cantidad a solicitar no debe ser negativa");
      return;
    }
    if (!selectedProductId) {
      toast.info("Debe seleccionar un producto primero");
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/price-request`, {
        productoId: Number(selectedProductId),
        precioSolicitado: precioReques,
        solicitadoPorId: userId,
      });
      if (response.status === 201) {
        toast.success(
          "Solicitud enviada, esperando respuesta del administrador..."
        );
        setPrecioRequest(null);
        setSelectedProductId("");
      }
    } catch (error) {
      console.log(error);
      toast.error("Algo salió mal");
    }
  }

  const customerOptions = clients.map((customer) => ({
    value: customer.id,
    label: `${customer.nombre} ${customer?.apellidos ?? ""} ${
      customer.telefono ? `(${customer.telefono})` : ""
    } ${customer.dpi ? `DPI: ${customer.dpi}` : ""}
    ${customer.iPInternet ? `IP: ${customer.iPInternet}` : ""}
    `,
  }));

  const handleImageClick = (images: string[]) => {
    setOpenImage(true);
    setImagesProduct(images);
  };

  // 1) Mejora el nombre para que refleje “referencia inválida”
  const isReferenceInvalid =
    paymentMethod === "TRANSFERENCIA" && !referenciaPago;

  // 2) Combina con OR
  const isButtonDisabled = isDisableButton || isReferenceInvalid;

  return (
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Componente de Lista de Productos */}
        <ProductList
          productos={productos}
          onAddToCart={addToCart}
          onImageClick={handleImageClick}
        />

        {/* Componente de Carrito y Checkout */}
        <CartCheckout
          apellidos={apellidos}
          setApellidos={setApellidos}
          cart={cart}
          setReferenciaPago={setReferenciaPago}
          referenciaPago={referenciaPago}
          tipoComprobante={tipoComprobante}
          setTipoComprobante={setTipoComprobante}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          imei={imei}
          setImei={setImei}
          selectedCustomerID={selectedCustomerID}
          setSelectedCustomerID={setSelectedCustomerID}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          nombre={nombre}
          setNombre={setNombre}
          telefono={telefono}
          setTelefono={setTelefono}
          dpi={dpi}
          setDpi={setDpi}
          direccion={direccion}
          setDireccion={setDireccion}
          observaciones={observaciones}
          setObservaciones={setObservaciones}
          customerOptions={customerOptions}
          onUpdateQuantity={updateQuantity}
          onUpdatePrice={updatePrice}
          onRemoveFromCart={removeFromCart}
          onCompleteSale={() => setIsDialogOpen(true)}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* PETICION DE PRECIO ESPECIAL */}
      <div className="mt-10">
        <Card className="shadow-md rounded-lg border overflow-hidden">
          <CardHeader className=" p-6">
            <CardTitle className="text-xl font-semibold">
              Petición de precio especial
            </CardTitle>
            <CardDescription className="text-sm text-gray-600  dark:text-white">
              Al solicitar un precio especial, esa instancia sólo se podrá usar
              en una venta.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Producto */}
              <div className="flex flex-col">
                <Label className="text-sm font-medium mb-1">Producto</Label>
                <SelectM
                  placeholder="Seleccionar producto"
                  options={productos.map((p) => ({
                    value: p.id.toString(),
                    label: `${p.nombre} (${p.codigoProducto})`,
                  }))}
                  className="basic-select text-sm h-10 text-black"
                  classNamePrefix="select"
                  onChange={(opt) => setSelectedProductId(opt?.value ?? "")}
                  value={
                    selectedProductId
                      ? {
                          value: selectedProductId,
                          label: `${
                            productos.find(
                              (p) => p.id.toString() === selectedProductId
                            )?.nombre
                          } (${
                            productos.find(
                              (p) => p.id.toString() === selectedProductId
                            )?.codigoProducto
                          })`,
                        }
                      : null
                  }
                />
              </div>

              {/* Precio Requerido */}
              <div className="flex flex-col">
                <Label className="text-sm font-medium mb-1">
                  Precio Requerido
                </Label>
                <Input
                  type="number"
                  className="h-10 text-sm"
                  placeholder="100.00"
                  value={precioReques ?? ""}
                  onChange={(e) =>
                    setPrecioRequest(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
              </div>
            </div>

            {/* Botón */}
            <Button
              onClick={() => setOpenRequest(true)}
              variant="default"
              className="w-full py-2 text-sm"
            >
              Solicitar precio especial
            </Button>

            {/* Modal de confirmación */}
            <Dialog open={openReques} onOpenChange={setOpenRequest}>
              <DialogContent className="w-full max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-center">
                    Solicitar precio especial
                  </DialogTitle>
                  <DialogDescription className="text-sm text-center text-gray-600">
                    Esta instancia sólo se podrá aplicar a una venta.
                    ¿Continuar?
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleMakeRequest}
                    disabled={!precioReques || !selectedProductId}
                    className="px-4 py-2 text-sm"
                  >
                    Confirmar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* DIALOG DE IMAGENES */}
      <DialogImages
        images={imagesProduct}
        openImage={openImage}
        setOpenImage={setOpenImage}
      />

      {/* DIALOG DE VENTA EXITOSA */}
      <Dialog open={openSection} onOpenChange={setOpenSection}>
        <DialogContent className="max-w-md mx-auto p-0 overflow-hidden">
          {/* Header with close button */}
          <div className="relative p-6 pb-4">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-center text-gray-900 mb-2 dark:text-white">
              Venta Registrada
            </h2>
            <p className="dark:text-white text-center text-gray-600 text-sm">
              La venta se ha procesado exitosamente
            </p>
          </div>

          {/* Sale Details */}
          {ventaResponse && (
            <div className="dark:bg-zinc-950 px-6 py-4 dark:bg-g bg-gray-50 border-y">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600  dark:text-white ">
                    Número de Venta:
                  </span>
                  <span className="font-semibold text-gray-900  dark:text-white ">
                    #{ventaResponse.id}
                  </span>
                </div>

                <div className="flex justify-between items-center ">
                  <span className="text-sm text-gray-600  dark:text-white ">
                    Fecha y Hora:
                  </span>
                  <span className="font-semibold text-gray-900 text-sm  dark:text-white ">
                    {formatearFechaUTC(ventaResponse.fechaVenta)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-base font-medium text-gray-900 dark:text-white ">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {formattMonedaGT(ventaResponse.totalVenta)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-6 pt-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent dark:text-white dark:hover:bg-transparent "
                onClick={handleClose}
              >
                Mantenerse
              </Button>

              <Link
                to={`/venta/generar-factura/${ventaResponse?.id}`}
                className="flex-1"
              >
                <Button
                  className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-medium"
                  onClick={handleClose}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Imprimir Comprobante
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONFIRMACION VENTA */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {/* Header compacto */}
          <div className="bg-purple-50 dark:bg-zinc-900 p-4">
            <DialogHeader className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-full animate-pulse">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <DialogTitle className="text-base font-bold text-gray-800 dark:text-gray-100 text-center">
                Confirmar Venta
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-4 space-y-4 bg-purple-50 dark:bg-zinc-900">
            {/* Resumen compacto */}
            <div className="bg-purple-50 dark:bg-zinc-950 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                <Package className="h-3 w-3" />
                Resumen de productos
              </div>

              <div className="space-y-1 max-h-20 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="text-gray-600 dark:text-gray-400 truncate">
                      {productos.find((prod) => prod.id === item.id)?.nombre} ×{" "}
                      {item.quantity}
                    </span>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      {formatearMoneda(item.selectedPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="dark:bg-gray-700" />

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                    Total
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatearMoneda(
                      cart.reduce(
                        (acc, item: CartItem) =>
                          acc + item.selectedPrice * item.quantity,
                        0
                      )
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-gray-200 dark:bg-gray-700"
                  >
                    {cart.length} {cart.length === 1 ? "artículo" : "artículos"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className=" justify-center items-center flex">
              <ComprobanteSelector
                tipo={tipoComprobante}
                setTipo={setTipoComprobante}
              />
            </div>

            {/* Referencia de pago si existe */}
            {referenciaPago && (
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Referencia de Pago
                </div>
                <div className="text-sm font-mono text-blue-800 dark:text-blue-200">
                  {referenciaPago}
                </div>
              </div>
            )}

            {isReferenceInvalid && (
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  El número de boleta no puede estar vacío
                </div>
              </div>
            )}

            {/* Botones compactos */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => setIsDialogOpen(false)}
                variant="destructive"
                size="sm"
                className="flex-1 h-8 text-sm"
                disabled={isDisableButton}
              >
                Cancelar
              </Button>
              <Button
                disabled={isButtonDisabled}
                size="sm"
                onClick={handleCompleteSale}
                className="flex-1 h-8 text-sm bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
              >
                {isDisableButton ? (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Procesando...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Confirmar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
