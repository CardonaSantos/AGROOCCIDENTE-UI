// Pages/Categorias/CategoriasMainPage.tsx
"use client";
import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, RefreshCw, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import { PageHeader } from "@/utils/components/PageHeaderPos";
// =================== Tipos & QKs ===================
export type Categoria = { id: number; nombre: string };
export type CategoriaWithCount = {
  id: number;
  nombre: string;
  productosCount: number;
};

export const CATS_LIST_QK = ["categorias", "with-count"] as const;
// Si luego necesitas detalle:
// export const CAT_DETAIL_QK = (id: number) => ["categorias", "by-id", id] as const;

// Centraliza la invalidación
export function invalidateCategorias(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: CATS_LIST_QK });
}

// =================== Página ===================
export default function CategoriasMainPage() {
  const qc = useQueryClient();

  // ---- State para formulario ----
  const [nombre, setNombre] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // ---- State para eliminación ----
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  // ---- GET: lista con conteo ----
  const {
    data: categorias,
    isLoading,
    refetch,
  } = useApiQuery<CategoriaWithCount[]>(
    CATS_LIST_QK,
    "/categoria/all-cats-with-counts",
    undefined,
    {
      staleTime: 0,
      refetchOnMount: "always",
    }
  );

  // ---- POST: crear ----
  const createMut = useApiMutation<Categoria, { nombre: string }>(
    "post",
    "/categoria",
    undefined,
    {
      onSuccess: () => {
        setNombre("");
        invalidateCategorias(qc);
      },
      onError: (e: any) => toast.error(e?.message ?? "Error al crear"),
    }
  );

  // ---- PATCH: editar (endpoint depende del id actual en edición) ----
  const updateEndpoint = useMemo(
    () =>
      editingId
        ? `/categoria/edit-category/${editingId}`
        : "/categoria/edit-category/_",
    [editingId]
  );

  const updateMut = useApiMutation<Categoria, { nombre: string }>(
    "patch",
    updateEndpoint,
    undefined,
    {
      onSuccess: () => {
        setNombre("");
        setEditingId(null);
        invalidateCategorias(qc);
      },
      onError: (e: any) => toast.error(e?.message ?? "Error al actualizar"),
    }
  );

  // ---- DELETE: eliminar (endpoint depende del id a eliminar) ----
  const deleteEndpoint = useMemo(
    () => (deletingId ? `/categoria/${deletingId}` : "/categoria/_"),
    [deletingId]
  );

  const deleteMut = useApiMutation<any, void>(
    "delete",
    deleteEndpoint,
    undefined,
    {
      onSuccess: () => {
        toast.success("Categoría eliminada");
        setDeletingId(null);
        setOpenConfirmDelete(false);
        invalidateCategorias(qc);
      },
      onError: (e: any) => toast.error(e?.message ?? "Error al eliminar"),
    }
  );

  // ---- DELETE ALL ----
  const deleteAllMut = useApiMutation<any, void>(
    "delete",
    "/categoria/delete-all",
    undefined,
    {
      onSuccess: () => {
        toast.success("Todas las categorías eliminadas");
        invalidateCategorias(qc);
      },
      onError: (e: any) => toast.error(e?.message ?? "Error al eliminar todo"),
    }
  );

  // ---- Handlers ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return toast.warning("Escribe un nombre");

    if (editingId) {
      await toast.promise(updateMut.mutateAsync({ nombre: nombre.trim() }), {
        loading: "Actualizando...",
        success: "Actualizada",
        error: "No se pudo actualizar",
      });
    } else {
      await toast.promise(createMut.mutateAsync({ nombre: nombre.trim() }), {
        loading: "Creando...",
        success: "Creada",
        error: "No se pudo crear",
      });
    }
  };

  const startEdit = (cat: CategoriaWithCount) => {
    setEditingId(cat.id);
    setNombre(cat.nombre);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNombre("");
  };

  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setOpenConfirmDelete(true);
  };

  const onDelete = async () => {
    if (!deletingId) return;
    await toast.promise(deleteMut.mutateAsync(), {
      loading: "Eliminando...",
      success: "Eliminada",
      error: "No se pudo eliminar",
    });
  };

  const onDeleteAll = async () => {
    await toast.promise(deleteAllMut.mutateAsync(), {
      loading: "Eliminando todas...",
      success: "Limpieza completa",
      error: "No se pudo eliminar todo",
    });
  };
  console.log("las cats son: ", categorias);

  // ---- UI ----
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <PageHeader title="Categorías" fallbackBackTo="/" sticky={false} />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulario */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingId ? "Editar categoría" : "Crear categoría"}
            </CardTitle>
            <CardDescription>
              {editingId
                ? "Modifica el nombre y guarda los cambios."
                : "Agrega una nueva categoría al catálogo."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              aria-label="Formulario de categoría"
            >
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Accesorios"
                  required
                  aria-required="true"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto">
                  {editingId ? (
                    "Guardar cambios"
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" /> Crear
                    </span>
                  )}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEdit}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => refetch()}
              aria-label="Refrescar lista"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refrescar
            </Button>
            <Button variant="destructive" onClick={onDeleteAll}>
              Eliminar todas
            </Button>
          </CardFooter>
        </Card>

        {/* Listado */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Categorías</CardTitle>
            <CardDescription>
              {isLoading ? "Cargando..." : `Total: ${categorias?.length ?? 0}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {(categorias ?? []).map((cat) => (
                <li
                  key={cat.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <Package className="h-5 w-5 shrink-0" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{cat.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {cat.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      aria-label={`Productos relacionados: ${cat.productosCount}`}
                    >
                      {cat.productosCount} productos
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(cat)}
                      aria-label={`Editar ${cat.nombre}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => confirmDelete(cat.id)}
                      aria-label={`Eliminar ${cat.nombre}`}
                      disabled={false}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
              {!isLoading && (categorias?.length ?? 0) === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  No hay categorías registradas.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Confirmación de borrado */}
      <Dialog
        open={openConfirmDelete}
        onOpenChange={(o) => {
          setOpenConfirmDelete(o);
          if (!o) setDeletingId(null);
        }}
      >
        <DialogContent role="alertdialog" aria-describedby="delete-cat-desc">
          <DialogHeader>
            <DialogTitle>¿Eliminar esta categoría?</DialogTitle>
            <DialogDescription id="delete-cat-desc">
              Esta acción no se puede deshacer. Si la categoría tiene productos
              relacionados, podrías perder referencias.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setDeletingId(null)}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
