import {
  ExistingImage,
  ProductCreateDTO,
  ProductDetailDTO,
  RolPrecio,
  UIMedia,
} from "./interfaces/DomainProdPressTypes";

/** Normaliza a string decimal (el server valida regex/positivo) */
export const toDecimal = (v: unknown, fallback = "0"): string => {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s === "" ? fallback : s;
};

const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const sameIdSet = (a: number[], b: number[]) => {
  if (a.length !== b.length) return false;
  const A = new Set(a);
  for (const x of b) if (!A.has(x)) return false;
  return true;
};

export const isFile = (m: UIMedia): m is File => m instanceof File;
export const isExisting = (m: UIMedia): m is ExistingImage =>
  !!(m as ExistingImage).url && !(m instanceof File);

/**
 * Builder de FormData para crear/editar producto (+presentaciones).
 * - Adjunta archivos nuevos SIEMPRE (producto y presentaciones).
 * - En edición, solo envía keep* cuando hay intención clara (no manda [] si había originales).
 */
export function buildFormData(
  form: ProductCreateDTO,
  creadoPorId: number,
  opts?: { isEditing?: boolean; original?: ProductDetailDTO }
): FormData {
  const isEditing = !!opts?.isEditing;
  const original = opts?.original;

  const fd = new FormData();

  // ===== Campos planos del producto =====
  fd.append("nombre", form.basicInfo.nombre);
  fd.append("descripcion", form.description ?? "");
  fd.append("codigoProducto", form.basicInfo.codigoProducto);
  fd.append("codigoProveedor", form.basicInfo.codigoProveedor ?? "");
  fd.append("stockMinimo", String(form.basicInfo.stockMinimo ?? 0));
  fd.append(
    "precioCostoActual",
    toDecimal(form.basicInfo.precioCostoActual, "0")
  );
  fd.append("creadoPorId", String(creadoPorId));

  if (form.basicInfo.tipoPresentacionId != null) {
    fd.append("tipoPresentacionId", String(form.basicInfo.tipoPresentacionId));
  } else {
    fd.append("tipoPresentacionId", "");
  }

  // ===== JSONs planos =====
  // categorias: number[]
  fd.append(
    "categorias",
    JSON.stringify((form.basicInfo.categorias ?? []).map((c) => c.id))
  );

  // precioVenta: PrecioProductoDto[]
  fd.append(
    "precioVenta",
    JSON.stringify(
      (form.prices ?? []).map((p) => ({
        rol: p.rol as RolPrecio,
        orden: Number(p.orden) || 1,
        precio: toDecimal(p.precio, "0"),
      }))
    )
  );

  // presentaciones: PresentacionCreate/UpdateDto[]
  const presentationsPayload = (form.presentations ?? []).map((p) => ({
    id: p.id ?? null, // importante para upsert en edición
    nombre: p.nombre,
    codigoBarras: p.codigoBarras || undefined,
    esDefault: !!p.esDefault,
    tipoPresentacionId:
      p.tipoPresentacionId != null ? Number(p.tipoPresentacionId) : null,
    costoReferencialPresentacion: toDecimal(
      p.costoReferencialPresentacion,
      "0"
    ),
    descripcion: p.descripcion ?? null,
    stockMinimo:
      p.stockMinimo === undefined || p.stockMinimo === null
        ? null
        : Number(p.stockMinimo),
    categoriaIds: (p.categorias ?? []).map((c) => c.id),
    preciosPresentacion: (p.precios ?? []).map((x) => ({
      rol: x.rol as RolPrecio,
      orden: Number(x.orden) || 1,
      precio: toDecimal(x.precio, "0"),
    })),
    activo: p.activo ?? true,
  }));
  fd.append("presentaciones", JSON.stringify(presentationsPayload));

  // ===== Archivos (crear/editar) =====
  // a) imágenes de producto
  (form.images ?? [])
    .filter(isFile)
    .forEach((file) => fd.append("images", file));

  // b) imágenes por presentación (por índice)
  (form.presentations ?? []).forEach((p, i) => {
    (p.imagenes ?? [])
      .filter(isFile)
      .forEach((file) =>
        fd.append(`presentaciones[${i}].images`, file as File)
      );
  });

  // ===== Extras de EDICIÓN: deletes y keeps =====
  if (isEditing && original) {
    // 1) Presentaciones eliminadas (id original que ya no viene)
    const originalIds = (original.presentaciones ?? []).map((x) => x.id);
    const currentIds = (form.presentations ?? [])
      .map((x) => toNum(x.id))
      .filter((n): n is number => n !== null);
    const deleted = originalIds.filter((oid) => !currentIds.includes(oid));
    if (deleted.length) {
      fd.append("deletedPresentationIds", JSON.stringify(deleted));
    }

    // 2) Keep de imágenes de producto (solo si hay intención clara)
    const newProductFiles = (form.images ?? []).filter(isFile);
    const keepProductImageIds = (form.images ?? [])
      .filter(isExisting)
      .map((img) => toNum((img as ExistingImage).id))
      .filter((id): id is number => id !== null);

    const originalProdImgIds = (original.imagenesProducto ?? [])
      .map((img) => toNum(img.id))
      .filter((id): id is number => id !== null);

    // Regla conservadora:
    // - Si no había imágenes originales -> podemos mandar [] sin riesgo.
    // - Si hay originales:
    //     * manda keep solo si el usuario seleccionó explícitamente (keep > 0)
    //       o si mantuvo todas pero cambió el orden (sameIdSet=false con keep>0).
    //     * si keep es [] y había originales, NO mandes nada -> el server no borra.
    const hadOriginalProdImages = originalProdImgIds.length > 0;
    const userProvidedKeeps = keepProductImageIds.length > 0;
    const allOriginalGone =
      keepProductImageIds.length === 0 && hadOriginalProdImages;

    if (!hadOriginalProdImages) {
      // No había originales: si el usuario no marcó keeps, mandamos [] explícito (inofensivo)
      fd.append("keepProductImageIds", JSON.stringify([]));
    } else if (userProvidedKeeps) {
      // Usuario expresó intención de mantener un subconjunto (o todas)
      if (
        !sameIdSet(keepProductImageIds, originalProdImgIds) ||
        newProductFiles.length >= 0
      ) {
        fd.append("keepProductImageIds", JSON.stringify(keepProductImageIds));
      }
    } else if (!userProvidedKeeps && !allOriginalGone) {
      // keep vacío pero había originales -> NO mandar nada (evita borrado accidental)
      // no-append
    }
    // Si realmente quisieras "borrar todas", la UI debería proveer un flag explícito para enviar keep=[].

    // 3) Keep por presentación (solo entradas con intención clara)
    const keepMap: Record<number, number[]> = {};
    for (const presOriginal of original.presentaciones ?? []) {
      const presId = presOriginal.id;

      // Buscar la presentación en el form por id
      const current = (form.presentations ?? []).find((p) => p.id === presId);
      if (!current) continue; // si se borró, cae en deletedPresentationIds

      const newPresFiles = (current.imagenes ?? []).filter(isFile);

      const keepIds = (current.imagenes ?? [])
        .filter(isExisting)
        .map((img) => toNum((img as ExistingImage).id))
        .filter((id): id is number => id !== null);

      const originalIdsForPres = (presOriginal.imagenesPresentacion ?? [])
        .map((img) => toNum(img.id))
        .filter((id): id is number => id !== null);

      const hadOriginalPresImages = originalIdsForPres.length > 0;
      const userProvidedPresKeeps = keepIds.length > 0;

      if (!hadOriginalPresImages) {
        // No había originales: mandar [] es inofensivo
        keepMap[presId] = [];
      } else if (userProvidedPresKeeps) {
        // Usuario expresó intención (subset o todas)
        if (
          !sameIdSet(keepIds, originalIdsForPres) ||
          newPresFiles.length >= 0
        ) {
          keepMap[presId] = keepIds;
        }
      } else {
        // keep vacío + había originales => no mandar nada para esa presentación
      }
    }

    if (Object.keys(keepMap).length > 0) {
      fd.append("keepPresentationImageIds", JSON.stringify(keepMap));
    }
  }

  return fd;
}

/** Utilidad para inspeccionar el FormData */
export function debugFormData(fd: FormData, label = "FORMDATA") {
  const out: Record<string, any[]> = {};
  for (const [k, v] of fd.entries()) {
    if (!out[k]) out[k] = [];
    out[k].push(
      v instanceof File ? `(File) ${v.name} (${v.type}, ${v.size}b)` : v
    );
  }
  console.log(label, out);
}
