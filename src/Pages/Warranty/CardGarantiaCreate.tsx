import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SelectComponent from "react-select";
import {
  ProductoVenta,
  ProductoVentaToTable,
  VentaHistorialItem,
  VentasHistorial,
} from "./interfaces2.interfaces";
import {
  GarantiaFormData,
  OptionType,
  ProveedoresResponse,
} from "./interfaces.interfaces";
import dayjs from "dayjs";
import { formatearFecha } from "./utils";
import {
  Building,
  CalendarIcon,
  CreditCardIcon,
  PackageIcon,
  ReceiptTextIcon,
  ScanTextIcon,
  UserIcon,
} from "lucide-react";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { Checkbox } from "@/components/ui/checkbox";
import DialogProductSelected from "./Dialog/DialogProductSelected";
import { getStatusClass, ReplaceUnderlines } from "@/utils/UtilsII";

interface ProductSelected {
  id: number;
  cantidad: number;
}
interface PropsCreate {
  optionsVenta: {
    label: string;
    value: number;
  }[];
  ventaSelected: VentaHistorialItem | null;
  setVentaSelected: React.Dispatch<
    React.SetStateAction<VentaHistorialItem | null>
  >;
  //para proveedores
  setSelecProviderID: React.Dispatch<React.SetStateAction<OptionType | null>>;
  selecProviderID: OptionType | null;
  //para seleccionar el producto que vamos a enviar al servidor
  setProductoSelected: React.Dispatch<
    React.SetStateAction<ProductoVenta | null>
  >;
  productoSelected: ProductoVenta | null;
  ventas: VentasHistorial;
  //onchange
  handleChangeSelectVenta: (opt: OptionType | null) => void;
  //proveedores
  providerOptionSelect: OptionType[];
  handleChangeProvider: (selectedOption: OptionType | null) => void;

  setProductSelected: React.Dispatch<
    React.SetStateAction<ProductoVenta | null>
  >;

  productSelected: ProductSelected | null;
  setOpenSelectedProduct: React.Dispatch<React.SetStateAction<boolean>>;
  openSelectedProduct: boolean;
  //nuevos
  selectedProduct: ProductoVentaToTable | null;
  setSelectedProduct: React.Dispatch<
    React.SetStateAction<ProductoVentaToTable | null>
  >;
  openProductDialog: boolean;
  setOpenProductDialog: React.Dispatch<React.SetStateAction<boolean>>;
  //
  setFormData: React.Dispatch<React.SetStateAction<GarantiaFormData>>;
  formData: GarantiaFormData;
  providers: ProveedoresResponse[];

  handleSubmitRegistGarantia: () => Promise<void>;
  isSubmittingGarantia: boolean;
  setIsSubmittingGarantia: React.Dispatch<React.SetStateAction<boolean>>;
}

function CardGarantiaCreate({
  optionsVenta,
  ventaSelected,
  handleChangeSelectVenta,
  ventas,
  //nuevos
  selectedProduct,
  setSelectedProduct,
  openProductDialog,
  setOpenProductDialog,
  //formdata
  formData,
  setFormData,
  //proveredores
  providerOptionSelect,
  providers,
  handleSubmitRegistGarantia,
  isSubmittingGarantia,
  setIsSubmittingGarantia,
}: PropsCreate) {
  const calculateTotal = (products: ProductoVenta[]) => {
    return products
      .reduce((sum, prod) => sum + prod.cantidad * prod.precioVenta, 0)
      .toFixed(2);
  };

  console.log("Las ventas son: ", ventas);
  const handleSelectProduct = (
    prod: ProductoVenta,
    clienteID: number | null,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedProduct(prod);
      setFormData((prev) => ({
        ...prev,
        clienteId: clienteID,
        cantidad: prod.cantidad,
        proveedorId: null,
        comentario: "",
        descripcionProblema: "",
        productoId: prod.producto.id,
        ventaId: ventaSelected?.id ?? 0,
        ventaProductoID: prod.id,
      }));
      setOpenProductDialog(true);
    } else {
      setSelectedProduct(null);
      setOpenProductDialog(false);
    }
  };

  console.log("La venta seleccionada es: ", ventaSelected);

  return (
    <Card className="w-full  mx-auto shadow-lg dark:text-gray-50">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <CardTitle className="text-lg font-bold text-center">
          Detalles de Venta
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Visualiza la información completa de una venta seleccionada.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="mb-4">
          <label htmlFor="select-venta" className="sr-only">
            Seleccionar Venta
          </label>
          <SelectComponent
            id="select-venta"
            classNamePrefix="react-select" // Add a prefix for custom styling if needed
            className="text-sm font-semibold react-select-container text-black"
            options={optionsVenta}
            onChange={handleChangeSelectVenta}
            isClearable
            value={
              ventaSelected
                ? {
                    value: ventaSelected.id,
                    label: `Venta No. #${ventaSelected.id} | Cliente: ${ventaSelected.cliente.nombre} | Productos: ${ventaSelected.productos.length}`,
                  }
                : null
            }
          />
        </div>

        {ventaSelected ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-primary dark:text-white" />
                  Información del Cliente
                </h3>
                <p>
                  <span className="font-medium">ID:</span>{" "}
                  {ventaSelected.cliente.id ? ventaSelected.cliente.id : "N/A"}
                </p>
                <p>
                  <span className="font-medium">Nombre:</span>{" "}
                  {ventaSelected.cliente.nombre}
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="font-semibold lg flex items-center gap-2">
                  <ReceiptTextIcon className="w-4 h-4 text-primary dark:text-white" />
                  Detalles de Venta
                </h2>
                <p>
                  <span className="font-medium">ID Venta:</span>{" "}
                  {ventaSelected.id}
                </p>
                <p>
                  <span className="font-medium">IMEI:</span>{" "}
                  {ventaSelected.imei ? ventaSelected.imei : "No aplicado"}
                </p>
                <p>
                  <span className="font-medium">Método de Pago:</span>{" "}
                  <span className="flex items-center gap-1">
                    <CreditCardIcon className="w-3 h-3" />
                    {ventaSelected.metodoPago ?? "No aplicado"}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Referencia de Pago:</span>{" "}
                  <p className="font-semibold">
                    {ventaSelected.referenciaPago ?? "No aplicado"}
                  </p>
                </p>
                <p>
                  <span className="font-medium">Tipo de Comprobante:</span>{" "}
                  <span className="flex items-center gap-1">
                    <ScanTextIcon className="w-3 h-3" />
                    {ventaSelected.tipoComprobante ?? "No aplicado"}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary dark:text-white" />
                  Información de Sucursal
                </h3>
                <p>
                  <span className="font-medium">Nombre:</span>{" "}
                  {ventaSelected.sucursal.nombre}
                </p>
                <p>
                  <span className="font-medium">Dirección:</span>{" "}
                  {ventaSelected.sucursal.direccion}
                </p>
              </div>
            </div>

            <div className="mt-8 overflow-x-auto">
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                <PackageIcon className="w-4 h-4 text-primary dark:text-white" />
                Productos en la Venta
              </h3>
              <Table className="min-w-full table-fixed">
                <TableCaption>
                  Una lista de los productos incluidos en esta venta. Seleccione
                  un producto a mandar a garantía
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">Sel.</TableHead>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-1/4">Producto</TableHead>
                    <TableHead className="w-1/6">Código</TableHead>
                    <TableHead className="w-1/6 text-center">
                      Cantidad
                    </TableHead>
                    <TableHead className="w-1/6 text-right">
                      Precio Venta
                    </TableHead>
                    <TableHead className="w-1/4 text-right">
                      Descripción
                    </TableHead>

                    <TableHead className="w-1/6 text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventaSelected.productos.map((prod) => {
                    const isSelected = selectedProduct?.id === prod.id;

                    return (
                      <TableRow
                        key={prod.id}
                        className={isSelected ? "cursor-pointer" : ""}
                        onClick={() => {
                          if (isSelected) {
                            setOpenProductDialog(true);
                          }
                        }}
                      >
                        <TableHead className="w-[80px]">
                          <Checkbox
                            checked={isSelected}
                            // Al hacer click en el checkbox detenemos la burbuja
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={(checked) =>
                              handleSelectProduct(
                                prod,
                                ventaSelected.cliente.id,
                                checked as boolean
                              )
                            }
                            id={`select-prod-${prod.id}`}
                          />
                        </TableHead>
                        <TableCell className="font-medium">{prod.id}</TableCell>
                        <TableCell>{prod.producto.nombre}</TableCell>
                        <TableCell>{prod.producto.codigoProducto}</TableCell>
                        <TableCell className="text-center">
                          {prod.cantidad}
                        </TableCell>
                        <TableCell className="text-right">
                          {formattMonedaGT(prod.precioVenta)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="truncate whitespace-nowrap overflow-hidden">
                            {prod.producto.descripcion}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="truncate whitespace-nowrap overflow-hidden">
                            <span
                              className={`
        text-[0.50rem] font-semibold
        ${getStatusClass(prod.estado)}
      `}
                            >
                              {ReplaceUnderlines(prod.estado)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {formattMonedaGT(calculateTotal(ventaSelected.productos))}
                    </TableCell>
                    <TableCell></TableCell>{" "}
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-32 bg-gray-50 dark:bg-transparent rounded-md">
            <h3 className="text-center font-semibold text-lg text-gray-700 dark:text-gray-300">
              Seleccione una venta para ver sus detalles.
            </h3>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-gray-200 dark:border-gray-700 pt-4 text-sm text-gray-600 dark:text-gray-400">
        {ventaSelected ? (
          <p className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Fecha de Venta:{" "}
            {formatearFecha(
              ventaSelected.fechaVenta
                ? ventaSelected.fechaVenta
                : dayjs().tz("America/Guatemala").toDate()
            )}
          </p>
        ) : null}
      </CardFooter>
      <DialogProductSelected
        product={selectedProduct}
        open={openProductDialog}
        onOpenChange={setOpenProductDialog}
        //formulario para garantía
        setFormData={setFormData}
        formData={formData}
        providerOptionSelect={providerOptionSelect}
        providers={providers}
        //enviar
        handleSubmitRegistGarantia={handleSubmitRegistGarantia}
        isSubmittingGarantia={isSubmittingGarantia}
        setIsSubmittingGarantia={setIsSubmittingGarantia}
      />
    </Card>
  );
}

export default CardGarantiaCreate;
