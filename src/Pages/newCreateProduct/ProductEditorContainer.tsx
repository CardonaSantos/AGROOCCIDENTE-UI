"use client";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  useApiQuery,
  useApiMutation,
} from "@/hooks/genericoCall/genericoCallHook";
import { toast } from "sonner";
import BasicInfoForm from "./components/BasicInfoForm";
import DescriptionForm from "./components/DescriptionForm";
import ImageUploader from "./components/ImageUploader";
import PricesForm from "./components/PricesForm";
import PresentationsForm from "./components/PresentationsForm";
import { PaginatedResponse } from "../tipos-presentaciones/Interfaces/tiposPresentaciones.interfaces";
import {
  ProductCreateDTO,
  ProductDetailDTO,
  ExistingImage,
  Categoria,
  TipoPresentacion,
  PresentationDetailDTO,
} from "./interfaces/DomainProdPressTypes";
import { PageHeader } from "@/utils/components/PageHeaderPos";
import { Button } from "@/components/ui/button";
import { useStore } from "@/components/Context/ContextSucursal";
import { buildFormData, debugFormData } from "./builder";
// (Temporal) mientras definimos el DTO real de presentación del backend

// Estado inicial
const initialProduct: ProductCreateDTO = {
  basicInfo: {
    nombre: "",
    codigoProducto: "",
    codigoProveedor: "",
    stockMinimo: 0,
    precioCostoActual: 0,
    categorias: [],
    tipoPresentacionId: null, // ✅ nuevo
    tipoPresentacion: null, // ✅ nuevo (para label)
  },
  description: "",
  images: [],
  prices: [],
  presentations: [],
};

export default function ProductEditorContainer({
  mode = "product",
}: {
  mode?: "product" | "presentation";
}) {
  const userId = useStore((state) => state.userId) ?? 0;
  const params = useParams<{ productId?: string; presentationId?: string }>();
  const idParam = mode === "product" ? params.productId : params.presentationId;
  const id = idParam ? Number(idParam) : undefined;
  const isEditing = Boolean(id);

  // 1) Carga datos maestros
  const { data: catsData } = useApiQuery<Categoria[]>(
    ["categorias"],
    "categoria"
  );
  const { data: packData } = useApiQuery<PaginatedResponse<TipoPresentacion>>(
    ["empaques"],
    "tipo-presentacion"
  );

  const categories = catsData ?? [];
  const packagingTypes = packData?.data ?? [];
  // 2) Carga detalle condicional
  const detailKey = mode === "product" ? ["product", id] : ["presentation", id];
  const detailUrl =
    mode === "product" ? `products/${id}` : `presentations/${id}`;
  const { data: detailData } = useApiQuery<
    ProductDetailDTO | PresentationDetailDTO
  >(detailKey, detailUrl, undefined, { enabled: isEditing });

  // 3) Estado del formulario
  const [formState, setFormState] = useState<ProductCreateDTO>(initialProduct);
  useEffect(() => {
    if (!detailData) return;
    const mapped =
      mode === "product"
        ? mapProductDto(detailData as ProductDetailDTO)
        : mapPresentationDto(detailData as PresentationDetailDTO);
    setFormState(mapped);
  }, [detailData, mode]);

  // Update genérico
  const updateField = <K extends keyof ProductCreateDTO>(
    key: K,
    value: ProductCreateDTO[K]
  ) => setFormState((prev) => ({ ...prev, [key]: value }));

  // Mutación create/update
  const submitBase = mode === "product" ? "/products" : "/presentations";
  const mutation = useApiMutation<unknown, FormData>(
    isEditing ? "patch" : "post",
    isEditing ? `${submitBase}/${id}` : submitBase
  );

  const [originalDetail, setOriginalDetail] = useState<ProductDetailDTO | null>(
    null
  );
  useEffect(() => {
    if (!detailData) return;
    setFormState(mapProductDto(detailData as ProductDetailDTO));
    setOriginalDetail(detailData as ProductDetailDTO);
  }, [detailData]);

  const handleSubmit = async () => {
    const formData = buildFormData(formState, userId, {
      isEditing,
      original: originalDetail ?? undefined,
    });

    try {
      debugFormData(formData, isEditing ? "PATCH /products" : "POST /products");

      await toast.promise(mutation.mutateAsync(formData), {
        loading: isEditing
          ? `Actualizando ${
              mode === "product" ? "producto" : "presentación"
            }...`
          : `Creando ${mode === "product" ? "producto" : "presentación"}...`,
        success: isEditing
          ? `${mode === "product" ? "Producto" : "Presentación"} actualizado`
          : `${mode === "product" ? "Producto" : "Presentación"} creado`,
        error: (err) => getErrorMessage(err),
      });
      console.log("el form data es para actualizar o crear es: ", formData);
    } catch {}
  };

  console.log("El form de mi create prod es: ", formState);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creación y edición de un producto"
        sticky={false}
        fallbackBackTo="/"
        subtitle="Edite los detalles de su modelo de productos"
      />
      {/* Secciones solo en modo producto */}
      {mode === "product" && (
        <>
          <BasicInfoForm
            value={formState.basicInfo}
            categories={categories}
            packagingTypes={packagingTypes} // ✅ nuevo
            onChange={(val) => updateField("basicInfo", val)}
          />

          <DescriptionForm
            value={formState.description}
            onChange={(val) => updateField("description", val)}
          />

          <ImageUploader
            files={formState.images}
            onDone={(files) => updateField("images", files)}
          />

          <PricesForm
            precios={formState.prices}
            setPrecios={(prices) => updateField("prices", prices)}
          />
        </>
      )}

      {/* Presentaciones en ambos modos */}
      <PresentationsForm
        items={formState.presentations}
        setItems={(items) => updateField("presentations", items)}
        packagingTypes={packagingTypes}
        categories={categories}
      />

      <div className="flex justify-end">
        <Button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={mutation.isPending}
        >
          {isEditing
            ? `Actualizar ${mode === "product" ? "Producto" : "Presentación"}`
            : `Crear ${mode === "product" ? "Producto" : "Presentación"}`}
        </Button>
      </div>
    </div>
  );
}

export function mapProductDto(dto: ProductDetailDTO): ProductCreateDTO {
  return {
    basicInfo: {
      nombre: dto.nombre,
      codigoProducto: dto.codigoProducto,
      codigoProveedor: dto.codigoProveedor ?? "",
      // 🔹 ahora usamos el del server
      stockMinimo: dto.stockMinimo ?? 0,
      // 🔹 asegurar número
      precioCostoActual: Number(dto.precioCostoActual ?? 0),

      categorias: dto.categorias ?? [],
      tipoPresentacionId: dto.tipoPresentacionId ?? null,
      tipoPresentacion: dto.tipoPresentacion ?? null,
    },
    description: dto.descripcion ?? "",
    images: (dto.imagenesProducto ?? []) as ExistingImage[],
    prices: (dto.precios ?? []).map((p) => ({
      rol: p.rol,
      orden: p.orden,
      precio: String(p.precio), // el server ya lo manda string
    })),
    presentations: (dto.presentaciones ?? []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigoBarras: p.codigoBarras ?? "",
      tipoPresentacionId:
        p.tipoPresentacionId ?? p.tipoPresentacion?.id ?? null,
      tipoPresentacion: p.tipoPresentacion ?? null,
      costoReferencialPresentacion: String(
        p.costoReferencialPresentacion ?? "0"
      ),
      descripcion: p.descripcion ?? "",
      // 🔹 ya viene listo y null-safe desde el server
      stockMinimo: p.stockMinimo ?? 0,
      precios: (p.precios ?? []).map((x) => ({
        rol: x.rol,
        orden: x.orden,
        precio: String(x.precio),
      })),
      esDefault: !!p.esDefault,
      imagenes: (p.imagenesPresentacion ?? []) as ExistingImage[],
      activo: !!p.activo,
      categorias: p.categorias ?? [],
    })),
  };
}

export function mapPresentationDto(
  dto: PresentationDetailDTO
): ProductCreateDTO {
  return {
    basicInfo: {
      nombre: "",
      codigoProducto: "",
      codigoProveedor: "",
      stockMinimo: 0,
      precioCostoActual: 0,
      categorias: [],
      tipoPresentacionId: null,
      tipoPresentacion: null,
    },
    description: "",
    images: [],
    prices: [],
    presentations: [
      {
        id: dto.id,
        nombre: dto.nombre,
        codigoBarras: dto.codigoBarras ?? "",
        tipoPresentacionId: dto.tipoPresentacionId,
        tipoPresentacion: dto.tipoPresentacion,
        costoReferencialPresentacion: dto.costoReferencialPresentacion,
        descripcion: dto.descripcion ?? "",
        stockMinimo: dto.stockMinimo ?? 0,
        precios: dto.precios.map((x) => ({
          rol: x.rol,
          orden: x.orden,
          precio: x.precio,
        })),
        esDefault: !!dto.esDefault,
        imagenes: dto.imagenesPresentacion, // ExistingImage[]
        activo: dto.activo,
        categorias: dto.categorias,
      },
    ],
  };
}

function getErrorMessage(err: any): string {
  return err?.message || "Error desconocido";
}
