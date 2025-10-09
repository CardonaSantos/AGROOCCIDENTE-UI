// AddPresentaciones.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Archive,
  CaseUpper,
  Coins,
  FileType,
  Package2,
  Plus,
  Text,
  Trash2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  PreciosPresentacion,
  Presentacion,
  TIPO_EMPAQUE_VALUES,
  TipoEmpaque,
} from "../interfaces/preciosCreateInterfaces";
import AddPrices from "@/Pages/Inventario/AddPrices";
import React, { Dispatch, memo, SetStateAction, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import ProductImagesCropper from "@/utils/components/Image/ProductImagesCropper";
import { CroppedGrid } from "@/utils/components/Image/croppedGrid";

interface PropsComponent {
  presentaciones: Presentacion[];
  setPresentaciones: Dispatch<SetStateAction<Presentacion[]>>;
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
    setPresentaciones((prev) => [
      ...prev,
      {
        nombre: "",
        codigoBarras: "",
        esDefault: prev.length === 0,
        precios: [],
        costoReferencialPresentacion: "",
        tipoPresentacion: TipoEmpaque.UNIDAD,
        descripcion: "",
        stockMinimo: 0,
      },
    ]);
  };

  const removePresentacion = (idx: number) =>
    setPresentaciones((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Package2 className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-medium">Presentaciones del Producto</h3>
      </div>

      {/* Column headers (md+) */}
      {presentaciones.length > 0 && (
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <div className="col-span-3">Nombre</div>
          <div className="col-span-2">Código Presentación</div>
          <div className="col-span-3">Tipo de empaque</div>
          <div className="col-span-2 text-right">Costo ref.</div>
          <div className="col-span-1 text-right">Stock mín.</div>
          <div className="col-span-1 text-center">Elim.</div>
        </div>
      )}

      {/* Rows */}
      <div className="space-y-3">
        {presentaciones.map((p, idx) => (
          <PresentacionRow
            key={idx}
            idx={idx}
            p={p}
            onUpdateField={updateField}
            onUpdatePrecios={updatePrecios}
            onDefault={setDefaultOnlyOne}
            onRemove={removePresentacion}
          />
        ))}
      </div>

      {/* Empty state */}
      {presentaciones.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-1 text-sm">
              No hay presentaciones configuradas
            </p>
            <p className="text-xs text-muted-foreground">
              Agrega al menos una para definir precios por presentación.
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

type RowProps = {
  idx: number;
  p: Presentacion;
  onUpdateField: <K extends keyof Presentacion>(
    idx: number,
    key: K,
    value: Presentacion[K]
  ) => void;
  onUpdatePrecios: (idx: number, precios: PreciosPresentacion[]) => void;
  onDefault: (idx: number, val: boolean) => void;
  onRemove: (idx: number) => void;
};

const PresentacionRow = memo(function PresentacionRow({
  idx,
  p,
  onUpdateField,
  onUpdatePrecios,
  onRemove,
}: RowProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [cropped, setCropped] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="border-l-4 border-l-primary/20">
      <CardContent className="p-4 space-y-4">
        {/* Grid principal md: 12 columnas exactas */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Nombre (3) */}
          <div className="md:col-span-3">
            <Label
              htmlFor={`nombre-${idx}`}
              className="md:hidden mb-1 block text-xs text-muted-foreground"
            >
              Nombre
            </Label>
            <div className="relative">
              <CaseUpper className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={`nombre-${idx}`}
                value={p.nombre}
                onChange={(e) => onUpdateField(idx, "nombre", e.target.value)}
                placeholder="Nombre de la presentación"
                className="pl-10 h-9 text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Código (2) */}
          <div className="md:col-span-2">
            <Label
              htmlFor={`sku-${idx}`}
              className="md:hidden mb-1 block text-xs text-muted-foreground"
            >
              Código Presentación
            </Label>
            <div className="relative">
              <FileType className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={`sku-${idx}`}
                value={p.codigoBarras ?? ""}
                onChange={(e) =>
                  onUpdateField(idx, "codigoBarras", e.target.value)
                }
                placeholder="Código producto"
                className="pl-10 h-9 text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Tipo de empaque (3) */}
          <div className="md:col-span-3">
            <Label
              htmlFor={`tipo-${idx}`}
              className="md:hidden mb-1 block text-xs text-muted-foreground"
            >
              Tipo de empaque
            </Label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Select
                value={p.tipoPresentacion ?? undefined}
                onValueChange={(value) =>
                  onUpdateField(idx, "tipoPresentacion", value as TipoEmpaque)
                }
              >
                <SelectTrigger
                  id={`tipo-${idx}`}
                  className="pl-10 h-9 w-full text-sm"
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

          {/* Costo ref. (2) */}
          <div className="md:col-span-2">
            <Label
              htmlFor={`costo-${idx}`}
              className="md:hidden mb-1 block text-xs text-muted-foreground"
            >
              Costo referencial
            </Label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={`costo-${idx}`}
                type="number"
                inputMode="decimal"
                step="any"
                value={p.costoReferencialPresentacion ?? ""}
                onChange={(e) =>
                  onUpdateField(
                    idx,
                    "costoReferencialPresentacion",
                    e.target.value
                  )
                }
                placeholder="Precio costo"
                className="pl-10 h-9 text-right text-sm"
              />
            </div>
          </div>

          {/* Stock mín. (1) */}
          <div className="md:col-span-1">
            <Label
              htmlFor={`stockMinimo-${idx}`}
              className="md:hidden mb-1 block text-xs text-muted-foreground"
            >
              Stock mín.
            </Label>
            <div className="relative">
              <Archive className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={`stockMinimo-${idx}`}
                type="number"
                inputMode="numeric"
                min={0}
                value={p.stockMinimo ?? 0}
                onChange={(e) =>
                  onUpdateField(
                    idx,
                    "stockMinimo",
                    e.target.value === "" ? 0 : Number(e.target.value)
                  )
                }
                placeholder="Min."
                className="pl-10 h-9 text-right text-sm"
              />
            </div>
          </div>

          {/* Eliminar (1) */}
          <div className="md:col-span-1 flex items-center md:justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(idx)}
              type="button"
              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-label="Eliminar presentación"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Descripción
          </Label>
          <div className="relative">
            <Text className="absolute right-3 top-3 text-muted-foreground h-4 w-4" />
            <Textarea
              placeholder="Descripción de la presentación"
              className="min-h-[84px] pr-10"
              value={p.descripcion}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onUpdateField(idx, "descripcion", e.target.value)
              }
            />
          </div>
        </div>

        {/* Precios */}
        <div className="space-y-2">
          <Label className="text-sm">Precios de esta presentación</Label>
          <AddPrices
            precios={p.precios}
            setPrecios={(next) => onUpdatePrecios(idx, next)}
            variant="embedded"
          />
        </div>

        {/* Imágenes / Cropper */}
        <div className="rounded-lg border bg-background/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const f = Array.from(e.target.files ?? []);
                  if (!f.length) return;
                  setFiles(f);
                  setOpen(true);
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Elegir archivos
              </Button>
              <span className="text-xs text-muted-foreground">
                {cropped.length
                  ? `${cropped.length} archivo(s)`
                  : "Sin imágenes"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                disabled={!files.length}
                className="text-muted-foreground"
              >
                Re-cortar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiles([]);
                  setCropped([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-muted-foreground"
              >
                Limpiar
              </Button>
            </div>
          </div>

          {/* Previews */}
          <div className="px-3 pb-3">
            <CroppedGrid
              files={cropped}
              onRemove={(i) =>
                setCropped((arr) => arr.filter((_, j) => j !== i))
              }
            />
          </div>
        </div>

        {/* Modal cropper */}
        <ProductImagesCropper
          open={open}
          onOpenChange={setOpen}
          files={files}
          onDone={(croppedFiles) => {
            setCropped(croppedFiles);
          }}
        />
      </CardContent>
    </Card>
  );
});
