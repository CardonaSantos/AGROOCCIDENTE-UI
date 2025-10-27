// src/features/tipos-presentaciones/TiposPresentaciones.tsx
"use client";
import React from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

// UI (shadcn)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// Icons
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Search,
  Loader2,
} from "lucide-react";
import {
  useCreateTipoPresentacion,
  useHardDeleteTipoPresentacion,
  useRestoreTipoPresentacion,
  useSoftDeleteTipoPresentacion,
  useTiposPresentacion,
  useUpdateTipoPresentacion,
} from "./API/api";
import {
  CreateTipoPresentacionInput,
  TipoPresentacion,
  TipoPresentacionQuery,
} from "./Interfaces/tiposPresentaciones.interfaces";
import { PageHeader } from "@/utils/components/PageHeaderPos";

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return (
    <Badge variant={activo ? "default" : "secondary"}>
      {activo ? "Activo" : "Inactivo"}
    </Badge>
  );
}

type FormState = {
  nombre: string;
  descripcion: string;
  activo: boolean;
};

function useTipoForm(initial?: Partial<FormState>) {
  const [values, setValues] = React.useState<FormState>({
    nombre: initial?.nombre ?? "",
    descripcion: initial?.descripcion ?? "",
    activo: initial?.activo ?? true,
  });

  React.useEffect(() => {
    setValues({
      nombre: initial?.nombre ?? "",
      descripcion: initial?.descripcion ?? "",
      activo: initial?.activo ?? true,
    });
  }, [initial?.nombre, initial?.descripcion, initial?.activo]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  return { values, set };
}

function TipoFormDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial?: TipoPresentacion | null;
  onSubmit: (payload: CreateTipoPresentacionInput) => Promise<void>;
}) {
  const { open, onOpenChange, mode, initial, onSubmit } = props;
  const { values, set } = useTipoForm({
    nombre: initial?.nombre,
    descripcion: initial?.descripcion ?? "",
    activo: initial?.activo ?? true,
  });
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateTipoPresentacionInput = {
      nombre: values.nombre.trim(),
      descripcion: values.descripcion.trim() || undefined,
      activo: values.activo,
    };
    if (!payload.nombre) {
      toast.error("El nombre es obligatorio");
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(payload);
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error al guardar el tipo de presentación";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {mode === "create"
              ? "Crear tipo de presentación"
              : "Editar tipo de presentación"}
          </DialogTitle>
          <DialogDescription>
            Define un nombre único y, opcionalmente, una descripción.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Ej. BOTELLA, CAJA, BLISTER…"
              value={values.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              placeholder="Opcional"
              value={values.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <Label htmlFor="activo">Activo</Label>
              <p className="text-xs text-muted-foreground">
                Si lo desactivas, no podrá seleccionarse en nuevas
                presentaciones.
              </p>
            </div>
            <Switch
              id="activo"
              checked={values.activo}
              onCheckedChange={(v) => set("activo", v)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Crear" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => Promise<void>;
}) {
  const {
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmText,
    variant,
  } = props;
  const [loading, setLoading] = React.useState(false);

  async function handle() {
    try {
      setLoading(true);
      await onConfirm();
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Ocurrió un error";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handle} variant={variant ?? "default"}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText ?? "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TiposPresentaciones() {
  // ----- Filtros / Estado local -----
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [activo, setActivo] = React.useState<"all" | "true" | "false">("all");

  const debouncedSetSearch = useDebouncedCallback((v: string) => {
    setPage(1);
    setSearch(v);
  }, 400);

  const params: TipoPresentacionQuery = {
    page,
    limit,
    q: search || undefined,
    activo: activo === "all" ? undefined : activo === "true",
  };

  const { data, isLoading, isError, error } = useTiposPresentacion(params);

  // ----- Crear / Editar -----
  const [openForm, setOpenForm] = React.useState(false);
  const [editRow, setEditRow] = React.useState<TipoPresentacion | null>(null);

  const createMut = useCreateTipoPresentacion();
  const updateMut = useUpdateTipoPresentacion(editRow?.id ?? 0);

  async function handleCreate(payload: CreateTipoPresentacionInput) {
    await createMut.mutateAsync(payload);
    toast.success("Tipo de presentación creado");
  }
  async function handleEdit(payload: CreateTipoPresentacionInput) {
    if (!editRow) return;
    await updateMut.mutateAsync(payload);
    toast.success("Tipo de presentación actualizado");
  }

  // ----- Soft delete / Restore / Hard delete -----
  const [openConfirm, setOpenConfirm] = React.useState<{
    type: "soft" | "restore" | "hard";
    row: TipoPresentacion | null;
  }>({ type: "soft", row: null });

  const softMut = useSoftDeleteTipoPresentacion(openConfirm.row?.id ?? 0);
  const restoreMut = useRestoreTipoPresentacion(openConfirm.row?.id ?? 0);
  const hardMut = useHardDeleteTipoPresentacion(openConfirm.row?.id ?? 0);

  async function doConfirm() {
    const row = openConfirm.row!;
    if (openConfirm.type === "soft") {
      await softMut.mutateAsync();
      toast.success(`"${row.nombre}" desactivado`);
    } else if (openConfirm.type === "restore") {
      await restoreMut.mutateAsync();
      toast.success(`"${row.nombre}" reactivado`);
    } else {
      await hardMut.mutateAsync();
      toast.success(`"${row.nombre}" eliminado definitivamente`);
    }
  }

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <PageHeader
        title="Tipos de presentación"
        subtitle="
      Catálogo flexible para empaques/presentaciones (BOTELLA, CAJA, BLISTER, etc.)"
        sticky={false}
        fallbackBackTo="/"
      />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2 justify-end">
          <Dialog
            open={openForm}
            onOpenChange={(v) => {
              setOpenForm(v);
              if (!v) setEditRow(null);
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo tipo
              </Button>
            </DialogTrigger>
            <TipoFormDialog
              open={openForm}
              onOpenChange={(v) => {
                setOpenForm(v);
                if (!v) setEditRow(null);
              }}
              mode={editRow ? "edit" : "create"}
              initial={editRow}
              onSubmit={editRow ? handleEdit : handleCreate}
            />
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por nombre o descripción…"
            onChange={(e) => debouncedSetSearch(e.target.value)}
          />
        </div>

        <Select
          value={activo}
          onValueChange={(v: "all" | "true" | "false") => {
            setPage(1);
            setActivo(v);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={String(limit)}
          onValueChange={(v) => {
            setPage(1);
            setLimit(Number(v));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Ítems por página" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {[10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} por página
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">
                Descripción
              </TableHead>
              <TableHead className="hidden md:table-cell">Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Creado</TableHead>
              <TableHead className="w-[1%] text-right pr-4">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Cargando…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-destructive"
                >
                  {(error as any)?.message ?? "Error al cargar datos"}
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-muted-foreground"
                >
                  No hay resultados
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{row.nombre}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {row.descripcion ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <EstadoBadge activo={row.activo} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-muted-foreground">
                      {formatDate(row.fechas.creadoISO)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Editar"
                        onClick={() => {
                          setEditRow(row);
                          setOpenForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {row.activo ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Desactivar"
                          onClick={() => setOpenConfirm({ type: "soft", row })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Restaurar"
                          onClick={() =>
                            setOpenConfirm({ type: "restore", row })
                          }
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}

                      {!row.activo && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Eliminar definitivo"
                          onClick={() => setOpenConfirm({ type: "hard", row })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <p className="text-sm text-muted-foreground">
          Página {meta?.page ?? 1} de {meta?.pages ?? 1} • {meta?.total ?? 0}{" "}
          tipos
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={(meta?.page ?? 1) <= 1 || isLoading}
          >
            Anterior
          </Button>
          <Button
            onClick={() => setPage((p) => Math.min(meta?.pages ?? 1, p + 1))}
            disabled={(meta?.page ?? 1) >= (meta?.pages ?? 1) || isLoading}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Confirmaciones */}
      <ConfirmDialog
        open={!!openConfirm.row}
        onOpenChange={(v) => !v && setOpenConfirm((s) => ({ ...s, row: null }))}
        title={
          openConfirm.type === "soft"
            ? "Desactivar tipo"
            : openConfirm.type === "restore"
            ? "Reactivar tipo"
            : "Eliminar definitivamente"
        }
        description={
          openConfirm.type === "hard"
            ? "Esta acción no se puede deshacer."
            : undefined
        }
        confirmText={
          openConfirm.type === "soft"
            ? "Desactivar"
            : openConfirm.type === "restore"
            ? "Reactivar"
            : "Eliminar"
        }
        variant={openConfirm.type === "hard" ? "destructive" : "default"}
        onConfirm={doConfirm}
      />
    </div>
  );
}
