"use client";
import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PresentationItem from "./PresentationItem";
import {
  Categoria,
  Presentacion,
  TipoPresentacion,
} from "../interfaces/DomainProdPressTypes";

interface Props {
  items: Presentacion[];
  setItems: (items: Presentacion[]) => void;
  packagingTypes: TipoPresentacion[];
  categories: Categoria[];
}

export default function PresentationsForm({
  items,
  setItems,
  packagingTypes,
  categories,
}: Props) {
  const ensureSingleDefault = useCallback(
    (idxDefault: number) =>
      setItems(items.map((it, i) => ({ ...it, esDefault: i === idxDefault }))),
    [items, setItems]
  );

  const addItem = () => {
    const first = packagingTypes[0] ?? null;
    const next: Presentacion = {
      nombre: "",
      codigoBarras: "",
      tipoPresentacionId: first ? first.id : null,
      tipoPresentacion: first ?? null,
      costoReferencialPresentacion: "",
      descripcion: "",
      stockMinimo: 0,
      precios: [],
      esDefault: items.length === 0, // la primera se marca default
      imagenes: [],
      categorias: [],
    };
    setItems([...items, next]);
  };

  const updateItem = (idx: number, updated: Presentacion) => {
    setItems(items.map((it, i) => (i === idx ? updated : it)));
  };

  const removeItem = (idx: number) => {
    const willRemoveDefault = items[idx]?.esDefault;
    const next = items.filter((_, i) => i !== idx);
    // si borramos la default, marcamos la primera (si existe) como default
    if (willRemoveDefault && next.length > 0) {
      next[0].esDefault = true;
    }
    setItems(next);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Presentaciones</span>
          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="border-dashed"
          >
            <Plus className="mr-2" /> Agregar presentación
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {items.map((p, idx) => (
          <PresentationItem
            key={idx}
            index={idx}
            item={p}
            packagingTypes={packagingTypes}
            categories={categories}
            onChange={(next) => updateItem(idx, next)}
            onRemove={() => removeItem(idx)}
            onSetDefault={() => ensureSingleDefault(idx)}
          />
        ))}
        {items.length === 0 && (
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={addItem}
          >
            <Plus className="mr-2" /> Agregar presentación
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
