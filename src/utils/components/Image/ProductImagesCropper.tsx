import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageCropper, type ImageCropperResult } from "./Cropper"; // el wrapper que ya tienes
import "react-image-crop/dist/ReactCrop.css";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  files: File[]; // originales (sin recortar)
  onDone: (croppedFiles: File[]) => void; // ⬅️ aquí te devuelvo los Files listos para subir
  size?: number; // tamaño final (ej. 1024)
};

export default function ProductImagesCropper({
  open,
  onOpenChange,
  files,
  onDone,
  size = 1024,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [urls, setUrls] = useState<string[]>([]);
  const [results, setResults] = useState<(File | null)[]>(() =>
    new Array(files.length).fill(null)
  );

  // Crear URLs temporales para cada File
  useEffect(() => {
    const u = files.map((f) => URL.createObjectURL(f));
    setUrls(u);
    return () => u.forEach((x) => URL.revokeObjectURL(x));
  }, [files]);

  const currentUrl = urls[idx];

  const handleComplete = async (res: ImageCropperResult) => {
    // Convertir Blob -> File para subir por FormData
    const ext = res.blob.type.includes("webp") ? "webp" : "jpg";
    const name = (files[idx]?.name ?? `img_${idx}`).replace(/\.[^.]+$/, "");
    const file = new File([res.blob], `${name}_crop.${ext}`, {
      type: res.blob.type,
    });
    setResults((prev) => {
      const copy = [...prev];
      copy[idx] = file;
      return copy;
    });
  };

  const goPrev = () => setIdx((i) => Math.max(0, i - 1));
  const goNext = () => setIdx((i) => Math.min(files.length - 1, i + 1));

  const allCropped = useMemo(
    () => results.every((r) => r instanceof File),
    [results]
  );

  const confirm = () => {
    // Si faltó algún recorte, intenta quedarte con el original tal cual (opcional)
    const fallbacked = results.map((r, i) => r ?? files[i]);
    onDone(fallbacked as File[]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Recortar imágenes de producto ({idx + 1}/{files.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative flex items-center justify-center bg-muted">
            {currentUrl && (
              <ImageCropper
                src={currentUrl}
                aspect={1} // cuadrado
                minWidth={120}
                minHeight={120}
                output={{
                  width: size,
                  height: size,
                  mime: "image/webp", // más pequeño
                  quality: 0.92,
                }}
                onComplete={handleComplete}
              />
            )}
          </div>

          {/* Navegación */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={goPrev} disabled={idx === 0}>
              Anterior
            </Button>
            <div className="text-sm text-muted-foreground">
              {results[idx] ? "✔️ Recortada" : "— Sin recortar —"}
            </div>
            <Button
              variant="outline"
              onClick={goNext}
              disabled={idx === files.length - 1}
            >
              Siguiente
            </Button>
          </div>

          {/* Confirmar */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={confirm} disabled={!allCropped}>
              Guardar {allCropped ? "" : "(hay pendientes)"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
