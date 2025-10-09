// CroppedGrid.tsx
import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  files: File[];
  onRemove?: (index: number) => void;
};

export function CroppedGrid({ files, onRemove }: Props) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  // Limpia todos los URLs cuando cambien los files o al desmontar
  useEffect(() => {
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [urls]);

  if (!files.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {urls.map((u, i) => (
        <div
          key={`${files[i].name}-${i}`}
          className="relative aspect-square overflow-hidden rounded-lg border group"
        >
          <img
            src={u}
            alt={files[i].name}
            className="h-full w-full object-cover "
          />

          {/* Botón eliminar (aparece al hover) */}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={`Eliminar ${files[i].name}`}
            className="absolute right-2 top-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition"
            onClick={() => {
              // revocar URL específico y notificar al padre
              URL.revokeObjectURL(u);
              onRemove?.(i);
            }}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Pie con nombre y tamaño */}
          <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white p-1.5 text-[11px] flex items-center justify-between">
            <span className="truncate pr-2">{files[i].name}</span>
            <span className="opacity-80">
              {Math.round(files[i].size / 1024)} KB
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
