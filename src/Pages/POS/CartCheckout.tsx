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
import { MetodoPagoMainPOS } from "./interfaces/methodPayment";
import { useMemo } from "react";
import { format } from "date-fns";

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
  uid: string; // 👈 NUEVO
  id: number;
  nombre: string;
  quantity: number;
  selectedPriceId: number;
  selectedPrice: number;
  selectedPriceRole: RolPrecio;
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
  isCreditoVenta: boolean;
  cart: CartItem[];
  paymentMethod: string;
  setPaymentMethod: React.Dispatch<React.SetStateAction<MetodoPagoMainPOS>>;
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
  //NUEVOS
  onUpdateQuantity: (uid: string, newQuantity: number) => void; // 👈
  onUpdatePrice: (uid: string, newPrice: number, newRole: RolPrecio) => void; // 👈
  onRemoveFromCart: (uid: string) => void;
  userRol: string;
  setNit: React.Dispatch<React.SetStateAction<string>>;
  nit: string;

  setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  date: Date | undefined;
}

export default function CartCheckout({
  isCreditoVenta,
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
  userRol,
  nit,
  setNit,
  date,
  setDate,
}: CartCheckoutProps) {
  const calculateTotal = (): number => {
    return cart.reduce(
      (total, item) => total + item.selectedPrice * item.quantity,
      0,
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

  const truncateButton: boolean = cart.length <= 0 || isCreditoVenta;
  const processedCart = useMemo(() => {
    return cart.map((item) => {
      const preciosVisibles =
        userRol === "VENDEDOR"
          ? item.precios.filter(
              (p) =>
                p.rol !== RolPrecio.DISTRIBUIDOR &&
                p.rol !== RolPrecio.PROMOCION &&
                p.precio > 0,
            )
          : item.precios.filter((p) => p.precio > 0);

      return { ...item, preciosVisibles };
    });
  }, [cart, userRol]);
  console.log("El rol legando es: ", userRol);

  return (
    <div className="space-y-3 min-w-[360px] max-w-[440px]">
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

          <div
            className="
    grid px-4 py-2 text-sm text-muted-foreground border-b
    grid-cols-[minmax(0,1fr)_72px_100px_96px]  /* nombre | cant | precio | total */
  "
          >
            <div className="col-span-1">Producto</div>
            <div className="text-center">Cant.</div>
            <div className="text-center">Precio</div>
            <div className="text-center">Total</div>
          </div>
          {/* Productos en el carrito */}
          <div className="overflow-y-auto max-h-[calc(100vh-430px)]">
            {processedCart.length > 0 ? (
              <div className="divide-y">
                {processedCart.map((item) => {
                  return (
                    <div
                      key={item.uid}
                      className="
            grid items-center gap-x-2 px-4 py-2
            grid-cols-[minmax(0,1fr)_72px_100px_96px]
          "
                    >
                      <div className="text-sm pr-2 min-w-0">
                        <div className="truncate">{item.nombre}</div>
                      </div>

                      <div className="flex justify-center">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Number.parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              onUpdateQuantity(item.uid, val); // 👈 antes: item.id
                            }
                          }}
                          min="1"
                          max={item.stock.reduce((t, s) => t + s.cantidad, 0)}
                          className="h-7 w-[72px] text-center"
                        />
                      </div>

                      <div className="flex justify-center">
                        <Select
                          value={item.selectedPriceId.toString()}
                          onValueChange={(newPriceId) => {
                            const p = item.precios.find(
                              (x) => x.id === Number(newPriceId),
                            );
                            if (p) onUpdatePrice(item.uid, p.precio, p.rol);
                          }}
                        >
                          <SelectTrigger className="h-7 w-[100px] justify-between">
                            <SelectValue
                              placeholder={formatCurrency(item.selectedPrice)}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {item.preciosVisibles
                              .filter((prec) => prec.precio > 0)
                              .map((precio) => (
                                <SelectItem
                                  key={precio.id}
                                  value={precio.id.toString()}
                                >
                                  <div className="flex w-full items-center justify-between">
                                    <span className="tabular-nums">
                                      {formatCurrency(precio.precio)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground ml-2">
                                      {precio.rol.toLowerCase()}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium tabular-nums">
                          {formatCurrency(item.selectedPrice * item.quantity)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-100/20 shrink-0"
                          onClick={() => onRemoveFromCart(item.uid)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
              disabled={truncateButton}
              onClick={onCompleteSale}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Completar venta
            </Button>
          </div>
        </div>
      </Card>

      {/* Método de Pago & Cliente */}
      <Card className="border-0 shadow-none">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-5">
            {/* --- COLUMNA IZQUIERDA: Datos de la Venta (Fecha y Pago) --- */}
            <div className="flex-1 flex flex-col gap-4">
              {/* 1. Selector de Fecha */}
              <div>
                <Label className="text-xs font-medium block mb-1.5">
                  Fecha de Emisión
                </Label>

                <Input
                  type="datetime-local"
                  className="w-full h-8 text-xs px-2 block bg-background"
                  value={date ? format(date, "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDate(val ? new Date(val) : undefined);
                  }}
                />
              </div>

              {/* 2. Método de Pago */}
              <div>
                <Label className="text-xs font-medium block mb-1.5">
                  Método de Pago
                </Label>
                <Select
                  disabled={!!referenciaPago}
                  value={paymentMethod}
                  onValueChange={(e: MetodoPagoMainPOS) => setPaymentMethod(e)}
                >
                  <SelectTrigger className="w-full h-8 min-h-0 py-1 px-2 text-xs">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem
                      className="text-xs"
                      value={MetodoPagoMainPOS.EFECTIVO}
                    >
                      Contado
                    </SelectItem>
                    <SelectItem
                      className="text-xs"
                      value={MetodoPagoMainPOS.TARJETA}
                    >
                      Tarjeta
                    </SelectItem>
                    <SelectItem
                      className="text-xs"
                      value={MetodoPagoMainPOS.TRANSFERENCIA}
                    >
                      Transferencia Bancaria
                    </SelectItem>
                    <SelectItem
                      className="text-xs"
                      value={MetodoPagoMainPOS.CREDITO}
                    >
                      Crédito
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Referencia (Movido aquí para mantener contexto financiero) */}
              {paymentMethod === "TRANSFERENCIA" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label
                    className="text-xs font-medium block mb-1.5"
                    htmlFor="referenciaPago"
                  >
                    No. Boleta / Referencia
                  </Label>
                  <Input
                    className="h-8 text-xs"
                    id="referenciaPago"
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                    placeholder="Ej: 4572785..."
                  />
                </div>
              )}
            </div>

            {/* --- COLUMNA DERECHA: Datos del Cliente (Intacto) --- */}
            <div className="flex-1 border-l pl-0 md:pl-5 border-dashed border-border/60">
              <Label className="text-xs font-medium block mb-1.5 text-muted-foreground/80">
                Datos del Cliente
              </Label>

              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full h-8 mb-2">
                  <TabsTrigger
                    value="existing"
                    disabled={hasNewCustomerData()}
                    className="flex items-center justify-center gap-1 text-[10px] h-full"
                  >
                    <User className="h-3 w-3" />
                    Existente
                  </TabsTrigger>
                  <TabsTrigger
                    value="new"
                    disabled={hasSelectedCustomer()}
                    className="flex items-center justify-center gap-1 text-[10px] h-full"
                  >
                    <UserPlus className="h-3 w-3" />
                    Nuevo
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="mt-0">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <SelectM
                        className="text-xs"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "32px",
                            fontSize: "12px",
                          }),
                          input: (base) => ({ ...base, margin: 0, padding: 0 }),
                        }}
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
                      <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        {selectedCustomerID.nombre}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="new" className="mt-0">
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          placeholder="Nombre"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Input
                          value={apellidos}
                          onChange={(e) => setApellidos(e.target.value)}
                          placeholder="Apellidos"
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={dpi}
                        onChange={(e) => setDpi(e.target.value)}
                        placeholder="DPI"
                        className="h-7 text-xs"
                      />
                      <Input
                        value={nit}
                        onChange={(e) => setNit(e.target.value)}
                        placeholder="NIT"
                        className="h-7 text-xs"
                      />
                    </div>
                    <Input
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Teléfono"
                      className="h-7 text-xs"
                    />
                    <Textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Observaciones..."
                      className="text-xs h-14 min-h-0 resize-none"
                    />
                    {hasNewCustomerData() && (
                      <div className="text-[10px] text-center text-blue-600 bg-blue-50 py-1 rounded border border-blue-100">
                        Creando nuevo cliente
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
