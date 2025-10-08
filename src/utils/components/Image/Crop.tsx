import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider"; // opcional si luego quieres controlar zoom fuera
import "react-image-crop/dist/ReactCrop.css";
import { fileToDataURL } from "./fileToDataURL";
import { ImageCropper, ImageCropperResult } from "./Cropper";

export default function AvatarCropperDemo() {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string>(""); // imagen de entrada (dataURL/URL)
  const [result, setResult] = useState<ImageCropperResult | null>(null); // salida
  const [uploading, setUploading] = useState(false);

  // 1) seleccionar archivo
  const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await fileToDataURL(f);
    setSrc(url);
    setResult(null);
    setOpen(true);
  };

  // 2) manejar resultado del crop (Blob + DataURL)
  const handleComplete = (res: ImageCropperResult) => {
    setResult(res); // res.dataUrl para preview, res.blob para subir
  };

  // 3) simular subida (usa tu API / Cloudinary)
  const onConfirm = async () => {
    if (!result) return;
    setUploading(true);
    try {
      const file = new File([result.blob], "avatar.jpg", {
        type: result.blob.type,
      });
      const fd = new FormData();
      fd.append("file", file);
      // await axios.post("/upload", fd) …
      // o Cloudinary: fd.append("upload_preset","..."); fetch("https://api.cloudinary.com/v1_1/<cloud>/image/upload",{ method:"POST", body: fd })

      // listo:
      setOpen(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* botón / input de selección */}
      <div className="flex items-center gap-2">
        <input type="file" accept="image/*" onChange={onSelectFile} />
        {result && (
          <img
            src={result.dataUrl}
            alt="preview"
            className="h-16 w-16 rounded-full object-cover border"
          />
        )}
      </div>

      {/* diálogo de recorte */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Recortar imagen</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Contenedor responsivo para el cropper */}
            <div className="relative w-full h-80 rounded-md overflow-hidden bg-muted">
              {src && (
                <ImageCropper
                  src={src}
                  aspect={1} // 1:1 para avatar (puedes cambiar a 16/9, 4/3, etc.)
                  //   circularCrop // overlay circular (opcional)

                  minWidth={200} // evita crops muy pequeños
                  minHeight={200}
                  output={{
                    // tamaño de salida estandarizado
                    width: 1024,
                    height: 1024,
                    mime: "image/jpeg",
                    quality: 0.92,
                  }}
                  onComplete={handleComplete} // se ejecuta al soltar/terminar
                />
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={uploading}
              >
                Cancelar
              </Button>
              <Button onClick={onConfirm} disabled={!result || uploading}>
                {uploading ? "Subiendo..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
