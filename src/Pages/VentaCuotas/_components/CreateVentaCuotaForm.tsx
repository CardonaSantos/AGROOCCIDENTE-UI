// /Creditos/CreateVentaCuotaForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  DollarSign,
  Save,
  SendHorizonal,
  Users,
  Percent,
  BarChart,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SelectM, { SingleValue } from "react-select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStore } from "@/components/Context/ContextSucursal";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

import { CreditRecordsTable } from "../CreditosRegistros";
import {
  useCreateCreditoMutation,
  useCreditRecordsQuery,
  useCustomersQuery,
} from "@/hooks/genericoCall/creditApi";
import CreditProducts from "./CreditProducts";
import CreditCart from "./CreditCart";
import { ReusableSelect } from "@/utils/components/ReactSelectComponent/ReusableSelect";
import { PageHeader } from "@/utils/components/PageHeaderPos";
import { useApiQuery } from "@/hooks/genericoCall/genericoCallHook";
import { CuentasBancariasSelect } from "@/Types/CuentasBancarias/CuentasBancariasSelect";

/* ======================
   Tipos auxiliares
====================== */
export type PrecioApi = { id: number; precio: string; rol: string };
export type PresentacionApi = {
  id: number;
  nombre: string;
  sku?: string | null;
  codigoBarras?: string | null;
  tipoPresentacion: string;
  precios: PrecioApi[];
  stockPresentaciones: { id: number; cantidad?: number | null }[];
};
export type ProductoApi = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  codigoProducto: string;
  precios: PrecioApi[];
  stock: { id: number; cantidad?: number | null }[];
  imagenesProducto?: { id: number; url: string }[];
  presentaciones: PresentacionApi[];
};

export type CustomerOption = { value: number; label: string };

export type CartLine =
  | {
      tipo: "PRODUCTO";
      productoId: number;
      nombre: string;
      precioId: number | null;
      precioUnit: number;
      cantidad: number;
    }
  | {
      tipo: "PRESENTACION";
      productoId: number;
      presentacionId: number;
      nombre: string; // product + " — " + presentacion
      precioId: number | null;
      precioUnit: number;
      cantidad: number;
    };

export enum MetodoPago {
  EFECTIVO = "EFECTIVO",
  TRANSFERENCIA = "TRANSFERENCIA",
  TARJETA = "TARJETA",
  CHEQUE = "CHEQUE",
}

const OptionsMetodoPago = [
  "EFECTIVO",
  "TRANSFERENCIA",
  "TARJETA",
  "CHEQUE",
] as const;

const OptionsMetodoPagoToBanco: MetodoPago[] = [
  MetodoPago.TRANSFERENCIA,
  MetodoPago.TARJETA,
  MetodoPago.CHEQUE,
];

/* ======================
   Página
====================== */
export default function CreateVentaCuotaForm() {
  const sucursalId = useStore((s) => s.sucursalId) ?? 0;
  const userId = useStore((s) => s.userId) ?? 0;
  // Tabs: Registros / Nuevo Crédito
  const [tab, setTab] = useState<"account" | "password">("password");
  // ==== Estado del formulario de crédito (sin testigos) ====
  const [cliente, setCliente] = useState<SingleValue<CustomerOption>>(null);
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaContrato, setFechaContrato] = useState<string>("");
  const [cuotaInicial, setCuotaInicial] = useState<number>(0);
  const [cuotasTotales, setCuotasTotales] = useState<number>(0);
  const [garantiaMeses, setGarantiaMeses] = useState<number>(0);
  const [diasEntrePagos, setDiasEntrePagos] = useState<number>(30);
  const [interes, setInteres] = useState<number>(0); // ← 0 permitido
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  // ==== Carrito de líneas ====
  const [cart, setCart] = useState<CartLine[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // ==== Búsqueda / datos remotos ====
  const [q, setQ] = useState("");
  const { customers, customersLoading } = useCustomersQuery();
  const { records, refetchRecords } = useCreditRecordsQuery();

  // ==== Derivados ====
  const totalProductos = useMemo(
    () => cart.reduce((s, l) => s + l.cantidad * l.precioUnit, 0),
    [cart]
  );
  const [cuentaBancaria, setCuentaBancaria] = useState<string>("");

  // Permitir interés 0
  const montoInteres = useMemo(
    () => totalProductos * (interes / 100),
    [totalProductos, interes]
  );
  const montoTotalConInteres = useMemo(
    () => totalProductos + montoInteres,
    [totalProductos, montoInteres]
  );
  const saldoRestante = useMemo(
    () => Math.max(0, montoTotalConInteres - (cuotaInicial || 0)),
    [montoTotalConInteres, cuotaInicial]
  );
  const pagoPorCuota = useMemo(() => {
    if (!cuotasTotales || cuotasTotales <= 0) return 0;
    return saldoRestante / cuotasTotales;
  }, [saldoRestante, cuotasTotales]);

  const formatearMoneda = (n: number) =>
    new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(n);

  // ==== Hooks de creación ====
  const { createCredito, isCreating } = useCreateCreditoMutation({
    onSuccess: () => {
      toast.success("Se ha registrado correctamente el crédito.");
      // reset del formulario
      setCliente(null);
      setFechaInicio("");
      setFechaContrato("");
      setCuotaInicial(0);
      setCuotasTotales(0);
      setGarantiaMeses(0);
      setDiasEntrePagos(30);
      setInteres(0);
      setCart([]);
      setConfirmOpen(false);
      refetchRecords();
    },
    onError: () => {
      toast.error(
        "No se pudo registrar el crédito. Verifique datos y disponibilidad de productos."
      );
    },
  });

  const {
    data: cuentas = [],
    // isError,
    // error: errorCuentasBancarias,
  } = useApiQuery<CuentasBancariasSelect[]>(
    ["cuentas-bancarias-select"],
    "/cuentas-bancarias/get-simple-select",
    undefined, // o {}
    {
      initialData: [],
      refetchOnMount: "always",
    }
  );

  // ==== Helpers carrito ====
  const upsertProductLine = (payload: {
    producto: ProductoApi;
    precioId: number | null;
    precio: number;
    cantidad: number;
  }) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (l) => l.tipo === "PRODUCTO" && l.productoId === payload.producto.id
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          cantidad: copy[idx].cantidad + payload.cantidad,
          precioUnit: payload.precio, // permite override al último precio elegido
          precioId: payload.precioId,
        } as CartLine;
        return copy;
      }
      return [
        ...prev,
        {
          tipo: "PRODUCTO",
          productoId: payload.producto.id,
          nombre: payload.producto.nombre,
          cantidad: payload.cantidad,
          precioUnit: payload.precio,
          precioId: payload.precioId,
        },
      ];
    });
    toast.info("Producto añadido");
  };

  const upsertPresentationLine = (payload: {
    producto: ProductoApi;
    presentacion: PresentacionApi;
    precioId: number | null;
    precio: number;
    cantidad: number;
  }) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (l) =>
          l.tipo === "PRESENTACION" &&
          l.productoId === payload.producto.id &&
          l.presentacionId === payload.presentacion.id
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          cantidad: copy[idx].cantidad + payload.cantidad,
          precioUnit: payload.precio,
          precioId: payload.precioId,
        } as CartLine;
        return copy;
      }
      return [
        ...prev,
        {
          tipo: "PRESENTACION",
          productoId: payload.producto.id,
          presentacionId: payload.presentacion.id,
          nombre: `${payload.producto.nombre} — ${payload.presentacion.nombre}`,
          cantidad: payload.cantidad,
          precioUnit: payload.precio,
          precioId: payload.precioId,
        },
      ];
    });
    toast.info("Presentación añadido");
  };

  const setQty = (index: number, qty: number) =>
    setCart((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        cantidad: Math.max(1, qty | 0),
      } as CartLine;
      return copy;
    });

  const setPrice = (index: number, price: number, priceId: number | null) =>
    setCart((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        precioUnit: price,
        precioId: priceId,
      } as CartLine;
      return copy;
    });

  const removeItem = (productID: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productoId === productID
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
    toast.info("Producto eliminado de la lista");
  };

  // ==== Validación y submit ====
  const validar = () => {
    if (!cliente) return "Debe seleccionar un cliente.";
    if (cart.length === 0)
      return "Debe agregar al menos un producto/presentación.";
    if (!fechaInicio) return "Debe seleccionar la fecha de inicio.";
    if (!fechaContrato) return "Debe seleccionar la fecha del contrato.";
    if (cuotaInicial < 0) return "La cuota inicial no puede ser negativa.";
    if (cuotasTotales <= 0) return "Ingrese el número de cuotas totales.";
    if (diasEntrePagos <= 0) return "Seleccione los días entre pagos.";
    // interes puede ser 0
    if (totalProductos <= 0) return "El total de productos debe ser mayor a 0.";
    return null;
  };

  const handleConfirm = () => {
    const err = validar();
    if (err) {
      toast.info(err);
      return;
    }
    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      clienteId: Number(cliente!.value),
      usuarioId: Number(userId),
      sucursalId: Number(sucursalId),
      // Se envía el total de la cuota inicial como totalVenta, como tenías:
      totalVenta: Number(cuotaInicial),
      montoTotalConInteres,
      cuotaInicial: Number(cuotaInicial),
      cuotasTotales: Number(cuotasTotales),
      montoVenta: Number(totalProductos),
      garantiaMeses: Number(garantiaMeses),
      fechaInicio,
      fechaContrato,
      diasEntrePagos: Number(diasEntrePagos),
      interes: Number(interes),
      metodoPago: metodoPago,
      cuentaBancariaId:
        cuentaBancaria.length > 0 ? parseInt(cuentaBancaria) : null,
      // líneas: soporta producto o presentación
      productos: cart.map((l) =>
        l.tipo === "PRODUCTO"
          ? {
              productoId: l.productoId,
              cantidad: l.cantidad,
              precioVenta: l.precioUnit,
              tipo: l.tipo,
            }
          : {
              productoId: l.productoId,
              presentacionId: (l as any).presentacionId,
              cantidad: l.cantidad,
              precioVenta: l.precioUnit,
              tipo: l.tipo,
            }
      ),
    };
    console.log("El payload es: ", payload);

    await createCredito(payload);
  };
  console.log("El cart es: ", cart);

  // ==== Opciones clientes ====
  const customerOptions: CustomerOption[] =
    (customers ?? []).map((c) => ({
      value: c.id,
      label: `${c.nombre} - ${c.telefono} (${c.dpi})`,
    })) || [];

  const inCartByProduct = useMemo(() => {
    const m = new Map<number, number>();
    for (const l of cart) {
      if (l.tipo === "PRODUCTO") {
        m.set(l.productoId, (m.get(l.productoId) ?? 0) + l.cantidad);
      }
    }
    return m;
  }, [cart]);

  const inCartByPresentacion = useMemo(() => {
    const m = new Map<number, number>();
    for (const l of cart) {
      if (l.tipo === "PRESENTACION") {
        const pid: number = l.presentacionId;
        if (pid != null) {
          m.set(pid, (m.get(pid) ?? 0) + l.cantidad);
        }
      }
    }
    return m;
  }, [cart]);

  const getInCartQtyProduct = (productId: number) =>
    inCartByProduct.get(productId) ?? 0;

  const getInCartQtyPresentation = (presentacionId: number) =>
    inCartByPresentacion.get(presentacionId) ?? 0;

  const isInMetodoPago = OptionsMetodoPagoToBanco.includes(metodoPago);

  useEffect(() => {
    if (!isInMetodoPago) {
      setCuentaBancaria("");
    }
  }, [isInMetodoPago]);
  console.log("metodo pago: ", metodoPago, "cuenta bancaria: ", cuentaBancaria);

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as any)}
      className="w-full"
    >
      <PageHeader
        title="Creditos"
        subtitle="Cree y administre sus creditos"
        fallbackBackTo="/"
        sticky={false}
      />
      <div className="flex flex-col items-center w-full">
        <TabsList className="flex w-full  justify-center">
          <TabsTrigger value="account" className="flex-1 text-center">
            Registros de Créditos
          </TabsTrigger>
          <TabsTrigger value="password" className="flex-1 text-center">
            Registrar Nuevo Crédito
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Registros */}
      <TabsContent value="account">
        <CreditRecordsTable
          userId={userId}
          sucursalId={sucursalId}
          getRegistCredits={async () => {
            await refetchRecords();
          }}
          records={records ?? []}
          //   loading={recordsLoading}
        />
      </TabsContent>

      {/* Nuevo crédito: layout tipo POS */}
      <TabsContent value="password">
        <Card className="w-full  mx-auto ">
          <CardHeader className="">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <CreditCard className="h-6 w-6" />
              Venta a Crédito (POS)
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 md:p-6">
            {/* GRID: listado izquierda / carrito derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Col izquierda: productos y búsqueda */}
              <div className="lg:col-span-2 space-y-3">
                {/* Buscador server-side (por nombre/código) */}
                <div className="flex gap-2">
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por nombre o código…"
                    className="w-full"
                    aria-label="Buscar productos"
                  />
                </div>

                {/* Listado POS (usa tus hooks internos) */}
                <CreditProducts
                  sucursalId={sucursalId}
                  q={q}
                  onAddProduct={upsertProductLine}
                  onAddPresentation={upsertPresentationLine}
                  // 👇 nuevos getters para conocer lo ya agregado
                  getInCartQtyProduct={getInCartQtyProduct}
                  getInCartQtyPresentation={getInCartQtyPresentation}
                />
              </div>

              {/* Col derecha: carrito y condiciones */}
              <div className="lg:col-span-1 space-y-4">
                {/* Carrito */}
                <CreditCart
                  cart={cart}
                  setQty={setQty}
                  setPrice={setPrice}
                  removeItem={removeItem}
                />

                {/* Datos del cliente y condiciones */}
                <div className="rounded-lg border p-3 space-y-3">
                  <h3 className="text-md font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Cliente y condiciones
                  </h3>
                  <Separator />

                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <SelectM
                      isClearable
                      placeholder="Seleccione cliente"
                      value={
                        cliente
                          ? { value: cliente.value, label: cliente.label }
                          : null
                      }
                      options={customerOptions}
                      onChange={setCliente}
                      className="text-black"
                      isLoading={customersLoading}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Fecha de inicio</Label>
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full h-9 px-3 rounded-md border bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fecha de contrato</Label>
                      <input
                        type="date"
                        value={fechaContrato}
                        onChange={(e) => setFechaContrato(e.target.value)}
                        className="w-full h-9 px-3 rounded-md border bg-background text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" /> Enganche
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        value={cuotaInicial}
                        onChange={(e) =>
                          setCuotaInicial(Number(e.target.value))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="flex items-center gap-1">
                        <ClipboardList className="h-4 w-4" /> Cuotas totales
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        step="1"
                        value={cuotasTotales}
                        onChange={(e) =>
                          setCuotasTotales(Number(e.target.value))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Días entre pagos
                      </Label>
                      <Select
                        value={String(diasEntrePagos)}
                        onValueChange={(v) => setDiasEntrePagos(Number(v))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione intervalo" />
                        </SelectTrigger>
                        <SelectContent>
                          {[7, 15, 30, 45, 60].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} días
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Garantía (meses)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        value={garantiaMeses}
                        onChange={(e) =>
                          setGarantiaMeses(Number(e.target.value))
                        }
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <Label className="flex items-center gap-1">
                        <Percent className="h-4 w-4" /> Interés (%)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={interes}
                          onChange={(e) => setInteres(Number(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground">
                          (0 permitido)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <Label className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" /> Método de pago
                      </Label>
                      <div className="flex items-center gap-2">
                        <ReusableSelect
                          items={[...OptionsMetodoPago]}
                          getValue={(m) => m} // cómo se obtiene el value
                          getLabel={(m) => m} // cómo se muestra el label
                          value={metodoPago}
                          onChange={(m) => setMetodoPago(m as MetodoPago)} // devuelve MetodoPago | null
                          placeholder="Método de pago"
                        />
                      </div>
                    </div>

                    {isInMetodoPago ? (
                      <div className="space-y-2">
                        <Label
                          htmlFor="cBancaria"
                          className="flex items-center gap-1"
                        >
                          <CreditCard className="h-4 w-4" /> Cuenta bancaria
                        </Label>
                        <div className="">
                          <Select
                            onValueChange={setCuentaBancaria}
                            value={cuentaBancaria}
                          >
                            <SelectTrigger id="cBancaria" className="w-full">
                              <SelectValue placeholder="Selecciona una cuenta bancaria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>
                                  CUENTAS BANCARIAS DISPONIBLES
                                </SelectLabel>
                                {Array.isArray(cuentas) ? (
                                  cuentas.map((c) => {
                                    // algo...
                                    return (
                                      <SelectItem value={c.id.toString()}>
                                        {c.nombre}
                                      </SelectItem>
                                    );
                                  })
                                ) : (
                                  <SelectItem value="apple">
                                    Cargando cuentas....
                                  </SelectItem>
                                )}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Resumen */}
                <div className="rounded-lg border p-3 space-y-2">
                  <h3 className="text-md font-semibold">Resumen</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Total productos:</span>
                    </div>
                    <div className="text-right font-medium">
                      {formatearMoneda(totalProductos)}
                    </div>

                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      <span>Interés:</span>
                    </div>
                    <div className="text-right font-medium">
                      {formatearMoneda(montoInteres)}
                    </div>

                    <div className="flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      <span>Total con interés:</span>
                    </div>
                    <div className="text-right font-medium">
                      {formatearMoneda(montoTotalConInteres)}
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Pago por cuota:</span>
                    </div>
                    <div className="text-right font-medium">
                      {formatearMoneda(
                        isFinite(pagoPorCuota) ? pagoPorCuota : 0
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="w-1/2"
                    onClick={() => {
                      setCart([]);
                      setCuotaInicial(0);
                      setCuotasTotales(0);
                      setInteres(0);
                    }}
                  >
                    Limpiar
                  </Button>
                  <Button
                    className="w-1/2"
                    onClick={handleConfirm}
                    disabled={isCreating}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Iniciar Registro
                  </Button>
                </div>
              </div>
            </div>

            {/* Dialog de confirmación */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center text-xl">
                    Confirmación de Registro
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    ¿Deseas crear este crédito con los datos actuales?
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmOpen(false)}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <SendHorizonal className="mr-2 h-4 w-4 animate-pulse" />
                        Procesando…
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
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
