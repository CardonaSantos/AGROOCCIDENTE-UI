// RequisitionBuilder.tsx (refactor)
"use client";

import React from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  AlertTriangle,
  LoaderCircle,
  Package,
  ShoppingCart,
} from "lucide-react";

import { useStore } from "@/components/Context/ContextSucursal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { formattMoneda } from "../Utils/Utils";

import RequisitionCandidatesTable from "./RequisitionCandidatesTable";
import {
  useRequisitionCandidatesQuery,
  useCreateRequisitionMutation,
  CreateRequisitionDto,
  CreateRequisitionLine,
} from "./requisicion.queries";
import {
  PagedResponse,
  RequisitionProductCandidate,
  SelectedKey,
  SelectedLine,
} from "./newMap/requisicion.interfaces";
import RequisicionesList from "./newMap/mapRequisiciones";

dayjs.extend(utc);
dayjs.extend(timezone);

const PAGE_SIZE = 10;

export default function RequisitionBuilder() {
  const sucursalId = useStore((s) => s.sucursalId) ?? 0;
  const usuarioId = useStore((s) => s.userId) ?? 0;
  // UI state
  const [openGenerateReq, setOpenGenerateReq] = React.useState(false);
  const [selected, setSelected] = React.useState<
    Record<SelectedKey, SelectedLine>
  >({});
  const [q, setQ] = React.useState("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Server-side sorting
  const sortBy = sorting[0]?.id ?? "priority";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  // Query: candidatos (builder)
  const { data, isLoading, refetch, isRefetching } =
    useRequisitionCandidatesQuery(
      sucursalId,
      {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        q,
        sortBy,
        sortDir,
      },
      { enabled: !!sucursalId }
    );

  // Métricas de selección
  const selectedCount = Object.keys(selected).length;
  const totalSelectedQty = Object.values(selected).reduce(
    (acc, s) => acc + (s.cantidad || 0),
    0
  );
  const totalSelectedCost = Object.values(selected).reduce((acc, s) => {
    const unit = Number(s.precioCostoUnitario || "0");
    return acc + unit * (s.cantidad || 0);
  }, 0);

  // Mutación: crear requisición
  const createMutation = useCreateRequisitionMutation();
  console.log("Las selected son: ", selected);

  const handleCreate = async () => {
    if (!usuarioId || !sucursalId) {
      toast.error("Faltan datos de usuario/sucursal");
      return;
    }
    if (selectedCount === 0) return;

    const lineas: CreateRequisitionLine[] = Object.values(selected).map((s) => {
      const base = {
        cantidadSugerida: s.cantidad,
        fechaExpiracion: s.fechaExpiracion,
        precioCostoUnitario: s.precioCostoUnitario,
        actualizarCosto: s.actualizarCosto || false,
      };
      return s.scope === "PRODUCTO"
        ? { ...base, productoId: s.productoId! }
        : { ...base, presentacionId: s.presentacionId! };
    });

    const dto: CreateRequisitionDto = { sucursalId, usuarioId, lineas };
    console.log("El dto generado es: ", dto);

    try {
      await createMutation.mutateAsync(dto);
      toast.success("Requisición creada");
      setSelected({});
      setOpenGenerateReq(false);
      refetch();
    } catch {
      toast.error("Error al crear la requisición");
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="requisiciones" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requisiciones">Requisiciones</TabsTrigger>
          <TabsTrigger value="generar">Generar Requisición</TabsTrigger>
        </TabsList>

        {/* TAB 1: Registros (por defecto) */}
        <TabsContent value="requisiciones">
          <RequisicionesList />
        </TabsContent>

        {/* TAB 2: Builder para generar requisición */}
        <TabsContent value="generar">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-base font-semibold">
                      {data?.total ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Productos listados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-base font-semibold">{selectedCount}</p>
                    <p className="text-xs text-muted-foreground">
                      Líneas seleccionadas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-base font-semibold">
                      {totalSelectedQty}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Unidades a solicitar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-base font-semibold">
                      {formattMoneda(totalSelectedCost)}
                    </p>
                    <p className="text-xs text-muted-foreground">Costo total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>Selecciona productos o presentaciones</span>
              </CardTitle>
              <CardDescription>
                Búsqueda y paginación del lado del servidor. Puedes editar{" "}
                <em>cantidad</em>, <em>fecha de expiración</em> y{" "}
                <em>precio costo</em> antes de generar la requisición.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <RequisitionCandidatesTable
                data={
                  data as PagedResponse<RequisitionProductCandidate> | undefined
                }
                isLoading={isLoading || isRefetching}
                pagination={pagination}
                onPaginationChange={setPagination}
                sorting={sorting}
                onSortingChange={setSorting}
                q={q}
                onSearchChange={(val) => {
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                  setQ(val);
                }}
                refetch={refetch}
                selected={selected}
                setSelected={setSelected}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelected({})}
              disabled={selectedCount === 0}
            >
              Limpiar selección
            </Button>

            <Button
              type="button"
              disabled={createMutation.isPending || selectedCount === 0}
              onClick={() => setOpenGenerateReq(true)}
              aria-busy={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  Generando… <LoaderCircle className="animate-spin ml-2" />
                </>
              ) : (
                "Generar requisición"
              )}
            </Button>
          </div>

          {/* Confirmación generar requisición */}
          <AdvancedDialog
            title="¿Generar requisición?"
            description="Se creará la requisición con las líneas seleccionadas (producto o presentación)."
            onOpenChange={setOpenGenerateReq}
            open={openGenerateReq}
            icon="alert"
            type="info"
            confirmButton={{
              label: "Sí, generar",
              disabled: createMutation.isPending,
              loading: createMutation.isPending,
              loadingText: "Generando...",
              onClick: handleCreate,
            }}
            cancelButton={{
              label: "Cancelar",
              onClick: () => setOpenGenerateReq(false),
              disabled: createMutation.isPending,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
