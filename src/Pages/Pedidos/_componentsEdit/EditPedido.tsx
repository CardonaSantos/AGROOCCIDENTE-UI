// /Pages/Pedidos/EditPedido.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Trash2, Plus } from "lucide-react";

import { useStore } from "@/components/Context/ContextSucursal";
import useClientesSelect from "@/hooks/getClientsSelect/use-get-clients-to-select";
import useGetSucursales from "@/hooks/getSucursales/use-sucursales";
import { useProductosToPedidos } from "@/hooks/getProductosToPedidos/useProductosToPedidos";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactSelect from "react-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { getApiErrorMessageAxios } from "@/Pages/Utils/UtilsErrorApi";
import {
  PedidoLinea,
  PedidoPrioridad,
  TipoPedido,
} from "../Interfaces/createPedido.interfaces";
// import ProductsList from "../_components/ProductsList";
import {
  getPedidoDetalle,
  patchPedido,
  PedidoDetalle,
  PedidoUpdate,
} from "./pedidoEdit";

type Option = { label: string; value: string };
type EditLinea = PedidoLinea & {
  nombre?: string;
  codigoProducto?: string;
  precioCostoActual?: number;
  showNota?: boolean; // flag de UI
};

export default function EditPedido() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const pedidoId = Number(id) || 0;

  const sucursalIDStore = useStore((s) => s.sucursalId) ?? 0;

  // --- fetch pedido ---
  const {
    data: pedido,
    isLoading: pedidoLoading,
    isError: pedidoError,
    refetch: refetchPedido,
  } = useQuery<PedidoDetalle>({
    queryKey: ["pedido-detalle", pedidoId],
    queryFn: () => getPedidoDetalle(pedidoId),
    enabled: pedidoId > 0,
  });

  // --- selects auxiliares ---
  const { data: clientes } = useClientesSelect({});
  const { data: sucursales } = useGetSucursales();

  const clientesOptions: Option[] = useMemo(
    () =>
      (clientes ?? []).map((c) => ({
        value: String(c.id),
        label: `${c.nombre} ${c.apellidos ?? ""}`.trim(),
      })),
    [clientes]
  );

  const sucursalesOptions: Option[] = useMemo(
    () =>
      (sucursales ?? []).map((s) => ({
        value: String(s.id),
        label: s.nombre,
      })),
    [sucursales]
  );

  // --- productos buscables para agregar ---
  const [search, setSearch] = useState("");
  const [pageProd, setPageProd] = useState(1);
  const pageSizeProd = 10;
  console.log(setSearch);

  const {
    data: productosResp,
    // isFetching: productosFetching
  } = useProductosToPedidos({
    page: pageProd,
    pageSize: pageSizeProd,
    search,
  });
  const productos = productosResp?.data ?? [];

  // --- estado editable ---
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [prioridad, setPrioridad] = useState<PedidoPrioridad>(
    PedidoPrioridad.MEDIA
  );
  const [tipo, setTipo] = useState<TipoPedido>(TipoPedido.INTERNO);
  const [observaciones, setObservaciones] = useState<string>("");
  const [lineas, setLineas] = useState<EditLinea[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // precargar datos cuando llegue el pedido
  useEffect(() => {
    if (!pedido) return;
    setClienteId(pedido.clienteId);
    setSucursalId(pedido.sucursalId || sucursalIDStore);
    setPrioridad(pedido.prioridad);
    setTipo(pedido.tipo);
    setObservaciones(pedido.observaciones ?? "");
    setLineas(
      (pedido.lineas ?? []).map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad,
        precioCostoActual:
          l.precioCostoActual !== undefined
            ? l.precioCostoActual
            : l.producto?.precioCostoActual ?? 0,
        nombre: l.producto?.nombre,
        codigoProducto: l.producto?.codigoProducto,
        notas: l.notas ?? "",
        showNota: !!l.notas,
      }))
    );
  }, [pedido, sucursalIDStore]);

  // helpers selección
  const selectedLines = useMemo(
    () =>
      lineas.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
    [lineas]
  );

  const toggle = (checked: boolean, productId: number) => {
    setLineas((prev) => {
      if (checked) {
        if (prev.some((l) => l.productoId === productId)) return prev;
        const p = productos.find((pp) => pp.id === productId);
        return [
          ...prev,
          {
            productoId: productId,
            cantidad: 1,
            precioCostoActual: p?.precioCostoActual ?? 0,
            nombre: p?.nombre,
            codigoProducto: p?.codigoProducto,
            notas: "",
            showNota: false,
          },
        ];
      }
      return prev.filter((l) => l.productoId !== productId);
    });
  };

  const changeQty = (productId: number, qty: number) => {
    setLineas((prev) =>
      prev.map((l) =>
        l.productoId === productId ? { ...l, cantidad: qty } : l
      )
    );
  };

  console.log("funciones sin usar aun: ", selectedLines, toggle, changeQty);

  const removeLine = (productId: number) => {
    setLineas((prev) => prev.filter((l) => l.productoId !== productId));
  };

  const totals = useMemo(() => {
    const sum = lineas.reduce(
      (acc, l) => acc + (l.precioCostoActual ?? 0) * l.cantidad,
      0
    );
    return { items: lineas.length, total: sum };
  }, [lineas]);

  // --- mutation actualizar ---
  const updateMut = useMutation({
    mutationFn: (body: PedidoUpdate) => patchPedido(pedidoId, body),
  });

  const handleUpdate = async () => {
    if (!sucursalId) {
      toast.info("Seleccione una sucursal");
      return;
    }
    if (lineas.length === 0) {
      toast.info("El pedido debe tener al menos un producto");
      return;
    }

    const body: PedidoUpdate = {
      sucursalId,
      clienteId: tipo === TipoPedido.CLIENTE ? clienteId : null,
      prioridad,
      tipo,
      observaciones: observaciones?.trim() || undefined,
      lineas: lineas.map(
        ({ productoId, cantidad, precioCostoActual, notas }) => ({
          productoId,
          cantidad,
          precioCostoActual,
          notas: notas?.trim() || null,
        })
      ),
    };

    try {
      setIsUpdating(true);
      await updateMut.mutateAsync(body);
      toast.success("Pedido actualizado");
      await refetchPedido();
    } catch (err) {
      toast.error(getApiErrorMessageAxios(err));
    } finally {
      setIsUpdating(false);
    }
  };

  if (pedidoLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando pedido…
      </div>
    );
  }

  if (pedidoError || !pedido) {
    return <p className="text-red-600">No se pudo cargar el pedido.</p>;
  }

  const prioridadesOptions = Object.values(PedidoPrioridad).map((p) => ({
    value: p,
    label: p,
  }));
  const tiposOptions = Object.values(TipoPedido).map((t) => ({
    value: t,
    label: t,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <h2 className="text-lg font-semibold">Editar Pedido #{pedido.folio}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Datos principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Tipo de pedido */}
            <div className="space-y-1">
              <Label>Tipo de Pedido</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as TipoPedido)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo de pedido" />
                </SelectTrigger>
                <SelectContent>
                  {tiposOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridad */}
            <div className="space-y-1">
              <Label>Prioridad</Label>
              <Select
                value={prioridad}
                onValueChange={(v) => setPrioridad(v as PedidoPrioridad)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {prioridadesOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sucursal */}
            <div className="space-y-1">
              <Label>Sucursal</Label>
              <ReactSelect
                className="text-black text-sm"
                options={sucursalesOptions}
                value={
                  sucursalId
                    ? {
                        value: String(sucursalId),
                        label:
                          sucursalesOptions.find(
                            (s) => Number(s.value) === sucursalId
                          )?.label ?? "",
                      }
                    : null
                }
                onChange={(opt) =>
                  setSucursalId(opt ? Number(opt.value) : null)
                }
                isClearable
                placeholder="Seleccione sucursal"
              />
            </div>

            {/* Cliente si tipo CLIENTE */}
            {tipo === TipoPedido.CLIENTE && (
              <div className="space-y-1">
                <Label>Cliente</Label>
                <ReactSelect
                  className="text-black"
                  options={clientesOptions}
                  value={
                    clienteId
                      ? {
                          value: String(clienteId),
                          label:
                            clientesOptions.find(
                              (c) => Number(c.value) === clienteId
                            )?.label ?? "",
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setClienteId(opt ? Number(opt.value) : null)
                  }
                  isClearable
                  placeholder="Seleccione un cliente"
                />
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <Label>Observaciones</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas del pedido (opcional)"
              rows={2}
            />
          </div>

          {/* Lista de productos */}
          {/* <ProductsList
            search={search}
            setSearch={setSearch}
            productos={productos}
            selectedLines={selectedLines}
            onToggle={toggle}
            onQtyChange={changeQty}
          /> */}

          {/* Paginación server-side */}
          {productos.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground py-2">
              <span>
                Página {pageProd} de {productosResp?.totalPages ?? 1}
              </span>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageProd === 1}
                  onClick={() => setPageProd((p) => p - 1)}
                >
                  ← Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageProd === (productosResp?.totalPages ?? 1)}
                  onClick={() => setPageProd((p) => p + 1)}
                >
                  Siguiente →
                </Button>
              </div>
            </div>
          )}

          {/* Resumen productos seleccionados */}
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Productos en el pedido</h4>
              <div className="text-sm text-muted-foreground">
                {totals.items} ítems • Total estimado:{" "}
                <span className="font-semibold">
                  {formattMonedaGT(totals.total)}
                </span>
              </div>
            </div>

            {lineas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay productos en este pedido.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto pr-2">
                <ul className="divide-y">
                  {lineas.map((l) => (
                    <li key={l.productoId} className="py-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">
                            {l.nombre ?? `#${l.productoId}`}
                          </span>
                          <span className="ml-2 text-sm text-muted-foreground">
                            Cantidad: {l.cantidad}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={l.showNota ? "secondary" : "outline"}
                            size="sm"
                            onClick={() =>
                              setLineas((prev) =>
                                prev.map((pl) =>
                                  pl.productoId === l.productoId
                                    ? { ...pl, showNota: !pl.showNota }
                                    : pl
                                )
                              )
                            }
                          >
                            {l.showNota ? "Ocultar nota" : "➕ Nota"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeLine(l.productoId)}
                            aria-label="Quitar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {l.showNota && (
                        <Textarea
                          placeholder="Nota para este producto"
                          value={l.notas ?? ""}
                          onChange={(e) =>
                            setLineas((prev) =>
                              prev.map((pl) =>
                                pl.productoId === l.productoId
                                  ? { ...pl, notas: e.target.value }
                                  : pl
                              )
                            )
                          }
                          rows={2}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer acciones */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => refetchPedido()}>
              <Plus className="h-4 w-4 mr-2" /> Revertir cambios
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
