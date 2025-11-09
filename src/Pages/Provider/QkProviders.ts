// Endpoints centralizados
export const EP = {
  LIST: "/proveedor/get-complete-providers",
  CREATE: "/proveedor",
  UPDATE: (id: number) => `/proveedor/edit-provider/${id}`,
} as const;

// Query Keys centralizados
export const QK = {
  PROVEEDORES: ["proveedores", "list"] as const,
};
