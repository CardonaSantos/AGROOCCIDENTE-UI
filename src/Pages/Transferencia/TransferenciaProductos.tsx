import { useEffect, useState } from "react";
import { Box, Building2, Layers2 } from "lucide-react";
import SelectComponent, { SingleValue } from "react-select";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/components/Context/ContextSucursal";
import axios from "axios";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { PageHeader } from "@/utils/components/PageHeaderPos";
const API_URL = import.meta.env.VITE_API_URL;

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  codigoProducto: string;
  stock: Array<{ sucursalId: number; cantidad: number }>;
}

interface Sucursal {
  id: number;
  nombre: string;
}

interface TransferenciaData {
  productoId: number;
  cantidad: number;
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  // usuarioEncargadoId: number | null;
  usuarioSolicitanteId: number | null;
}

export default function TransferenciaProductos() {
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [selectedSucursalDestino, setSelectedSucursalDestino] =
    useState<Sucursal | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);

  const [openDialog, setOpenDialog] = useState(false);
  const encargadoId = useStore((state) => state.userId);

  const [truncar, setTruncar] = useState(false);

  const handleSubmit = async () => {
    try {
      // Evita múltiples envíos
      if (truncar) return;

      setTruncar(true);

      // Verifica si hay un producto y sucursal destino seleccionados
      if (!selectedProduct || !selectedSucursalDestino) {
        toast.error("Por favor selecciona un producto y una sucursal destino");
        setTruncar(false); // Restablece el estado en caso de fallo
        return;
      }

      // Busca la sucursal de origen que tenga stock disponible
      const sucursalOrigen = selectedProduct.stock.find((s) => s.cantidad > 0);
      if (!sucursalOrigen) {
        toast.error("No hay stock disponible en la sucursal de origen");
        setTruncar(false); // Restablece el estado en caso de fallo
        return;
      }

      // Prepara los datos de transferencia
      const transferenciaData: TransferenciaData = {
        productoId: selectedProduct.id,
        cantidad,
        sucursalOrigenId: sucursalOrigen.sucursalId,
        sucursalDestinoId: selectedSucursalDestino.id,
        usuarioSolicitanteId: encargadoId, // ID de usuario fijo para este ejemplo
      };
      const response = await axios.post(
        `${API_URL}/solicitud-transferencia-producto`,
        transferenciaData
      );

      if (response.status === 201) {
        toast.success(
          "Solicitud de transferencia enviada. Esperando respuesta del administrador."
        );
        getProductos(); // Actualiza los productos después de la transferencia

        console.log("Datos de transferencia:", transferenciaData);

        // Restablece los estados
        setOpenDialog(false);
        setSelectedProduct(null);
        setSelectedSucursalDestino(null);
        setCantidad(1);
      } else {
        throw new Error("Error en la transferencia");
      }
    } catch (error) {
      console.error("Error al transferir el producto:", error);
      toast.error(
        "Error al solicitar transferencia. Por favor, intenta de nuevo."
      );
    } finally {
      // Restablece el estado de truncar independientemente de si hubo éxito o error
      setTruncar(false);
    }
  };

  const sucursalId = useStore((state) => state.sucursalId);
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]); // Array vacío por defecto

  const getProductos = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/products/products/to-transfer/${sucursalId}`
      );
      if (response.status === 200) {
        setProductos(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir productos");
    }
  };
  //
  useEffect(() => {
    const getProductos = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/products/products/to-transfer/${sucursalId}`
        );
        if (response.status === 200) {
          setProductos(response.data);
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al conseguir productos");
      }
    };
    if (sucursalId) {
      getProductos();
    }
  }, [sucursalId]);

  useEffect(() => {
    const getSucursales = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/sucursales/sucursales-to-transfer`
        );
        if (response.status === 200) {
          setSucursales(response.data);
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al conseguir productos");
      }
    };
    getSucursales();
  }, []);
  console.log("Las sucursales son: ", sucursales);
  console.log("Los productos son: ", productos);
  console.log("EL id seleccionado es: ", selectedProduct);

  // Opciones para productos
  const productosOptions = productos?.map((producto) => ({
    value: producto.id,
    label: `${producto.nombre} (${producto.codigoProducto})`,
    stock: producto.stock, // Incluimos stock para su uso posterior
  }));

  // Opciones para sucursales
  const sucursalesOptions = sucursales
    ?.filter((sucursal) => sucursal.id !== sucursalId) // Excluir sucursal origen
    .map((sucursal) => ({
      value: sucursal.id,
      label: sucursal.nombre,
    }));

  const handleProductChange = (
    option: SingleValue<{ value: number; label: string }>
  ) => {
    if (option) {
      const productoSeleccionado = productos?.find(
        (prod) => prod.id === option.value
      );
      setSelectedProduct(productoSeleccionado || null);
    } else {
      setSelectedProduct(null); // Limpia la selección si `option` es null
    }
  };

  const handleSucursalChange = (
    option: SingleValue<{ value: number; label: string }>
  ) => {
    if (option) {
      const sucursalSeleccionada = sucursales.find(
        (suc) => suc.id === option.value
      );
      setSelectedSucursalDestino(sucursalSeleccionada || null);
    } else {
      setSelectedSucursalDestino(null); // Limpia la selección si `option` es null
    }
  };

  return (
    <div className="container mx-auto px-4">
      <PageHeader
        title="Transferencia de Stocks"
        subtitle="Tranfiera sus stocks entre sus sucursales"
        sticky={false}
        fallbackBackTo="/"
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="producto-select">Seleccionar Producto</Label>
          <SelectComponent
            className="text-black"
            isClearable={true}
            id="producto-select"
            options={productosOptions}
            value={
              selectedProduct
                ? { value: selectedProduct.id, label: selectedProduct.nombre }
                : null
            }
            onChange={handleProductChange}
            placeholder="Buscar producto..."
            classNamePrefix="react-select"
          />
        </div>

        <Card className="">
          <CardHeader className="  p-4 rounded-t-md">
            <CardDescription className="text-md text-center">
              La cantidad a transferir no debe ser mayor a la disponible
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {selectedProduct ? (
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  Total en Stocks:{" "}
                  {selectedProduct.stock.reduce(
                    (total, stock) => total + stock.cantidad,
                    0
                  )}
                </h2>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <h2 className="text-xl font-semibold">
                  Seleccione un producto para ver la cantidad disponible
                </h2>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="cantidad">Cantidad a transferir</Label>
          <Input
            id="cantidad"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            min={1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sucursal-select">Seleccionar Sucursal</Label>
          <SelectComponent
            className="text-black"
            isClearable={true}
            id="sucursal-select"
            options={sucursalesOptions}
            value={
              selectedSucursalDestino
                ? {
                    value: selectedSucursalDestino.id,
                    label: selectedSucursalDestino.nombre,
                  }
                : null
            }
            onChange={handleSucursalChange}
            placeholder="Buscar sucursal..."
            classNamePrefix="react-select"
          />
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button
              className="w-full"
              disabled={
                !selectedProduct || !selectedSucursalDestino || cantidad < 1
              }
            >
              Enviar solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-center">
                Solicitar Transferencia
              </DialogTitle>
              <DialogDescription className="text-center">
                ¿Estás seguro de querer transferir este producto?
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-6">
              {/* Producto */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label htmlFor="producto" className="text-right">
                    Producto
                  </Label>
                  <Box />
                </div>
                <div id="producto" className="text-right">
                  {selectedProduct?.nombre}
                </div>
              </div>

              {/* Cantidad */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label htmlFor="cantidad" className="text-right">
                    Cantidad
                  </Label>
                  <Layers2 />
                </div>
                <div id="cantidad" className="text-right">
                  {cantidad}
                </div>
              </div>

              {/* Destino */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label htmlFor="destino" className="text-right">
                    Destino
                  </Label>
                  <Building2 width={20} />
                </div>
                <div id="destino" className="text-right">
                  {selectedSucursalDestino?.nombre}
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-center">
              <Button
                className="w-full"
                disabled={truncar}
                onClick={handleSubmit}
              >
                Si, confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
