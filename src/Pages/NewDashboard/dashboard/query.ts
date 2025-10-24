const AUTH_FILTERS = { estado: "PENDIENTE" } as const;
export const AUTH_KEY = ["credit-authorizations", AUTH_FILTERS] as const;
export const CREDIT_QK = ["credits", "simple-dashboard"] as const; // más explícita
