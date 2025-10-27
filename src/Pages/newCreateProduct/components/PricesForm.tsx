// PricesForm.tsx
// ----------------------------------------
// Componente para gestionar los precios de un producto:
// - Stateless: recibe `precios` y `setPrecios` desde el padre
// - Permite agregar/quitar filas de precio y editar precio, orden y rol de cliente

"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Coins, Trash2, Plus } from "lucide-react";
import { PrecioProductoInventario } from "@/Pages/producto/interfaces/preciosCreateInterfaces";
import { RolPrecio } from "@/Pages/InventarioYStock/interfaces/InventaryInterfaces";
import { PrecioProducto } from "../interfaces/DomainProdPressTypes";

interface Props {
  precios: PrecioProducto[];
  setPrecios: (precios: PrecioProducto[]) => void;
}

const ROLES: { label: string; value: RolPrecio }[] = [
  { label: "Público", value: RolPrecio.PUBLICO },
  { label: "Agroservicio", value: RolPrecio.AGROSERVICIO },
  { label: "Finca", value: RolPrecio.FINCA },
  { label: "Distribuidor", value: RolPrecio.DISTRIBUIDOR },
  { label: "Promoción", value: RolPrecio.PROMOCION },
];

export default function PricesForm({ precios, setPrecios }: Props) {
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

  const removePrecio = (idx: number) => {
    setPrecios(precios.filter((_, i) => i !== idx));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Precios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {precios.map((p, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center">
              {/* Precio */}
              <div className="col-span-5 relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={p.precio}
                  onChange={(e) => updateField(idx, "precio", e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                />
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
                />
              </div>
              {/* Rol */}
              <div className="col-span-4">
                <Select
                  value={p.rol}
                  onValueChange={(v) => updateField(idx, "rol", v as RolPrecio)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Eliminar */}
              <div className="col-span-1 flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePrecio(idx)}
                  aria-label="Eliminar precio"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={addPrecio}
            type="button"
          >
            <Plus className="mr-2" /> Agregar precio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
