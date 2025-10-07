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
import { Loader2 } from "lucide-react";
import { ProductoToPedidoList } from "../Interfaces/productsList.interfaces";
import {
  PedidoCreate,
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
import ProductsList from "./ProductsList";

/** === UI Linea: permite producto O presentación === */
export type PedidoLineaUI = {
  tipo: "PRODUCTO" | "PRESENTACION";
  productoId: number;
  presentacionId?: number;
  /** Cantidad solicitada (en unidades base para producto, en #presentaciones para presentación). */
  cantidad: number;
  /** Override de precio unitario (opcional). */
  precioUnitarioOverride?: number | null;
  /** Sólo UI */
  showNota?: boolean;
  notas?: string;
  fechaVencimiento: string;
  actualizarCosto?: boolean;
};

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
  const [lineas, setLineas] = useState<PedidoLineaUI[]>([]);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [prioridad, setPrioridad] = useState<PedidoPrioridad>(
    PedidoPrioridad.MEDIA
  );
  const [tipo, setTipo] = useState<TipoPedido>(TipoPedido.INTERNO);

  /** Helpers para llave estable por línea */
  const keyFor = (l: PedidoLineaUI) =>
    l.tipo === "PRODUCTO" ? `P-${l.productoId}` : `PP-${l.presentacionId}`;

  /** === Totales === */
  const totals = useMemo(() => {
    let items = lineas.length;
    let total = 0;

    for (const l of lineas) {
      const prod = productos.find((p) => p.id === l.productoId);
      if (l.tipo === "PRODUCTO") {
        const unit =
          l.precioUnitarioOverride ?? (prod ? prod.precioCostoActual : 0);
        total += unit * l.cantidad;
      } else {
        const pres = prod?.presentaciones.find(
          (pp) => pp.id === l.presentacionId
        );
        const unit =
          l.precioUnitarioOverride ?? pres?.costoReferencialPresentacion ?? 0;
        total += unit * l.cantidad;
      }
    }
    return { items, total };
  }, [lineas, productos]);

  /** === Mutadores de líneas === */
  const upsertProduct = (productoId: number, checked: boolean) => {
    const producto = productos.find((p) => p.id === productoId);
    setLineas((prev) => {
      const exists = prev.find(
        (x) => x.tipo === "PRODUCTO" && x.productoId === productoId
      );
      if (checked) {
        if (exists) return prev;
        return [
          ...prev,
          {
            tipo: "PRODUCTO",
            productoId,
            cantidad: 1,
            precioUnitarioOverride: producto?.precioCostoActual ?? 0,
            fechaVencimiento: "",
            actualizarCosto: false,
            notas: "",
          },
        ];
      }
      return prev.filter(
        (x) => !(x.tipo === "PRODUCTO" && x.productoId === productoId)
      );
    });
  };

  const handleChangeFechaVencimiento = (rowKey: string, date: string) => {
    setLineas((prev) =>
      prev.map((l) =>
        keyFor(l) === rowKey ? { ...l, fechaVencimiento: date } : l
      )
    );
  };

  const upsertPresentacion = (
    productoId: number,
    presentacionId: number,
    checked: boolean
  ) => {
    const producto = productos.find((p) => p.id === productoId);
    const presentacion = producto?.presentaciones.find(
      (pp) => pp.id === presentacionId
    ); // ✅ fix

    setLineas((prev) => {
      const exists = prev.find(
        (x) =>
          x.tipo === "PRESENTACION" &&
          x.productoId === productoId &&
          x.presentacionId === presentacionId
      );
      if (checked) {
        if (exists) return prev;
        return [
          ...prev,
          {
            tipo: "PRESENTACION",
            productoId,
            presentacionId,
            cantidad: 1,
            precioUnitarioOverride:
              presentacion?.costoReferencialPresentacion ?? null,
            fechaVencimiento: "",
            actualizarCosto: false,
          },
        ];
      }
      return prev.filter(
        (x) =>
          !(
            x.tipo === "PRESENTACION" &&
            x.productoId === productoId &&
            x.presentacionId === presentacionId
          )
      );
    });
  };
  const toggleActPrecioProduct = (rowKey: string, checked: boolean) => {
    setLineas((prev) =>
      prev.map((l) =>
        keyFor(l) === rowKey ? { ...l, actualizarCosto: checked } : l
      )
    );
  };

  const changeQty = (rowKey: string, qty: number | null) => {
    setLineas((prev) =>
      prev.map((l) =>
        keyFor(l) === rowKey ? { ...l, cantidad: qty ?? l.cantidad } : l
      )
    );
  };

  const changePrice = (rowKey: string, price?: number | null) => {
    setLineas((prev) =>
      prev.map((l) =>
        keyFor(l) === rowKey
          ? {
              ...l,
              precioUnitarioOverride:
                typeof price === "number" && price >= 0 ? price : null,
            }
          : l
      )
    );
  };

  const toggleNote = (rowKey: string) => {
    setLineas((prev) =>
      prev.map((l) =>
        keyFor(l) === rowKey ? { ...l, showNota: !l.showNota } : l
      )
    );
  };

  const setNote = (rowKey: string, val: string) => {
    setLineas((prev) =>
      prev.map((l) => (keyFor(l) === rowKey ? { ...l, notas: val } : l))
    );
  };

  const reset = () => {
    setClienteId(null);
    setObservaciones("");
    setLineas([]);
  };
  console.log("Las lineas seleccionadas son: ", lineas);
  const canSend = lineas.length > 0 && !submitting;

  /** === Submit === */
  const handleSubmit = async () => {
    if (lineas.length === 0) {
      toast.info("No se puede enviar una lista vacía");
      return;
    }
    // ✅ Valida con el precio efectivo (override ?? base)
    const hasInvalid = lineas.some((l) => {
      const prod = productos.find((p) => p.id === l.productoId);
      const pres = prod?.presentaciones.find(
        (pp) => pp.id === l.presentacionId
      );
      const efectivo =
        l.precioUnitarioOverride ??
        (l.tipo === "PRODUCTO"
          ? prod?.precioCostoActual
          : pres?.costoReferencialPresentacion) ??
        0;
      return efectivo <= 0;
    });

    if (hasInvalid) {
      toast.warning("Alguna línea no tiene precio costo válido.");
      return;
    }

    const body: PedidoCreate = {
      sucursalId: sucursalId ?? sucursalIDStore,
      clienteId: tipo === TipoPedido.CLIENTE ? clienteId : null,
      usuarioId: userId,
      observaciones: observaciones?.trim() || undefined,
      prioridad,
      tipo,
      lineas: lineas.map((l) => {
        const prod = productos.find((p) => p.id === l.productoId);
        const pres = prod?.presentaciones.find(
          (pp) => pp.id === l.presentacionId
        );

        // ✅ precioCostoActual que mandas al server = override ?? base
        const precioCostoActual =
          l.precioUnitarioOverride ??
          (l.tipo === "PRODUCTO"
            ? prod?.precioCostoActual
            : pres?.costoReferencialPresentacion) ??
          0;

        return {
          productoId: l.productoId,
          ...(l.tipo === "PRESENTACION"
            ? { presentacionId: l.presentacionId }
            : {}),
          cantidad: l.cantidad,
          ...(l.precioUnitarioOverride != null
            ? { precioUnitario: l.precioUnitarioOverride }
            : {}),
          ...(l.notas ? { notas: l.notas } : {}),
          precioCostoActual,
          ...(l.fechaVencimiento
            ? { fechaVencimiento: l.fechaVencimiento }
            : {}),
          ...(l.actualizarCosto ? { actualizarCosto: l.actualizarCosto } : {}),
          ...(l.tipo ? { tipo: l.tipo } : {}),
        };
      }),
    };

    console.log("El dto a enviar es: ", body);

    await onSubmit(body);
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Pedido</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

          <div className="space-y-1">
            <Label>Sucursal</Label>
            <ReactSelect
              className="text-black text-sm"
              options={sucursalesOptions}
              onChange={(opt) => setSucursalId(opt ? Number(opt?.value) : null)}
              isClearable
              placeholder="Asignar sucursal (por defecto, la actual)"
            />
          </div>

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

        {/* === Tabla productos/presentaciones === */}
        <ProductsList
          search={search}
          setSearch={setSearch}
          productos={productos}
          selectedLines={lineas}
          onToggleProduct={upsertProduct}
          onTogglePresentacion={upsertPresentacion}
          onQtyChange={changeQty}
          onPriceChange={changePrice}
          handleChangeFechaVencimiento={handleChangeFechaVencimiento}
          toggleActPrecioProduct={toggleActPrecioProduct}
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border p-3 text-sm">
          <div className="text-muted-foreground">
            Ítems seleccionados:{" "}
            <span className="font-medium">{totals.items}</span>
          </div>
          <div className="text-muted-foreground">
            Total estimado:{" "}
            <span className="font-medium">{formattMonedaGT(totals.total)}</span>
          </div>
        </div>

        {/* Resumen y notas por renglón */}
        <div className="rounded-md border p-3 space-y-3">
          <h4 className="font-medium">Renglones seleccionados</h4>
          <div className="max-h-60 overflow-y-auto pr-2">
            <ul className="divide-y">
              {lineas.map((l) => {
                const rowKey = keyFor(l);
                const prod = productos.find((p) => p.id === l.productoId);
                const pres =
                  l.tipo === "PRESENTACION"
                    ? prod?.presentaciones.find(
                        (pp) => pp.id === l.presentacionId
                      )
                    : undefined;
                const nombre =
                  l.tipo === "PRODUCTO"
                    ? prod?.nombre ?? `Producto ${l.productoId}`
                    : `${prod?.nombre ?? "Producto"} - ${
                        pres?.nombre ?? `Pres. ${l.presentacionId}`
                      }`;

                return (
                  <li key={rowKey} className="py-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-medium">{nombre}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          Cant.: {l.cantidad}
                          {l.precioUnitarioOverride != null &&
                            ` · Q ${l.precioUnitarioOverride.toFixed(2)}`}
                        </span>
                      </div>
                      <Button
                        variant={l.showNota ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleNote(rowKey)}
                      >
                        {l.showNota ? "Ocultar nota" : "➕ Nota"}
                      </Button>
                    </div>

                    {l.showNota && (
                      <Textarea
                        placeholder="Nota para este renglón"
                        value={l.notas ?? ""}
                        onChange={(e) => setNote(rowKey, e.target.value)}
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
        <Button onClick={() => setOpenCreate(true)} disabled={!canSend}>
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
          onClick: () => setOpenCreate(false),
        }}
      />
    </Card>
  );
}
