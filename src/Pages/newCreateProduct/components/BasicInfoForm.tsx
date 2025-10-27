"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Box, Barcode, Asterisk, SquareMinus } from "lucide-react";
import { ReusableSelect } from "@/utils/components/ReactSelectComponent/ReusableSelect";
import {
  BasicInfo,
  Categoria,
  TipoPresentacion,
} from "../interfaces/DomainProdPressTypes";

interface Props {
  value: BasicInfo;
  categories: Categoria[];
  packagingTypes: TipoPresentacion[];
  onChange: (next: BasicInfo) => void;
}

export default function BasicInfoForm({
  value,
  categories,
  packagingTypes,
  onChange,
}: Props) {
  // helper para hacer un solo patch
  const patch = (partial: Partial<BasicInfo>) =>
    onChange({ ...value, ...partial });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Datos básicos</CardTitle>
        <CardDescription>Información esencial del producto</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="grid gap-2 relative">
            <Label htmlFor="nombre">Nombre</Label>
            <Box className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
            <Input
              id="nombre"
              type="text"
              value={value.nombre}
              onChange={(e) => patch({ nombre: e.target.value })}
              placeholder="Nombre de producto"
            />
          </div>

          {/* Código Producto */}
          <div className="grid gap-2 relative">
            <Label htmlFor="codigoProducto">Código Producto</Label>
            <Barcode className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
            <Input
              id="codigoProducto"
              type="text"
              value={value.codigoProducto}
              onChange={(e) => patch({ codigoProducto: e.target.value })}
              placeholder="Código único por producto"
            />
          </div>

          {/* Código Proveedor */}
          <div className="grid gap-2 relative">
            <Label htmlFor="codigoProveedor">Código del proveedor</Label>
            <Asterisk className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
            <Input
              id="codigoProveedor"
              type="text"
              value={value.codigoProveedor || ""}
              onChange={(e) => patch({ codigoProveedor: e.target.value })}
              placeholder="(Opcional) Código proveedor"
            />
          </div>

          {/* Stock Mínimo */}
          <div className="grid gap-2 relative">
            <Label htmlFor="stockMinimo">Stock Mínimo</Label>
            <SquareMinus className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
            <Input
              id="stockMinimo"
              type="number"
              value={value.stockMinimo}
              onChange={(e) => patch({ stockMinimo: Number(e.target.value) })}
              placeholder="Cantidad mínima"
            />
          </div>

          {/* Precio Costo */}
          <div className="grid gap-2 relative">
            <Label htmlFor="precioCostoActual">Precio Costo</Label>
            <SquareMinus className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
            <Input
              id="precioCostoActual"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={value.precioCostoActual}
              onChange={(e) =>
                patch({ precioCostoActual: Number(e.target.value) })
              }
              placeholder="0.00"
            />
          </div>

          {/* Tipo de presentación (relación flexible) - usando ReusableSelect */}
          <div className="grid gap-2">
            <Label>Tipo de presentación (opcional)</Label>
            <ReusableSelect<TipoPresentacion>
              items={packagingTypes}
              getLabel={(t) => t.nombre}
              getValue={(t) => t.id}
              value={value.tipoPresentacion ?? null}
              onChange={(opt) =>
                // ✅ una sola actualización con ambos campos
                patch({
                  tipoPresentacionId: opt ? opt.id : null,
                  tipoPresentacion: opt ?? null,
                })
              }
              placeholder="Selecciona un tipo"
              selectProps={{
                isSearchable: true,
                isClearable: true, // al limpiar deja en null ambos campos
                menuPortalTarget: document.body, // opcional: z-index seguro
              }}
            />
          </div>

          {/* Categorías */}
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="categorias">Categorías</Label>
            <ReusableSelect<Categoria>
              isMulti
              items={categories}
              getLabel={(c) => c.nombre}
              getValue={(c) => c.id}
              value={value.categorias}
              onChange={(cats) => patch({ categorias: cats })}
              placeholder="Seleccione categorías"
              selectProps={{ isSearchable: true, closeMenuOnSelect: false }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
