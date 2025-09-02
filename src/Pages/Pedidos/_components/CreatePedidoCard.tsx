// /Pedidos/_components/CreatePedidoCard.tsx
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ReactSelect from "react-select";
import ProductsList from "./ProductsList";
import { Loader2 } from "lucide-react";
import { ProductoToPedidoList } from "../Interfaces/productsList.interfaces";
import {
  PedidoCreate,
  PedidoLineaUI,
  PedidoPrioridad,
  TipoPedido,
} from "../Interfaces/createPedido.interfaces";
import { formattMonedaGT } from "@/utils/formattMoneda";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useStore } from "@/components/Context/ContextSucursal";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";

type Option = { label: string; value: string };

export default function CreatePedidoCard({
  userId,
  clientesOptions,
  productos,
  onSubmit,
  submitting,
  sucursalesOptions,
  search,
  setSearch,
  pageProd,
  setPageProd,
  totalPages,
  openCreate,

  setOpenCreate,
}: {
  sucursalId: number;
  userId: number;
  clientesOptions: Option[];
  productos: ProductoToPedidoList[];
  onSubmit: (pedido: PedidoCreate) => Promise<void>;
  submitting?: boolean;
  sucursalesOptions: Option[];
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  pageProd: number;
  setPageProd: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;

  setOpenCreate: React.Dispatch<React.SetStateAction<boolean>>;
  openCreate: boolean;
}) {
  const prioridadesOptions = Object.values(PedidoPrioridad).map((p) => ({
    value: p,
    label: p,
  }));

  const tiposOptions = Object.values(TipoPedido).map((t) => ({
    value: t,
    label: t,
  }));

  const sucursalIDStore = useStore((state) => state.sucursalId) ?? 0;
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState("");
  // const [lineas, setLineas] = useState<PedidoLinea[]>([]);
  const [lineas, setLineas] = useState<PedidoLineaUI[]>([]);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [prioridad, setPrioridad] = useState<PedidoPrioridad>(
    PedidoPrioridad.MEDIA
  );
  const [tipo, setTipo] = useState<TipoPedido>(TipoPedido.INTERNO);

  const selectedLines = useMemo(
    () =>
      lineas.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
    [lineas]
  );

  const totals = useMemo(() => {
    return {
      items: lineas.length,
      total: lineas.reduce((acc, item) => {
        const producto = productos.find((p) => p.id === item.productoId);
        return acc + (producto?.precioCostoActual ?? 0) * item.cantidad;
      }, 0),
    };
  }, [lineas, productos]);

  const toggle = (checked: boolean, productId: number) => {
    setLineas((prev) => {
      if (checked) {
        if (prev.some((l) => l.productoId === productId)) return prev;
        const producto = productos.find((p) => p.id === productId);
        if (!producto) return prev;
        return [
          ...prev,
          {
            productoId: productId,
            cantidad: 1,
            precioCostoActual: producto.precioCostoActual,
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

  const reset = () => {
    setClienteId(null);
    setObservaciones("");
    setLineas([]);
  };

  const canSend = lineas.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (lineas.length === 0) {
      toast.info("No se puede enviar una lista vacía");
      return;
    }
    const body: PedidoCreate = {
      sucursalId: sucursalId ? sucursalId : sucursalIDStore,
      clienteId: tipo === TipoPedido.CLIENTE ? clienteId : null,
      usuarioId: userId, // ✅ usar la prop userId
      observaciones: observaciones?.trim() || undefined,
      lineas: lineas.map(({ showNota, ...l }) => l), // ✅ quitamos showNota
      prioridad,
      tipo,
    };

    await onSubmit(body);
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* --- FILTROS SUPERIORES --- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Tipo de pedido */}
          <div className="space-y-1">
            <Label>Tipo de Pedido</Label>
            <Select
              value={tipo}
              onValueChange={(val) => setTipo(val as TipoPedido)}
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
              onValueChange={(val) => setPrioridad(val as PedidoPrioridad)}
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
              onChange={(opt) => setSucursalId(opt ? Number(opt?.value) : null)}
              isClearable
              placeholder="Seleccione una sucursal a asignar (default esta)"
            />
          </div>

          {/* Cliente (solo si tipo = CLIENTE) */}
          {tipo === TipoPedido.CLIENTE && (
            <div className="space-y-1">
              <Label>Cliente</Label>
              <ReactSelect
                className="text-black"
                options={clientesOptions}
                onChange={(opt) => setClienteId(opt ? Number(opt.value) : null)}
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
        <ProductsList
          search={search}
          setSearch={setSearch}
          productos={productos}
          selectedLines={selectedLines}
          onToggle={toggle}
          onQtyChange={changeQty}
        />

        {/* Paginación server-side */}
        {productos.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground py-2">
            <span>
              Página {pageProd} de {totalPages}
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
                disabled={pageProd === totalPages}
                onClick={() => setPageProd((p) => p + 1)}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        )}

        {/* Totales */}
        <div className="flex items-center justify-between rounded-md border p-3 text-sm">
          <div className="text-muted-foreground">
            Productos seleccionados:{" "}
            <span className="font-medium">{totals.items}</span>
          </div>
          <div className="text-muted-foreground">
            Total estimado:{" "}
            <span className="font-medium">{formattMonedaGT(totals.total)}</span>
          </div>
        </div>

        {/* Productos seleccionados */}
        <div className="rounded-md border p-3 space-y-3">
          <h4 className="font-medium">Productos en este pedido</h4>

          <div className="max-h-60 overflow-y-auto pr-2">
            <ul className="divide-y">
              {lineas.map((l) => {
                const producto = productos.find((p) => p.id === l.productoId);
                const nombre = producto?.nombre ?? `ID ${l.productoId}`;
                const tieneNota = l.notas && l.notas.trim().length > 0;

                return (
                  <li key={l.productoId} className="py-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{nombre}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          Cantidad: {l.cantidad}
                        </span>
                      </div>
                      <Button
                        variant={tieneNota ? "secondary" : "outline"}
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
                );
              })}
            </ul>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={reset} disabled={submitting}>
          Limpiar
        </Button>
        <Button
          onClick={() => {
            setOpenCreate(true);
          }}
          disabled={!canSend}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Pedido
        </Button>
      </CardFooter>

      <AdvancedDialog
        type="confirmation"
        title="Registrar Pedido"
        description="¿Estás seguro de querer registrar este pedido con esta información?"
        onOpenChange={setOpenCreate}
        open={openCreate}
        confirmButton={{
          label: "Si, continuar y registrar pedido",
          disabled: submitting,
          loading: submitting,
          loadingText: "Registrando pedido...",
          onClick: () => handleSubmit(),
        }}
        cancelButton={{
          label: "Cancelar",
          disabled: submitting,
          loadingText: "Cancelando...",
          onClick: () => {
            setOpenCreate(false);
          },
        }}
      />
    </Card>
  );
}
