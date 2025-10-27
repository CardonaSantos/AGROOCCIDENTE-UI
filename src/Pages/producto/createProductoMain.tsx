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
import React, { useRef, useState } from "react";
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
  TipoEmpaque,
} from "./interfaces/preciosCreateInterfaces";
import AddPresentaciones from "./_components/addPresentaciones";
import { toast } from "sonner";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import ProductImagesCropper from "@/utils/components/Image/ProductImagesCropper";
import { CroppedGrid } from "@/utils/components/Image/croppedGrid";
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

  const [rawProductFiles, setRawProductFiles] = useState<File[]>([]);
  const [croppedProductImages, setCroppedProductImages] = useState<File[]>([]);
  const [openProductCropper, setOpenProductCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: categorias = [],
    isError: isErrorCategorias = true,
    error: errorCategorias,
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
    setProductCreate((previa) => ({ ...previa, [name]: value }));
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
    setPreciosProducto([]);
    setRawProductFiles([]);
    setCroppedProductImages([]);
  };

  // —— Construcción DTO de presentaciones (solo JSON, sin archivos) —— //
  const buildPresentacionesDto = (presentaciones: Presentacion[]) =>
    (presentaciones ?? []).map((p) => ({
      nombre: p.nombre.trim(),
      codigoBarras: p.codigoBarras || undefined,
      esDefault: !!p.esDefault,
      tipoPresentacion: p.tipoPresentacion,
      costoReferencialPresentacion: String(
        p.costoReferencialPresentacion
      ).trim(),
      descripcion: (p.descripcion ?? "").trim() || null,
      stockMinimo: typeof p.stockMinimo === "number" ? p.stockMinimo : null,
      preciosPresentacion: (p.precios ?? []).map((pp) => ({
        rol: pp.rol,
        orden: Number(pp.orden),
        precio: String(pp.precio).trim(),
      })),
    }));

  const createProducto = useApiMutation<void, FormData>("post", "/products", {
    timeout: 60_000,
  });

  // —— FormData final —— //
  const buildFormDataProducto = (
    productCreate: ProductCreatePartialWithPresentations,
    preciosProducto: PrecioProductoInventario[],
    productImages: File[],
    userID: number
  ) => {
    const fd = new FormData();
    const safeAppend = (k: string, v: unknown) => {
      if (v === null || v === undefined) return;
      fd.append(k, String(v));
    };

    // primitivas
    safeAppend("nombre", productCreate.nombre);
    safeAppend("descripcion", productCreate.descripcion || "");
    safeAppend("codigoProducto", productCreate.codigoProducto);
    safeAppend("codigoProveedor", productCreate.codigoProveedor || "");
    if (productCreate.stockMinimo != null)
      safeAppend("stockMinimo", productCreate.stockMinimo);
    if (productCreate.precioCostoActual != null)
      safeAppend("precioCostoActual", productCreate.precioCostoActual);
    safeAppend("creadoPorId", productCreate.creadoPorId ?? userID);

    // JSON
    fd.append(
      "categorias",
      JSON.stringify(productCreate.categorias.map((c) => c.id) || [])
    );
    fd.append("precioVenta", JSON.stringify(preciosProducto || []));

    const pres = productCreate.presentaciones ?? [];
    fd.append("presentaciones", JSON.stringify(buildPresentacionesDto(pres)));

    // archivos del PRODUCTO
    productImages.forEach((file) => fd.append("images", file));

    // archivos por PRESENTACIÓN (mismo índice del JSON)
    pres.forEach((p, i) => {
      (p.imagenes ?? []).forEach((file) => {
        fd.append(`presentaciones[${i}].images`, file);
      });
    });

    return fd;
  };

  const createProductSubmit = async () => {
    try {
      const errores: string[] = [];
      const pres = productCreate.presentaciones ?? [];

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

      const hasPresentaciones = pres.length > 0;
      if (hasPresentaciones) {
        const names = pres.map((p) => p.nombre.trim()).filter(Boolean);
        const setNames = new Set(names);
        if (setNames.size !== names.length) {
          errores.push("Hay nombres de presentación repetidos.");
        }
        const defaults = pres.filter((p) => !!p.esDefault).length;
        if (defaults > 1) {
          errores.push("Solo puede haber una presentación por defecto.");
        }
      }

      const presentacionesValidas =
        !hasPresentaciones ||
        pres.every((presentacion, idxP) => {
          if (!isNonEmpty(presentacion.nombre)) {
            errores.push(`Presentación #${idxP + 1}: el nombre es requerido.`);
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

      const formData = buildFormDataProducto(
        productCreate,
        preciosProducto,
        croppedProductImages,
        userID
      );

      // Debug útil: ver qué se manda de verdad
      for (const [k, v] of formData.entries()) {
        if (k === "presentaciones" && typeof v === "string") {
          console.log("presentaciones JSON =>", v.slice(0, 400));
        } else if (v instanceof File) {
          console.log("file =>", k, v.name);
        } else {
          console.log(k, v);
        }
      }

      await toast.promise(createProducto.mutateAsync(formData), {
        loading: "Creando producto...",
        success: "Producto creado",
        error: (err) => getApiErrorMessageAxios(err),
      });

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

            {/* —— Sección 3: Imágenes del PRODUCTO (nuevo cropper unificado) —— */}
            <div className="rounded-lg border bg-background/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const f = Array.from(e.target.files ?? []);
                      if (!f.length) return;
                      setRawProductFiles(f);
                      setOpenProductCropper(true);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Elegir archivos
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {croppedProductImages.length
                      ? `${croppedProductImages.length} archivo(s)`
                      : "Sin imágenes"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenProductCropper(true)}
                    disabled={!rawProductFiles.length}
                    className="text-muted-foreground"
                  >
                    Re-cortar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRawProductFiles([]);
                      setCroppedProductImages([]);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-muted-foreground"
                  >
                    Limpiar
                  </Button>
                </div>
              </div>

              <div className="px-3 pb-3">
                <CroppedGrid
                  files={croppedProductImages}
                  onRemove={(i) =>
                    setCroppedProductImages((arr) =>
                      arr.filter((_, j) => j !== i)
                    )
                  }
                />
              </div>
            </div>

            <ProductImagesCropper
              open={openProductCropper}
              onOpenChange={setOpenProductCropper}
              files={rawProductFiles}
              onDone={(croppedFiles) => {
                setCroppedProductImages(croppedFiles);
              }}
            />

            {/* Sección 4: Precios */}
            <div className="grid gap-2">
              <Label>Precios del Producto</Label>
              <AddPrices
                precios={preciosProducto}
                setPrecios={setPreciosProducto}
              />
            </div>

            {/* Sección 5: Presentaciones (con imágenes propias) */}
            <div className="grid gap-2">
              <Label>Presentaciones del Producto</Label>
              <AddPresentaciones
                presentaciones={productCreate.presentaciones ?? []}
                setPresentaciones={(next) =>
                  setProductCreate((prev) => ({
                    ...prev,
                    presentaciones:
                      typeof next === "function"
                        ? next(prev.presentaciones ?? [])
                        : next,
                  }))
                }
              />
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button onClick={() => setOpenCreate(true)} type="submit">
            Guardar producto
          </Button>
          <Button type="button" variant="outline" onClick={handleClear}>
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
          onClick: () => setOpenCreate(false),
        }}
      />
    </motion.div>
  );
}

export default CreateProductPage;
