export const DPI_OR_NIT_REGEX = /^(?:\d{13}|\d{7,11}[kK]?)$/;
export function validarDpiONit(valor?: string | null) {
  if (!valor) return { valido: false };
  const clean = valor.trim();
  if (!DPI_OR_NIT_REGEX.test(clean)) return { valido: false };
  if (/^\d{13}$/.test(clean)) return { valido: true, tipo: "DPI" as const };

  return { valido: true, tipo: "NIT" as const };
}

export const validateDpiNitEither = (dpi?: string, nit?: string) => {
  // Debe existir al menos uno válido
  const hasDpi = Boolean(dpi && dpi.trim() !== "");
  const hasNit = Boolean(nit && nit.trim() !== "");
  if (!hasDpi && !hasNit)
    return { ok: false, msg: "Debe proporcionar DPI o NIT" };

  if (hasDpi && !validarDpiONit(dpi).valido)
    return { ok: false, msg: "DPI inválido (13 dígitos)" };
  if (hasNit && !validarDpiONit(nit).valido)
    return { ok: false, msg: "NIT inválido (7–11 dígitos, K opcional)" };

  return { ok: true, msg: "" };
};
