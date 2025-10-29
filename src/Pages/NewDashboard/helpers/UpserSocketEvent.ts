export type ListResp<T> = {
  data: T[];
  meta: { total: number; limit: number; pages: number };
};

export function upsertIntoList<T extends { id: number | string }>(
  prev: ListResp<T> | undefined,
  item: T,
  opts?: { prepend?: boolean }
): ListResp<T> | undefined {
  if (!prev) return prev;
  const exists = prev.data.some((x) => x.id === item.id);
  const data = exists
    ? prev.data.map((x) => (x.id === item.id ? item : x))
    : opts?.prepend
    ? [item, ...prev.data]
    : [...prev.data, item];

  const total = exists ? prev.meta.total : prev.meta.total + 1;

  return {
    ...prev,
    data,
    meta: { ...prev.meta, total, pages: Math.ceil(total / prev.meta.limit) },
  };
}
///=====>
// qk helpers
export type SucursalFilter = { sucursalId?: number };

export function matchesSucursalBy<T>(
  item: T,
  keyPart?: SucursalFilter,
  selectSucursalId?: (t: T) => number | null | undefined
) {
  if (!keyPart?.sucursalId) return true; // sin filtro => aplica a todas
  const sid = selectSucursalId?.(item);
  return sid != null && Number(sid) === Number(keyPart.sucursalId);
}

// Para casos donde puede pertenecer a origen o destino (transferencias)
export function matchesSucursalEitherBy<T>(
  item: T,
  keyPart?: SucursalFilter,
  selectA?: (t: T) => number | null | undefined, // p. ej. deSucursal
  selectB?: (t: T) => number | null | undefined // p. ej. aSucursal
) {
  if (!keyPart?.sucursalId) return true;
  const a = selectA?.(item);
  const b = selectB?.(item);
  const target = Number(keyPart.sucursalId);
  return (
    (a != null && Number(a) === target) || (b != null && Number(b) === target)
  );
}
