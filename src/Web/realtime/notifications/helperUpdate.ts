// Listas simples: UiNotificacionDTO[]
export function upsertArrayById<T extends { id: number | string }>(
  prev: T[] | undefined,
  item: T,
  opts?: { prepend?: boolean }
) {
  if (!prev) return [item];
  const idx = prev.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    // replace in place (inmutable)
    return [...prev.slice(0, idx), item, ...prev.slice(idx + 1)];
  }
  // insert
  return opts?.prepend ? [item, ...prev] : [...prev, item];
}
