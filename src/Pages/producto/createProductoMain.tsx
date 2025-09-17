import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import { PageHeader } from "@/utils/components/PageHeaderPos";
import { ReusableSelect } from "@/utils/components/ReactSelectComponent/ReusableSelect";
import { motion } from "framer-motion";
import React, { useState } from "react";
import {
  AlertCircleIcon,
  Asterisk,
  Barcode,
  Box,
  Bug,
  SquareMinus,
  Text,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";
import { ProductCreate } from "./interfaces/interfaceCreate";
import { useStore } from "@/components/Context/ContextSucursal";
import { Textarea } from "@/components/ui/textarea";
import AddPrices from "../Inventario/AddPrices";
import {
  PrecioProductoInventario,
  Presentacion,
  TIPO_EMPAQUE_VALUES,
  TipoEmpaque,
} from "./interfaces/preciosCreateInterfaces";
import { ImageCropperUploader } from "../Cropper";
import { CroppedImage } from "./interfaces/croppedImage";
import AddPresentaciones from "./_components/addPresentaciones";
import { toast } from "sonner";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";

interface Categorias {
  id: number;
  nombre: string;
}
interface ProductCreatePartialWithPresentations extends ProductCreate {
  presentaciones?: Presentacion[];
}

const isNonEmpty = (s?: string | null) => !!s && s.trim().length > 0;

const isPositiveDecimalStr = (s?: string | null) => {
  if (s == null) return false;
  const str = String(s).trim();
  if (!/^\d+(\.\d+)?$/.test(str)) return false;
  const n = Number(str);
  return Number.isFinite(n) && n > 0;
};

const isPositiveInt = (n: unknown) => Number.isInteger(n) && (n as number) > 0;

function CreateProductPage() {
  const userID = useStore((state) => state.userId) ?? 0;
  const [productCreate, setProductCreate] =
    useState<ProductCreatePartialWithPresentations>({
      precioCostoActual: null,
      codigoProducto: "",
      codigoProveedor: "",
      categorias: [],
      descripcion: "",
      nombre: "",
      precioVenta: [],
      creadoPorId: userID,
      stockMinimo: null,
      imagenes: [],
      presentaciones: [],
    });
  const [preciosProducto, setPreciosProducto] = useState<
    PrecioProductoInventario[]
  >([]);
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [croppedImages, setCroppedImages] = useState<CroppedImage[]>([]);
  const {
    data: categorias = [],
    isError: isErrorCategorias = true,
    error: errorCategorias,
    // isFetching: isLoadingCategorias,
    // refetch: reFetchCategorias,
  } = useApiQuery<Categorias[]>(["categorias"], "/categoria", undefined, {});

  if (isErrorCategorias) {
    return (
      <div className="grid w-full max-w-xl items-start gap-2">
        <Alert variant={"destructive"}>
          <Bug />
          <AlertTitle>Error al cargar categorías</AlertTitle>
          <AlertDescription>
            {getApiErrorMessageAxios(errorCategorias)}
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>No fue posible continuar con el proceso</AlertTitle>
          <AlertDescription>
            <p>Por favor verifica lo siguiente:</p>
            <ul className="list-inside list-disc text-sm space-y-1">
              <li>Que tu conexión a internet sea estable</li>
              <li>Recargar la página e intentar nuevamente</li>
              <li>Revisar los datos enviados (si corresponde)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleChangeGeneric = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProductCreate((previa) => ({
      ...previa,
      [name]: value,
    }));
  };

  const handleClear = () => {
    setProductCreate({
      precioCostoActual: null,
      codigoProducto: "",
      codigoProveedor: "",
      categorias: [],
      descripcion: "",
      nombre: "",
      precioVenta: [],
      creadoPorId: userID,
      stockMinimo: null,
      imagenes: [],
      presentaciones: [],
    });
    setPresentaciones([]);
    setPreciosProducto([]);
  };
  console.log("El producto creando es: ", productCreate);
  console.log("Las presentaciones : ", presentaciones);
  // Construye el payload final a partir de los estados actuales:
  const buildPresentacionesDto = (presentaciones: Presentacion[]) => {
    return presentaciones.map((p) => ({
      nombre: p.nombre.trim(),
      factorUnidadBase: String(p.factorUnidadBase).trim(),
      sku: p.sku || undefined,
      codigoBarras: p.codigoBarras || undefined,
      esDefault: !!p.esDefault,

      // ✅ enviar lo que espera el backend
      tipoPresentacion: p.tipoPresentacion, // "UNIDAD" | ...
      costoReferencialPresentacion: String(
        p.costoReferencialPresentacion
      ).trim(),

      // ✅ mapear a preciosPresentacion
      preciosPresentacion: (p.precios ?? []).map((pp) => ({
        rol: pp.rol,
        orden: Number(pp.orden),
        precio: String(pp.precio).trim(),
      })),
    }));
  };

  const createProducto = useApiMutation<void, FormData>("post", "/products", {
    timeout: 60_000,
  });

  const buildFormDataProducto = (
    productCreate: ProductCreatePartialWithPresentations,
    preciosProducto: PrecioProductoInventario[],
    presentaciones: Presentacion[],
    croppedImages: CroppedImage[],
    userID: number
  ) => {
    const fd = new FormData();

    // Primitivos / strings
    const safeAppend = (k: string, v: unknown) => {
      if (v === null || v === undefined) return;
      fd.append(k, String(v));
    };

    safeAppend("nombre", productCreate.nombre);
    safeAppend("descripcion", productCreate.descripcion || "");
    safeAppend("codigoProducto", productCreate.codigoProducto);
    safeAppend("codigoProveedor", productCreate.codigoProveedor || "");

    if (productCreate.stockMinimo != null) {
      // respeta null => el backend decide default; si quieres 0 explícito, conviértelo aquí
      safeAppend("stockMinimo", productCreate.stockMinimo);
    }

    if (productCreate.precioCostoActual != null) {
      // mándalo como string decimal; evita floats
      safeAppend("precioCostoActual", productCreate.precioCostoActual);
    }

    // IDs/usuario
    safeAppend("creadoPorId", productCreate.creadoPorId ?? userID);

    // Arreglos/objetos → JSON
    fd.append(
      "categorias",
      JSON.stringify(productCreate.categorias.map((cat) => cat.id) || [])
    );
    fd.append("precioVenta", JSON.stringify(preciosProducto || []));

    fd.append(
      "presentaciones",
      JSON.stringify(buildPresentacionesDto(presentaciones || []))
    );

    // Imágenes
    croppedImages.forEach((img, idx) => {
      const fileName = img.fileName || `image_${idx + 1}`;
      const ext = img.blob?.type?.split("/")[1] || "webp"; // intenta inferir
      const file = new File([img.blob], `${fileName}.${ext}`, {
        type: img.blob.type || "image/webp",
      });
      fd.append("images", file);
    });

    return fd;
  };

  const createProductSubmit = async () => {
    try {
      // —— Tus validaciones tal cual —— //
      const errores: string[] = [];

      if (!isNonEmpty(productCreate.nombre)) {
        errores.push("El nombre es requerido (mínimo 1 carácter).");
      }
      if (
        productCreate.precioCostoActual !== null &&
        !isPositiveDecimalStr(productCreate.precioCostoActual as any)
      ) {
        errores.push(
          "El costo actual del producto debe ser un número mayor a 0."
        );
      }

      const preciosProductoValidos =
        preciosProducto.length === 0 ||
        preciosProducto.every((p, i) => {
          if (!isPositiveInt(p.orden)) {
            errores.push(`Precio #${i + 1}: el orden debe ser entero > 0.`);
            return false;
          }
          if (!p.rol) {
            errores.push(`Precio #${i + 1}: el rol es requerido.`);
            return false;
          }
          if (!isPositiveDecimalStr(p.precio)) {
            errores.push(`Precio #${i + 1}: el precio debe ser > 0.`);
            return false;
          }
          return true;
        });

      const hasPresentaciones = presentaciones.length > 0;
      if (hasPresentaciones) {
        const names = presentaciones
          .map((p) => p.nombre.trim())
          .filter(Boolean);
        const setNames = new Set(names);
        if (setNames.size !== names.length) {
          errores.push("Hay nombres de presentación repetidos.");
        }
        const defaults = presentaciones.filter((p) => !!p.esDefault).length;
        if (defaults > 1) {
          errores.push("Solo puede haber una presentación por defecto.");
        }
      }

      const presentacionesValidas =
        !hasPresentaciones ||
        presentaciones.every((presentacion, idxP) => {
          if (!isNonEmpty(presentacion.nombre)) {
            errores.push(`Presentación #${idxP + 1}: el nombre es requerido.`);
            return false;
          }
          if (!isPositiveDecimalStr(presentacion.factorUnidadBase)) {
            errores.push(
              `Presentación #${
                idxP + 1
              }: el factor de unidad base debe ser > 0.`
            );
            return false;
          }
          if (presentacion.precios.length === 0) {
            errores.push(
              `Presentación #${idxP + 1}: debe tener al menos un precio.`
            );
            return false;
          }

          if (
            !Object.values(TipoEmpaque).includes(presentacion.tipoPresentacion)
          ) {
            errores.push(
              `Presentación #${idxP + 1}: tipo de empaque inválido.`
            );
          }

          if (
            !isPositiveDecimalStr(presentacion.costoReferencialPresentacion)
          ) {
            errores.push(`Costo referencial #${idxP + 1}: debe ser > 0.`);
            return false;
          }

          const okPrecios = presentacion.precios.every((p, idxPP) => {
            if (!isPositiveInt(p.orden)) {
              errores.push(
                `Presentación #${idxP + 1}, precio #${
                  idxPP + 1
                }: el orden debe ser entero > 0.`
              );
              return false;
            }
            if (!p.rol) {
              errores.push(
                `Presentación #${idxP + 1}, precio #${
                  idxPP + 1
                }: el rol es requerido.`
              );
              return false;
            }
            if (!isPositiveDecimalStr(p.precio)) {
              errores.push(
                `Presentación #${idxP + 1}, precio #${
                  idxPP + 1
                }: el precio debe ser > 0.`
              );
              return false;
            }
            return true;
          });
          return okPrecios;
        });

      if (!preciosProductoValidos || !presentacionesValidas || errores.length) {
        toast.warning("Datos ingresados no válidos. Revisa los campos.");
        console.warn("Errores de validación:", errores);
        return;
      }

      // —— Construir FormData —— //
      const formData = buildFormDataProducto(
        productCreate,
        preciosProducto,
        presentaciones,
        croppedImages,
        userID
      );

      await toast.promise(createProducto.mutateAsync(formData), {
        loading: "Creando producto...",
        success: "Producto creado",
        error: (err) => getApiErrorMessageAxios(err),
      });
      handleClear();
      setOpenCreate(false);
    } catch (error) {
      console.error("Error al crear producto", error);
      setOpenCreate(false);
    }
  };

  return (
    <motion.div>
      <PageHeader
        title="Creación de producto"
        subtitle="Añada un nuevo producto al sistema"
        sticky={false}
        fallbackBackTo="/"
      />

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Datos del producto</CardTitle>
          <CardDescription>
            Ingrese los datos mínimos para crear un producto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            {/* Sección 1: Datos básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2 relative">
                <Label htmlFor="nombre">Nombre</Label>
                <Box className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
                <Input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Nombre de producto"
                  onChange={handleChangeGeneric}
                  required
                />
              </div>

              <div className="grid gap-2 relative">
                <Label htmlFor="codigoProducto">Código Producto</Label>
                <Barcode className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
                <Input
                  id="codigoProducto"
                  name="codigoProducto"
                  type="text"
                  placeholder="Código único por producto"
                  onChange={handleChangeGeneric}
                />
              </div>

              <div className="grid gap-2 relative">
                <Label htmlFor="codigoProveedor">Código del proveedor</Label>
                <Asterisk className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
                <Input
                  id="codigoProveedor"
                  name="codigoProveedor"
                  type="text"
                  placeholder="Código único del proveedor (opcional)"
                  onChange={handleChangeGeneric}
                />
              </div>

              <div className="grid gap-2 relative">
                <Label htmlFor="stockMinimo">Stock Mínimo</Label>
                <SquareMinus className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
                <Input
                  id="stockMinimo"
                  name="stockMinimo"
                  type="number"
                  placeholder="Cantidad mínima en inventario"
                  onChange={handleChangeGeneric}
                />
              </div>

              <div className="grid gap-2 relative">
                <Label htmlFor="precioCostoActual">Precio Costo</Label>
                <SquareMinus className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
                <Input
                  id="precioCostoActual"
                  name="precioCostoActual"
                  type="number"
                  placeholder="Costo actual del producto"
                  onChange={handleChangeGeneric}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="categorias">Categorías</Label>
                <ReusableSelect<Categorias>
                  isMulti
                  items={categorias}
                  getLabel={(c) => c.nombre}
                  getValue={(c) => c.id}
                  value={productCreate.categorias}
                  onChange={(cats) =>
                    setProductCreate((prev) => ({ ...prev, categorias: cats }))
                  }
                  placeholder="Seleccione categorías"
                  selectProps={{
                    isSearchable: true,
                    closeMenuOnSelect: false,
                    menuPortalTarget: document.body,
                    styles: {
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    },
                  }}
                />
              </div>
            </div>

            {/* Sección 2: Descripción */}
            <div className="grid gap-2 relative">
              <Label htmlFor="descripcion">Descripción</Label>
              <Text className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
              <Textarea
                id="descripcion"
                name="descripcion"
                placeholder="Descripción del producto"
                onChange={handleChangeGeneric}
                rows={4}
              />
            </div>

            {/* Sección 3: Imágenes */}
            <div className="grid gap-2">
              <Label>Imágenes</Label>
              <ImageCropperUploader
                croppedImages={croppedImages}
                setCroppedImages={setCroppedImages}
              />
            </div>

            {/* Sección 4: Precios */}
            <div className="grid gap-2">
              <Label>Precios del Producto</Label>
              <AddPrices
                precios={preciosProducto}
                setPrecios={setPreciosProducto}
              />
            </div>

            <div className="grid gap-2">
              <Label>Presentaciones del Producto</Label>
              <AddPresentaciones
                presentaciones={presentaciones}
                setPresentaciones={setPresentaciones}
              />
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button
            onClick={() => {
              setOpenCreate(true);
            }}
            type="submit"
          >
            Guardar producto
          </Button>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </CardFooter>
      </Card>
      <AdvancedDialog
        title="Confirmación de creación de producto"
        description="¿Estás seguro de crear este producto con estos datos?"
        onOpenChange={setOpenCreate}
        open={openCreate}
        confirmButton={{
          label: "Sí, continuar y crear",
          loading: createProducto.isPending,
          disabled: createProducto.isPending,
          loadingText: "Creando producto...",
          onClick: createProductSubmit,
        }}
        cancelButton={{
          label: "Cancelar",
          disabled: createProducto.isPending,
          loadingText: "Cancelando...",
          onClick: () => {
            setOpenCreate(false);
          },
        }}
      />
    </motion.div>
  );
}

export default CreateProductPage;
