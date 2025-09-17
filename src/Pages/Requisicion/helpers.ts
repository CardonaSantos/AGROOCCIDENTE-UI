// requisicion.helpers.ts
export function computePresentacionCostoUnitario(
  costoReferencialPresentacion: string | null,
  precioCostoProducto: number | null,
  factorUnidadBase: string // decimal string
): string {
  if (costoReferencialPresentacion) return costoReferencialPresentacion;
  if (precioCostoProducto != null) {
    const factor = Number(factorUnidadBase || "0");
    const calc = precioCostoProducto * factor || 0;
    return calc.toFixed(2);
  }
  return "0";
}

export const keyForProducto = (id: number): `prod-${number}` => `prod-${id}`;
export const keyForPresentacion = (id: number): `pres-${number}` =>
  `pres-${id}`;
