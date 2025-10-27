// ImageUploader.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import ProductImagesCropper from "@/utils/components/Image/ProductImagesCropper";
import { CroppedGrid } from "@/utils/components/Image/croppedGrid";
import type {
  UIMedia,
  ExistingImage,
} from "../interfaces/DomainProdPressTypes";

interface Props {
  files: UIMedia[]; // <- ahora acepta ambos
  onDone: (files: UIMedia[]) => void; // <- devuelve mezcla (Files + Existing)
}

// Type guards
const isFile = (x: UIMedia): x is File => x instanceof File;
const isExisting = (x: UIMedia): x is ExistingImage =>
  !!(x as ExistingImage)?.url && typeof (x as ExistingImage).url === "string";

export default function ImageUploader({ files, onDone }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derivados desde el padre
  const existing = (files ?? []).filter(isExisting) as ExistingImage[];
  const fileList = (files ?? []).filter(isFile) as File[];

  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [openCropper, setOpenCropper] = useState(false);
  const [croppedFiles, setCroppedFiles] = useState<File[]>([]);

  // Sincronizar la parte de Files cuando cambie el padre
  useEffect(() => {
    setCroppedFiles(fileList);
  }, [fileList.map((f) => f.name + f.size + f.type).join("|")]);

  // Abrir cropper cuando se elijan archivos
  useEffect(() => {
    if (rawFiles.length > 0) setOpenCropper(true);
  }, [rawFiles]);

  const handleChoose = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files ?? []);
    if (!f.length) return;
    setRawFiles(f);
  };

  const handleClear = () => {
    // Limpia TODO (existentes + nuevos)
    setCroppedFiles([]);
    onDone([]);
    setRawFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDoneCrop = (results: File[]) => {
    setCroppedFiles(results);
    // Conserva las existentes y reemplaza la parte de Files
    onDone([...existing, ...results]);
    setRawFiles([]);
  };

  // Eliminar una imagen existente por índice
  const removeExistingAt = (idx: number) => {
    const nextExisting = existing.filter((_, i) => i !== idx);
    onDone([...nextExisting, ...croppedFiles]);
  };

  // Eliminar un file recortado por índice
  const removeFileAt = (idx: number) => {
    const nextFiles = croppedFiles.filter((_, i) => i !== idx);
    setCroppedFiles(nextFiles);
    onDone([...existing, ...nextFiles]);
  };

  return (
    <div className="rounded-lg border bg-background/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          <Button variant="outline" onClick={handleChoose} type="button">
            Elegir archivos
          </Button>
          <span className="text-xs text-muted-foreground">
            {existing.length + croppedFiles.length
              ? `${existing.length + croppedFiles.length} archivo(s)`
              : "Sin imágenes"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpenCropper(true)}
            disabled={!croppedFiles.length}
            className="text-muted-foreground"
          >
            Re-cortar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground"
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* Previews: primero existentes (URLs), luego files recortados */}
      <div className="px-3 pb-3 space-y-3">
        {/* Existentes */}
        {existing.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {existing.map((img, idx) => (
              <div
                key={img.id ?? img.url + idx}
                className="relative border rounded-md overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name ?? `img-${idx}`}
                  className="w-full h-28 object-cover"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded"
                  onClick={() => removeExistingAt(idx)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Nuevos (Files) usando tu grid existente */}
        <CroppedGrid files={croppedFiles} onRemove={removeFileAt} />
      </div>

      <ProductImagesCropper
        open={openCropper}
        onOpenChange={setOpenCropper}
        files={rawFiles.length ? rawFiles : croppedFiles}
        onDone={handleDoneCrop}
      />
    </div>
  );
}
