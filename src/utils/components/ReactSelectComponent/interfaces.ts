export type Primitive = string | number;

export type OptionOf<T> = {
  value: Primitive; // clave id o code
  label: string; //lo que muestra el select
  raw: T; // objeto crudo original
};
