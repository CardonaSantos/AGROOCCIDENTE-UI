// ventasKeys historial.ts
export const ventasHistorialKeys = {
  all: ["ventas"] as const,
  lists: () => [...ventasHistorialKeys.all, "list"] as const,
  listSucursal: (sucursalId: number, params?: Record<string, any>) =>
    [...ventasHistorialKeys.lists(), "sucursal", sucursalId, params] as const,
  detail: (ventaId: number) =>
    [...ventasHistorialKeys.all, "detail", ventaId] as const,
};
