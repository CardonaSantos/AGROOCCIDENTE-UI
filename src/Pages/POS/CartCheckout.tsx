"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  ShoppingCart,
  ShoppingBag,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import SelectM from "react-select";
import { TipoComprobante } from "./interfaces";

enum RolPrecio {
  PUBLICO = "PUBLICO",
  MAYORISTA = "MAYORISTA",
  ESPECIAL = "ESPECIAL",
  DISTRIBUIDOR = "DISTRIBUIDOR",
  PROMOCION = "PROMOCION",
  CLIENTE_ESPECIAL = "CLIENTE_ESPECIAL",
}

interface Precios {
  id: number;
  precio: number;
  rol: RolPrecio;
}

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

interface Customer {
  id: number;
  nombre: string;
  telefono?: string;
  dpi?: string;
}

interface CustomerOption {
  value: number;
  label: string;
}

interface CartCheckoutProps {
  cart: CartItem[];
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  imei: string;
  setImei: (imei: string) => void;
  selectedCustomerID: Customer | null;
  setSelectedCustomerID: (customer: Customer | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  nombre: string;
  setNombre: (nombre: string) => void;
  telefono: string;
  setTelefono: (telefono: string) => void;
  dpi: string;
  setDpi: (dpi: string) => void;
  direccion: string;
  setDireccion: (direccion: string) => void;
  observaciones: string;
  setObservaciones: (observaciones: string) => void;
  customerOptions: CustomerOption[];
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onUpdatePrice: (
    productId: number,
    newPrice: number,
    newRole: RolPrecio
  ) => void;
  onRemoveFromCart: (productId: number) => void;
  onCompleteSale: () => void;
  formatCurrency: (amount: number) => string;
  //PARA METODO DE PAGO Y OTROS
  tipoComprobante: TipoComprobante | null;
  setTipoComprobante: React.Dispatch<
    React.SetStateAction<TipoComprobante | null>
  >;

  setReferenciaPago: React.Dispatch<React.SetStateAction<string>>;
  referenciaPago: string;

  setApellidos: React.Dispatch<React.SetStateAction<string>>;
  apellidos: string;
}

export default function CartCheckout({
  apellidos,
  setApellidos,
  cart,
  paymentMethod,
  setPaymentMethod,
  imei,
  setImei,
  selectedCustomerID,
  setSelectedCustomerID,
  activeTab,
  setActiveTab,
  nombre,
  setNombre,
  telefono,
  setTelefono,
  dpi,
  setDpi,
  direccion,
  setDireccion,
  observaciones,
  setObservaciones,
  customerOptions,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveFromCart,
  onCompleteSale,
  formatCurrency,
  referenciaPago,
  setReferenciaPago,
}: CartCheckoutProps) {
  const calculateTotal = (): number => {
    return cart.reduce(
      (total, item) => total + item.selectedPrice * item.quantity,
      0
    );
  };

  const handleChange = (selectedOption: CustomerOption | null) => {
    const selectedCustomer = selectedOption
      ? customerOptions.find((opt) => opt.value === selectedOption.value)
      : null;

    if (selectedCustomer) {
      setSelectedCustomerID({
        id: selectedCustomer.value,
        nombre: selectedCustomer.label.split(" (")[0], // Extract name from label
      });
    } else {
      setSelectedCustomerID(null);
    }
  };

  // Función para verificar si hay información de nuevo cliente
  const hasNewCustomerData = () => {
    return (
      nombre.trim() !== "" ||
      telefono.trim() !== "" ||
      dpi.trim() !== "" ||
      direccion.trim() !== "" ||
      observaciones.trim() !== ""
    );
  };

  // Función para verificar si hay cliente seleccionado
  const hasSelectedCustomer = () => {
    return selectedCustomerID !== null;
  };

  // Función para limpiar datos del nuevo cliente
  const clearNewCustomerData = () => {
    setNombre("");
    setTelefono("");
    setDpi("");
    setDireccion("");
    setObservaciones("");
  };

  // Función para limpiar cliente seleccionado
  const clearSelectedCustomer = () => {
    setSelectedCustomerID(null);
  };

  const handleTabChange = (value: string) => {
    if (value === "existing" && hasNewCustomerData()) {
      // Si cambia a "existing" y hay datos de nuevo cliente, limpiar los datos
      clearNewCustomerData();
    } else if (value === "new" && hasSelectedCustomer()) {
      // Si cambia a "new" y hay cliente seleccionado, limpiar la selección
      clearSelectedCustomer();
    }
    setActiveTab(value);
  };

  return (
    <div className="space-y-3">
      {/* Carrito */}
      <Card className="border-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-background">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">Carrito</span>
            {cart.length > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {cart.reduce((acc, item) => acc + item.quantity, 0)} items
              </span>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={
                  imei.length >= 15
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : ""
                }
              >
                {imei.length >= 15 ? "IMEI AÑADIDO" : "AÑADIR IMEI"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="center">
              <div className="grid gap-2">
                <p className="text-xs text-muted-foreground">
                  Puedes ingresar varios IMEIs separados por comas.
                </p>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="imei-input" className="col-span-1 text-xs">
                    IMEI
                  </Label>
                  <Input
                    id="imei-input"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    placeholder="Ej. 123456789012345"
                    className="col-span-3 h-8"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="border-t">
          {/* Encabezados de tabla */}
          <div className="grid grid-cols-4 px-4 py-2 text-sm text-muted-foreground border-b">
            <div className="col-span-1">Producto</div>
            <div className="col-span-1 text-center">Cant.</div>
            <div className="col-span-1 text-center">Precio</div>
            <div className="col-span-1 text-center">Total</div>
          </div>
          {/* Productos en el carrito */}
          <div className="overflow-y-auto max-h-[calc(100vh-450px)]">
            {cart.length > 0 ? (
              <div className="divide-y">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-4 px-4 py-2 items-center"
                  >
                    <div className="col-span-1 text-sm pr-2">
                      <div className="line-clamp-1">{item.nombre}</div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = Number.parseInt(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            onUpdateQuantity(item.id, val);
                          }
                        }}
                        min="1"
                        max={item.stock.reduce(
                          (total, stock) => total + stock.cantidad,
                          0
                        )}
                        className="h-7 w-14 text-center"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Select
                        value={item.selectedPriceId.toString()}
                        onValueChange={(newPriceId) => {
                          const selectedPrice = item.precios.find(
                            (price) => price.id === Number.parseInt(newPriceId)
                          );
                          if (selectedPrice) {
                            onUpdatePrice(
                              item.id,
                              selectedPrice.precio,
                              selectedPrice.rol
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 w-28">
                          <SelectValue
                            placeholder={formatCurrency(item.selectedPrice)}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {item.precios
                            .filter((prec) => prec.precio > 0)
                            .map((precio) => (
                              <SelectItem
                                key={precio.id}
                                value={precio.id.toString()}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{formatCurrency(precio.precio)}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {precio.rol.toLowerCase()}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {formatCurrency(item.selectedPrice * item.quantity)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-100/20"
                        onClick={() => onRemoveFromCart(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
                <span>No hay productos en el carrito</span>
                <ShoppingBag className="h-6 w-6" />
              </div>
            )}
          </div>
          {/* Total y botón completar */}
          <div className="px-4 py-2 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Total: {formatCurrency(calculateTotal())}
              </span>
              <span className="text-xs text-muted-foreground">
                Productos:{" "}
                {cart.reduce((acc, total) => acc + total.quantity, 0)}
              </span>
            </div>
            <Button
              className="w-full h-10 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={cart.length <= 0}
              onClick={onCompleteSale}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Completar venta
            </Button>
          </div>
        </div>
      </Card>

      {/* Método de Pago & Cliente */}
      <Card className="border-0 ">
        <div className="p-4">
          {/* Usando flexbox para dividir en dos columnas */}
          <div className="flex flex-row gap-4">
            {/* Columna izquierda: Método de Pago */}
            <div className="flex-1">
              <Label className="text-xs font-medium block mb-1.5">
                Método de Pago
              </Label>
              <Select
                disabled={!!referenciaPago}
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger className="w-full h-8 min-h-0 py-1 px-2 text-xs">
                  <SelectValue placeholder="Método de Pago" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem className="text-xs" value="CONTADO">
                    Contado
                  </SelectItem>
                  <SelectItem className="text-xs" value="TARJETA">
                    Tarjeta
                  </SelectItem>
                  <SelectItem className="text-xs" value="TRANSFERENCIA">
                    Transferencia Bancaria
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Columna derecha: Selección de Cliente */}
            <div className="flex-1">
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger
                    value="existing"
                    disabled={hasNewCustomerData()} // Deshabilitar si hay datos de nuevo cliente
                    className="flex items-center justify-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <User className="h-3.5 w-3.5" />
                    Cliente Existente
                  </TabsTrigger>
                  <TabsTrigger
                    value="new"
                    disabled={hasSelectedCustomer()} // Deshabilitar si hay cliente seleccionado
                    className="flex items-center justify-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Nuevo Cliente
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="existing" className="mt-2">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Seleccionar Cliente</Label>
                      <SelectM
                        className="bg-transparent w-full text-xs text-black px-2 py-1"
                        options={customerOptions}
                        onChange={handleChange}
                        placeholder="Buscar cliente..."
                        isClearable
                        value={
                          selectedCustomerID
                            ? {
                                value: selectedCustomerID.id,
                                label: selectedCustomerID.nombre,
                              }
                            : null
                        }
                      />
                    </div>
                    {selectedCustomerID && (
                      <div className="text-xs font-semibold text-green-600 bg-green-50 p-2 rounded">
                        Cliente seleccionado: {selectedCustomerID.nombre}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="new" className="mt-2">
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="nombre" className="text-xs">
                          Nombre
                        </Label>
                        <Input
                          id="nombre"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          placeholder="Nombre"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div>
                        <Label htmlFor="apellidos" className="text-xs">
                          Apellidos
                        </Label>
                        <Input
                          id="apellidos"
                          value={apellidos}
                          onChange={(e) => setApellidos(e.target.value)}
                          placeholder="Apellidos"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div>
                        <Label htmlFor="telefono" className="text-xs">
                          Teléfono
                        </Label>
                        <Input
                          id="telefono"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          placeholder="+502 5060 7080"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="dpi" className="text-xs">
                          DPI
                        </Label>
                        <Input
                          id="dpi"
                          value={dpi}
                          onChange={(e) => setDpi(e.target.value)}
                          placeholder="Número de DPI (opcional)"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor="direccion" className="text-xs">
                          Dirección
                        </Label>
                        <Input
                          id="direccion"
                          value={direccion}
                          onChange={(e) => setDireccion(e.target.value)}
                          placeholder="Dirección (opcional)"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="observaciones" className="text-xs">
                        Observaciones
                      </Label>
                      <Textarea
                        id="observaciones"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Observaciones (opcional)"
                        className="text-xs h-16"
                      />
                    </div>
                    {hasNewCustomerData() && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        Creando nuevo cliente...
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {paymentMethod === "TRANSFERENCIA" && (
            <div>
              <Label className="text-xs" htmlFor="referenciaPago">
                Núm. boleta / transferencia único
              </Label>
              <Input
                className="h-6 my-1"
                id="referenciaPago"
                value={referenciaPago}
                onChange={(e) => setReferenciaPago(e.target.value)}
                placeholder="457278567843"
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
