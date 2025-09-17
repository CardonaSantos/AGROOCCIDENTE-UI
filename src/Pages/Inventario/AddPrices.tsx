import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Lock, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  PrecioProductoInventario,
  RolPrecio,
} from "../producto/interfaces/preciosCreateInterfaces";

type Variant = "standalone" | "embedded";

interface PropsComponent {
  precios: PrecioProductoInventario[];
  setPrecios: (value: PrecioProductoInventario[]) => void;
  variant?: Variant; // "embedded" para usar dentro de una Presentación
}

const ROLES: { label: string; value: RolPrecio }[] = [
  { label: "PÚBLICO", value: RolPrecio.PUBLICO },
  { label: "AGROSERVICIO", value: RolPrecio.AGROSERVICIO },
  { label: "FINCA", value: RolPrecio.FINCA },
  { label: "DISTRIBUIDOR", value: RolPrecio.DISTRIBUIDOR },
  { label: "PROMOCIÓN", value: RolPrecio.PROMOCION },
];

export default function AddPrices({
  precios,
  setPrecios,
  variant = "standalone",
}: PropsComponent) {
  const updateField = <K extends keyof PrecioProductoInventario>(
    idx: number,
    key: K,
    value: PrecioProductoInventario[K]
  ) => {
    const next = precios.map((item, i) =>
      i === idx ? { ...item, [key]: value } : item
    );
    setPrecios(next);
  };

  const addPrecio = () => {
    setPrecios([
      ...precios,
      { precio: "", orden: precios.length + 1, rol: RolPrecio.PUBLICO },
    ]);
  };

  const removePrecio = (idx: number) =>
    setPrecios(precios.filter((_, i) => i !== idx));

  const compact = variant === "embedded";

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {/* Header (solo en standalone) */}
      {!compact && (
        <div className="flex items-center gap-2 mb-2">
          <Coins className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-medium">Precios del Producto</h3>
        </div>
      )}

      {/* Column headers */}
      {precios.length > 0 && (
        <div
          className={`grid grid-cols-12 gap-3 px-3 py-2 rounded-lg ${
            compact ? "bg-muted/30" : "bg-muted/50"
          }`}
        >
          <div className="col-span-5">
            <Label className="text-sm text-muted-foreground">Precio</Label>
          </div>
          <div className="col-span-2">
            <Label className="text-sm text-muted-foreground">Orden</Label>
          </div>
          <div className="col-span-4">
            <Label className="text-sm text-muted-foreground">
              Tipo de Cliente
            </Label>
          </div>
          <div className="col-span-1">
            <Label className="text-sm text-muted-foreground">Acción</Label>
          </div>
        </div>
      )}

      {/* Rows */}
      <div className="space-y-2">
        {precios.map((p, idx) => (
          <Card
            key={idx}
            className={
              compact
                ? "border-l-2 border-l-primary/20"
                : "border-l-4 border-l-primary/20"
            }
          >
            <CardContent className={compact ? "p-3" : "p-4"}>
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Precio (string, pero input number) */}
                <div className="col-span-5">
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={p.precio}
                      onChange={(e) =>
                        updateField(idx, "precio", e.target.value)
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Orden */}
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={p.orden}
                    onChange={(e) =>
                      updateField(idx, "orden", Number(e.target.value) || 0)
                    }
                    placeholder="1"
                    min="1"
                    className="text-center"
                  />
                </div>

                {/* Rol */}
                <div className="col-span-4">
                  <Select
                    value={p.rol}
                    onValueChange={(v) =>
                      updateField(idx, "rol", v as RolPrecio)
                    }
                  >
                    {/* 👇 Pintamos el icono dentro del Trigger cuando el valor es DISTRIBUIDOR */}
                    <SelectTrigger className="justify-between">
                      <div className="flex items-center gap-2">
                        {p.rol === RolPrecio.DISTRIBUIDOR && (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <SelectValue placeholder="Selecciona un rol" />
                      </div>
                    </SelectTrigger>

                    <SelectContent>
                      {ROLES.map((rol) => (
                        <SelectItem key={rol.value} value={rol.value}>
                          {/* 👇 Icono también en la lista, alineado a la izquierda del texto */}
                          <div className="flex items-center gap-2">
                            {rol.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Acción */}
                <div className="col-span-1 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePrecio(idx)}
                    type="button"
                    className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label="Eliminar precio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {precios.length === 0 && !compact && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Coins className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No hay precios configurados
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      <Button
        onClick={addPrecio}
        type="button"
        variant={compact ? "secondary" : "outline"}
        className={`w-full ${
          compact
            ? ""
            : "border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 bg-transparent"
        }`}
      >
        <Plus className="h-4 w-4 mr-2" />
        {compact ? "Añadir precio" : "Agregar precio"}
      </Button>
    </div>
  );
}
