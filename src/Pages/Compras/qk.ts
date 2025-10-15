// qk.ts
export const qk = {
  creditoFromCompra: (compraId: number) =>
    ["credito-from-compra", compraId] as const,
  compra: (compraId: number) => ["compra", compraId] as const,
  compraRecepcionable: (compraId: number) =>
    ["compra-recepcionable", compraId] as const,
};
