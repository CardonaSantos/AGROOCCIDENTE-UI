// src/Pages/CuentasBancarias/CuentasBancariasPage.tsx
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DataTable } from "./_components/data-table";
import { buildColumns } from "./_components/columns";
import {
  useCuentasBancarias,
  useCuentaBancariaMutations,
} from "./API/useCuentasBancarias";
import { ConfirmDialog } from "./_components/ConfirmDialog";
import { useDebouncedValue } from "./useDebouncedValue";
import {
  CuentaBancariaResumen,
  CuentaCreatePayload,
} from "./Interfaces/CuentaBancariaResumen";
import { PaginationBar } from "./_components/PaginationBar";
import { CuentaFormDialog } from "./_components/CreateEditCuentaDialog";
import { useApiMutation } from "@/hooks/genericoCall/genericoCallHook";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/utils/components/PageHeaderPos";

export default function CuentasBancariasPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 450);
  const [incluirInactivas, setIncluirInactivas] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const params = useMemo(
    () => ({ page, limit, search: debouncedSearch, incluirInactivas }),
    [page, limit, debouncedSearch, incluirInactivas]
  );
  const { data, isLoading } = useCuentasBancarias(params);
  const mut = useCuentaBancariaMutations(params);
  // dialogs
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<CuentaBancariaResumen | null>(null);

  const [openToggle, setOpenToggle] = useState(false);
  const [rowToToggle, setRowToToggle] = useState<CuentaBancariaResumen | null>(
    null
  );

  const [openDelete, setOpenDelete] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<CuentaBancariaResumen | null>(
    null
  );

  const columns = useMemo(
    () =>
      buildColumns({
        onView: () => {
          /* futuro: navegar a detalle */
        },
        onEdit: (row) => {
          setEditing(row);
          setOpenForm(true);
        },
        onToggle: (row) => {
          setRowToToggle(row);
          setOpenToggle(true);
        },
        onDelete: (row) => {
          setRowToDelete(row);
          setOpenDelete(true);
        },
      }),
    []
  );

  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({
      // invalida TODAS las keys que empiezan con "cuentas-bancarias-resumen"
      predicate: (q) =>
        Array.isArray(q.queryKey) &&
        q.queryKey[0] === "cuentas-bancarias-resumen",
    });

  // ---------- MUTATIONS: una por operación (endpoint explícito) ----------
  const crearCuenta = useApiMutation<any, CuentaCreatePayload>(
    "post",
    "cuentas-bancarias",
    undefined,
    {
      onSuccess: () => {
        toast.success("Cuenta creada");
        invalidate();
      },
    }
  );

  // nota: el endpoint usa el id del registro que estés editando AHORA
  const actualizarCuenta = useApiMutation<any, CuentaCreatePayload>(
    "patch",
    editing ? `cuentas-bancarias/${editing.id}` : "cuentas-bancarias/__noop__",
    undefined,
    {
      onSuccess: () => {
        toast.success("Cuenta actualizada");
        invalidate();
      },
    }
  );

  // activar / desactivar usan el row seleccionado AHORA
  const activarCuenta = useApiMutation<any, void>(
    "patch",
    rowToToggle
      ? `cuentas-bancarias/${rowToToggle.id}/activar`
      : "cuentas-bancarias/__noop__",
    undefined,
    {
      onSuccess: () => {
        toast.success("Cuenta activada");
        invalidate();
      },
    }
  );

  const desactivarCuenta = useApiMutation<any, void>(
    "patch",
    rowToToggle
      ? `cuentas-bancarias/${rowToToggle.id}/desactivar`
      : "cuentas-bancarias/__noop__",
    undefined,
    {
      onSuccess: () => {
        toast.success("Cuenta desactivada");
        invalidate();
      },
    }
  );

  const eliminarCuenta = useApiMutation<any, void>(
    "delete",
    rowToDelete
      ? `cuentas-bancarias/${rowToDelete.id}`
      : "cuentas-bancarias/__noop__",
    undefined,
    {
      onSuccess: () => {
        toast.success("Cuenta eliminada");
        invalidate();
      },
    }
  );

  // ---------- HANDLERS ----------
  const onSubmitForm = async (payload: CuentaCreatePayload) => {
    try {
      if (editing) {
        await actualizarCuenta.mutateAsync(payload);
      } else {
        await crearCuenta.mutateAsync(payload);
      }
      setOpenForm(false);
      setEditing(null);
    } catch {
      // el toast del hook ya muestra el error
    }
  };

  const onConfirmToggle = async () => {
    if (!rowToToggle) return;
    try {
      if (rowToToggle.activa) {
        await desactivarCuenta.mutateAsync(undefined);
      } else {
        await activarCuenta.mutateAsync(undefined);
      }
      setOpenToggle(false);
      setRowToToggle(null);
    } catch {}
  };

  const onConfirmDelete = async () => {
    if (!rowToDelete) return;
    try {
      await eliminarCuenta.mutateAsync(undefined);
      setOpenDelete(false);
      setRowToDelete(null);
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* header */}
      <PageHeader
        title="Cuenta Bancaria"
        subtitle="Administre sus cuentas bancarias"
        sticky={false}
        fallbackBackTo="/"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Nueva cuenta
        </Button>
      </div>

      {/* filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Input
          className="w-full sm:w-80"
          placeholder="Buscar banco, número o alias..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={incluirInactivas}
            onChange={(e) => {
              setIncluirInactivas(e.target.checked);
              setPage(1);
            }}
          />
          Incluir inactivas
        </label>
      </div>

      {/* tabla */}
      {isLoading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <DataTable columns={columns} data={data?.items ?? []} />
          <PaginationBar
            page={params.page}
            limit={params.limit}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </>
      )}

      {/* dialogs */}
      <CuentaFormDialog
        open={openForm}
        onOpenChange={(v) => {
          setOpenForm(v);
          if (!v) setEditing(null);
        }}
        initial={editing}
        onSubmit={onSubmitForm}
        loading={mut.crear.isPending || (mut as any).actualizar?.isPending}
      />

      <ConfirmDialog
        open={openToggle}
        onOpenChange={setOpenToggle}
        title={rowToToggle?.activa ? "Desactivar cuenta" : "Activar cuenta"}
        description={
          rowToToggle?.activa
            ? "La cuenta dejará de estar disponible para operaciones. El histórico se conserva."
            : "La cuenta quedará activa para operaciones."
        }
        confirmLabel={rowToToggle?.activa ? "Desactivar" : "Activar"}
        loading={false}
        onConfirm={onConfirmToggle}
      />

      <ConfirmDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="Eliminar cuenta"
        description="Esta acción es permanente y solo es posible si la cuenta no tiene movimientos."
        confirmLabel="Eliminar"
        loading={false}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
