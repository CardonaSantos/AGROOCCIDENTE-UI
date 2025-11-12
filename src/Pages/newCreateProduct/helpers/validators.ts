import { ProductCreateDTO } from "../interfaces/DomainProdPressTypes";

// === helpers de validación ===
type Modo = "product" | "presentation";
type ValidationResult = { ok: true } | { ok: false; errors: string[] };

const gt0 = (n: unknown) => {
  const v = Number(n);
  return Number.isFinite(v) && v > 0;
};

const hasPrices = (
  arr?: { precio: unknown; rol?: unknown; orden?: unknown }[]
) =>
  Array.isArray(arr) &&
  arr.length > 0 &&
  arr.every(
    (p) => gt0(p.precio) && (p.rol ?? "") !== "" && Number(p.orden ?? 1) > 0
  );

const uniqueRolOrden = (arr: { rol: string; orden: number }[]) => {
  const seen = new Set<string>();
  for (const p of arr) {
    const key = `${p.rol}|${p.orden}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
};

const singleDefaultPresentation = (
  presentations: ProductCreateDTO["presentations"]
) => {
  const count = (presentations ?? []).filter((p) => !!p.esDefault).length;
  return count <= 1;
};

export function validateBeforeSubmit(
  form: ProductCreateDTO,
  mode: Modo
): ValidationResult {
  const errors: string[] = [];

  // Comunes
  if (!form.basicInfo?.nombre?.trim()) errors.push("El nombre es obligatorio.");
  if (!form.basicInfo?.codigoProducto?.trim())
    errors.push("El código de producto es obligatorio.");
  if (
    form.basicInfo?.stockMinimo != null &&
    Number(form.basicInfo.stockMinimo) < 0
  )
    errors.push("El stock mínimo no puede ser negativo.");

  // Costo (requerido siempre en producto)
  if (mode === "product" && !gt0(form.basicInfo?.precioCostoActual)) {
    errors.push("El precio costo actual debe ser mayor a 0.");
  }

  // Reglas de precios:
  // - PRODUCTO: debe existir al menos un precio a nivel producto
  //             o bien (si usa presentaciones) que al menos 1 presentación tenga precios.
  if (mode === "product") {
    const productHasPrices = hasPrices(form.prices);
    const anyPresentationHasPrices = (form.presentations ?? []).some((p) =>
      hasPrices(p.precios)
    );
    if (!productHasPrices && !anyPresentationHasPrices) {
      errors.push(
        "Debes definir al menos un precio: a nivel de producto o en alguna presentación."
      );
    }
    if (
      form.prices?.length &&
      !uniqueRolOrden(
        form.prices.map((p) => ({ rol: p.rol, orden: Number(p.orden ?? 1) }))
      )
    ) {
      errors.push(
        "Precios de producto: no puede repetirse la combinación (rol, orden)."
      );
    }
  }

  // - PRESENTATION: debe existir al menos una presentación con al menos un precio.
  if (mode === "presentation") {
    if (!(form.presentations ?? []).length) {
      errors.push("Debes agregar al menos una presentación.");
    }
    const allHavePrices = (form.presentations ?? []).every((p) =>
      hasPrices(p.precios)
    );
    if (!allHavePrices)
      errors.push("Cada presentación debe tener al menos un precio válido.");
    // (Opcional) exigir tipoPresentacionId en cada presentación
    const missingTipo = (form.presentations ?? []).some(
      (p) => p.tipoPresentacionId == null
    );
    if (missingTipo)
      errors.push("Cada presentación debe tener un tipo de presentación.");
  }

  // Presentaciones: sólo una por defecto
  if (!singleDefaultPresentation(form.presentations)) {
    errors.push(
      "Sólo puede haber una presentación marcada como predeterminada."
    );
  }

  // Extra: validar duplicados (rol, orden) también en precios de presentaciones
  for (const pres of form.presentations ?? []) {
    if (pres.precios?.length) {
      const ok = uniqueRolOrden(
        pres.precios.map((x) => ({ rol: x.rol, orden: Number(x.orden ?? 1) }))
      );
      if (!ok) {
        errors.push(
          `Presentación "${
            pres.nombre ?? pres.id
          }": no puede repetirse la combinación (rol, orden).`
        );
      }
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
