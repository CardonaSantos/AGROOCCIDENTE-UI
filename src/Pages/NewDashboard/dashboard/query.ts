//CREDITOS Y OTROS
export const AUTH_BASE_KEY = "credit-authorizations" as const;
export const AUTH_FILTERS = { estado: "PENDIENTE" } as const;
export const AUTH_QK = (filters = AUTH_FILTERS) =>
  [AUTH_BASE_KEY, filters] as const;

export const AUTH_KEY = ["credit-authorizations", AUTH_FILTERS] as const;
export const CREDIT_QK = ["credits", "simple-dashboard"] as const; // más explícita
//OTROS PARA SOCKETS

////
export const PRICE_REQUESTS_BASE_KEY = "price-requests" as const;
export const PRICE_REQUESTS_QK = (sucursalId?: number) =>
  [PRICE_REQUESTS_BASE_KEY, { sucursalId }] as const;

export const TRANSFER_REQUESTS_BASE_KEY = "transfer-requests" as const;
export const TRANSFER_REQUESTS_QK = (sucursalId?: number) =>
  [TRANSFER_REQUESTS_BASE_KEY, { sucursalId }] as const;
