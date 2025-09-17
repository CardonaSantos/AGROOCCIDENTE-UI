import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Barcode,
  CaseUpper,
  Coins,
  Combine,
  FileType,
  Package2,
  Plus,
  Trash2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  PreciosPresentacion,
  Presentacion,
  TIPO_EMPAQUE_VALUES,
  TipoEmpaque,
} from "../interfaces/preciosCreateInterfaces";
import AddPrices from "@/Pages/Inventario/AddPrices";
import { Dispatch, SetStateAction } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropsComponent {
  presentaciones: Presentacion[];
  setPresentaciones: Dispatch<SetStateAction<Presentacion[]>>; // 👈
}
export default function AddPresentaciones({
  presentaciones,
  setPresentaciones,
}: PropsComponent) {
  const updateField = <K extends keyof Presentacion>(
    idx: number,
    key: K,
    value: Presentacion[K]
  ) => {
    setPresentaciones((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
    );
  };

  const updatePrecios = (idx: number, precios: PreciosPresentacion[]) => {
    setPresentaciones((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, precios } : item))
    );
  };

  const setDefaultOnlyOne = (idx: number, val: boolean) => {
    setPresentaciones((prev) =>
      prev.map((p, i) => ({ ...p, esDefault: i === idx ? val : false }))
    );
  };

  const addPresentacion = () => {
    setPresentaciones([
      ...presentaciones,
      {
        nombre: "",
        factorUnidadBase: "",
        sku: "",
        codigoBarras: "",
        esDefault: false,
        precios: [],
        costoReferencialPresentacion: "",
        tipoPresentacion: TipoEmpaque.UNIDAD,
      },
    ]);
  };

  const removePresentacion = (idx: number) =>
    setPresentaciones(presentaciones.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Package2 className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-medium">Presentaciones del Producto</h3>
      </div>

      {/* Column Headers */}
      {presentaciones.length > 0 && (
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-lg">
          <div className="col-span-4">
            <Label className="text-sm font-medium text-muted-foreground">
              Nombre Presentación
            </Label>
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-medium text-muted-foreground">
              SKU
            </Label>
          </div>
          <div className="col-span-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Código de barras
            </Label>
          </div>
          <div className="col-span-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Factor Unidad Base
            </Label>
          </div>
          <div className="col-span-1">
            <Label className="text-sm font-medium text-muted-foreground">
              Default
            </Label>
          </div>
        </div>
      )}

      {/* Presentación rows */}
      <div className="space-y-3">
        {presentaciones.map((p, idx) => (
          <Card key={idx} className="border-l-4 border-l-primary/20">
            <CardContent className="p-4 space-y-3">
              {/* Fila 1: Nombre, SKU, Código barras, Factor, Default / Borrar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Nombre */}
                <div className="md:col-span-4">
                  <label className="sr-only" htmlFor={`nombre-${idx}`}>
                    Nombre Presentación
                  </label>
                  <div className="relative">
                    <CaseUpper className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`nombre-${idx}`}
                      type="text"
                      autoComplete="off"
                      value={p.nombre}
                      onChange={(e) =>
                        updateField(idx, "nombre", e.target.value)
                      }
                      placeholder="Nombre Presentación"
                      className="pl-10 h-9"
                    />
                  </div>
                </div>

                {/* SKU */}
                <div className="md:col-span-2">
                  <label className="sr-only" htmlFor={`sku-${idx}`}>
                    SKU
                  </label>
                  <div className="relative">
                    <FileType className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`sku-${idx}`}
                      type="text"
                      autoComplete="off"
                      value={p.sku ?? ""}
                      onChange={(e) => updateField(idx, "sku", e.target.value)}
                      placeholder="SKU único (opcional)"
                      className="pl-10 h-9"
                    />
                  </div>
                </div>

                {/* Código de barras */}
                <div className="md:col-span-3">
                  <label className="sr-only" htmlFor={`barcode-${idx}`}>
                    Código de barras
                  </label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`barcode-${idx}`}
                      type="text"
                      autoComplete="off"
                      value={p.codigoBarras ?? ""}
                      onChange={(e) =>
                        updateField(idx, "codigoBarras", e.target.value)
                      }
                      placeholder="Código de barras (opcional)"
                      className="pl-10 h-9"
                    />
                  </div>
                </div>

                {/* Factor Unidad Base */}
                <div className="md:col-span-2">
                  <label className="sr-only" htmlFor={`factor-${idx}`}>
                    Factor Unidad Base
                  </label>
                  <div className="relative">
                    <Combine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`factor-${idx}`}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={p.factorUnidadBase ?? ""}
                      onChange={(e) =>
                        updateField(idx, "factorUnidadBase", e.target.value)
                      }
                      placeholder="Ej. 1000"
                      className="pl-10 h-9 text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 2: Tipo de empaque + Costo referencial */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Tipo de empaque */}
                <div className="md:col-span-4">
                  <label className="sr-only" htmlFor={`tipo-${idx}`}>
                    Tipo de empaque
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select
                      value={p.tipoPresentacion ?? undefined}
                      onValueChange={(value) =>
                        updateField(
                          idx,
                          "tipoPresentacion",
                          value as TipoEmpaque
                        )
                      }
                    >
                      <SelectTrigger
                        id={`tipo-${idx}`}
                        className="pl-10 h-9 w-full"
                      >
                        <SelectValue placeholder="Tipo de empaque" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Tipo de empaque</SelectLabel>
                          {TIPO_EMPAQUE_VALUES.map((tmp) => (
                            <SelectItem key={tmp} value={tmp}>
                              {tmp}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Costo referencial */}
                <div className="md:col-span-3">
                  <label className="sr-only" htmlFor={`costo-${idx}`}>
                    Precio costo referencial
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={`costo-${idx}`}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={p.costoReferencialPresentacion ?? ""}
                      onChange={(e) =>
                        updateField(
                          idx,
                          "costoReferencialPresentacion",
                          e.target.value
                        )
                      }
                      placeholder="Precio costo referencial"
                      className="pl-10 h-9 text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Precios de esta presentación */}
              <div className="space-y-2">
                <Label className="text-sm">Precios de esta presentación</Label>
                <AddPrices
                  precios={p.precios}
                  setPrecios={(next) => updatePrecios(idx, next)}
                  variant="embedded"
                />
              </div>

              {/* Default + eliminar */}
              <div className="md:col-span-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Default</span>
                  <Switch
                    checked={Boolean(p.esDefault)}
                    onCheckedChange={(v) => setDefaultOnlyOne(idx, v)}
                    aria-label="Marcar como presentación por defecto"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePresentacion(idx)}
                  type="button"
                  className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label="Eliminar presentación"
                  // si no quieres que el botón entre al tab cycle, descomenta:
                  // tabIndex={-1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {presentaciones.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No hay presentaciones configuradas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      <Button
        onClick={addPresentacion}
        type="button"
        variant="outline"
        className="w-full border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 bg-transparent"
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar presentación
      </Button>
    </div>
  );
}
