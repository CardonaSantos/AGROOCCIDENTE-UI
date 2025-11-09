export interface ProveedorType {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  direccion?: string | null;
  razonSocial?: string | null;
  rfc?: string | null;
  nombreContacto?: string | null;
  telefonoContacto?: string | null;
  emailContacto?: string | null;
  pais?: string | null;
  ciudad?: string | null;
  codigoPostal?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  activo: boolean;
  notas?: string | null;
}
export const place = (p?: string | null, c?: string | null) =>
  [p, c].filter(Boolean).join(" · ");
export type ProveedorFormData = {
  nombre: string;
  correo: string;
  telefono: string;
  direccion?: string;
  razonSocial?: string;
  rfc?: string;
  nombreContacto?: string;
  telefonoContacto?: string;
  emailContacto?: string;
  pais?: string;
  ciudad?: string;
  codigoPostal?: string;
  activo: boolean;
  notas?: string;
};
