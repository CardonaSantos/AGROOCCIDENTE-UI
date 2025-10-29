// UpserSocketEvent.ts
export function upsertArrayById<T extends { id: number | string }>(
  prev: T[] | undefined,
  item: T,
  opts?: { prepend?: boolean }
) {
  if (!prev) return [item];
  const i = prev.findIndex((x) => x.id === item.id);
  if (i >= 0) return [...prev.slice(0, i), item, ...prev.slice(i + 1)];
  return opts?.prepend ? [item, ...prev] : [...prev, item];
}

export function matchesSucursal(
  item: { sucursalId?: number | null },
  keyPart?: { sucursalId?: number }
) {
  if (!keyPart?.sucursalId) return true; // sin filtro, aplica
  return Number(item.sucursalId) === Number(keyPart.sucursalId);
}

// debounce simple para reconciliar
export function createDebounced(fn: () => void, ms = 800) {
  let t: number | undefined;
  return () => {
    window.clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}
