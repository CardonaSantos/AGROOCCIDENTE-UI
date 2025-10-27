// src/types/tipo-presentacion.ts
export type TipoPresentacion = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fechas: {
    creadoISO: string;
    actualizadoISO: string;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type SingleResponse<T> = {
  data: T;
};

export type MessageResponse<T> = {
  message: string;
  data: T;
};

// Query params del GET /tipo-presentacion
export type TipoPresentacionQuery = {
  page?: number;
  limit?: number;
  q?: string;
  activo?: boolean;
};

// Payloads para crear/editar
export type CreateTipoPresentacionInput = {
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
};

export type UpdateTipoPresentacionInput = Partial<CreateTipoPresentacionInput>;
