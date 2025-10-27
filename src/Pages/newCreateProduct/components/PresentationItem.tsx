"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import PricesForm from "./PricesForm";
import ImageUploader from "./ImageUploader";
import {
  Categoria,
  Presentacion,
  TipoPresentacion,
} from "../interfaces/DomainProdPressTypes";
import { ReusableSelect } from "@/utils/components/ReactSelectComponent/ReusableSelect";

interface Props {
  index: number;
  item: Presentacion;
  packagingTypes: TipoPresentacion[];
  categories: Categoria[];
  onChange: (next: Presentacion) => void;
  onRemove: () => void;
  onSetDefault: () => void;
}

export default function PresentationItem({
  index,
  item,
  packagingTypes,
  onChange,
  onRemove,
  onSetDefault,
  categories,
}: Props) {
  const [open, setOpen] = useState(true);

  const patch = (partial: Partial<Presentacion>) =>
    onChange({ ...item, ...partial });

  return (
    <Card className="border-l-4 border-l-primary/20">
      <CardHeader className="flex items-center justify-between py-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <span>Presentación {index + 1}</span>
          <Button
            variant={item.esDefault ? "default" : "outline"}
            size="sm"
            onClick={onSetDefault}
            type="button"
            className="h-8"
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            {item.esDefault ? "Por defecto" : "Marcar por defecto"}
          </Button>
        </CardTitle>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            type="button"
            aria-expanded={open}
          >
            {open ? (
              <ChevronUp className="mr-1 h-4 w-4" />
            ) : (
              <ChevronDown className="mr-1 h-4 w-4" />
            )}
            {open ? "Ocultar" : "Mostrar"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            type="button"
            aria-label="Eliminar presentación"
          >
            <Trash2 />
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0">
          {/* FILA 1: Nombre / Código barras / Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <Label>Nombre</Label>
              <Input
                value={item.nombre}
                onChange={(e) => patch({ nombre: e.target.value })}
                placeholder="Nombre de la presentación"
              />
            </div>

            <div className="md:col-span-3">
              <Label>Código barras</Label>
              <Input
                value={item.codigoBarras}
                onChange={(e) => patch({ codigoBarras: e.target.value })}
                placeholder="Código único por presentación"
              />
            </div>

            <div className="md:col-span-4">
              <Label>Tipo de presentación</Label>
              <ReusableSelect<TipoPresentacion>
                items={packagingTypes}
                getLabel={(t) => t.nombre}
                getValue={(t) => t.id}
                value={item.tipoPresentacion ?? null}
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
                  isClearable: true, // limpiar deja ambos en null
                  // opcional: evita problemas de z-index si el menú se queda detrás
                  menuPortalTarget: document.body,
                  styles: {
                    menuPortal: (base) => ({ ...base, zIndex: 50_000 }),
                  },
                }}
              />
            </div>
          </div>

          {/* FILA 2: Costo / Stock / Categorías */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
            <div className="md:col-span-3">
              <Label>Costo ref.</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={item.costoReferencialPresentacion ?? ""}
                onChange={(e) =>
                  patch({ costoReferencialPresentacion: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-3">
              <Label>Stock mín.</Label>
              <Input
                type="number"
                value={item.stockMinimo}
                onChange={(e) =>
                  patch({ stockMinimo: Number(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            <div className="md:col-span-6">
              <Label>Categorías</Label>
              <ReusableSelect<Categoria>
                isMulti
                items={categories}
                getLabel={(c) => c.nombre}
                getValue={(c) => c.id}
                value={item.categorias ?? []}
                onChange={(cats) => patch({ categorias: cats })}
                placeholder="Seleccione categorías"
                selectProps={{ isSearchable: true, closeMenuOnSelect: false }}
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="mt-4">
            <Label>Descripción</Label>
            <Textarea
              rows={3}
              value={item.descripcion ?? ""}
              onChange={(e) => patch({ descripcion: e.target.value })}
              placeholder="Descripción (opcional)"
            />
          </div>

          {/* Precios */}
          <div className="mt-4">
            <PricesForm
              precios={item.precios}
              setPrecios={(pres) => patch({ precios: pres })}
            />
          </div>

          {/* Imágenes */}
          <div className="mt-4">
            <Label>Imágenes</Label>
            <ImageUploader
              files={item.imagenes ?? []}
              onDone={(imgs) => patch({ imagenes: imgs })}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
