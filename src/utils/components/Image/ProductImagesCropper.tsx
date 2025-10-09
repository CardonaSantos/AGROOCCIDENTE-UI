// ProductImagesCropper.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  exportPercentCropToBlob,
  ImageCropper,
  type ImageCropperHandle,
  type Output,
} from "./Cropper";
import type { Crop, PercentCrop } from "react-image-crop";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RefreshCcw,
  EyeOff,
  Eye,
  ImageDown,
  X,
  Maximize2,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  files: File[];
  onDone: (croppedFiles: File[]) => void;
  size?: number;
};

export default function ProductImagesCropper({
  open,
  onOpenChange,
  files,
  onDone,
}: // size, // opcional ahora
Props) {
  const [idx, setIdx] = useState(0);
  const [urls, setUrls] = useState<string[]>([]);
  // ⬇⬇⬇ percent SIEMPRE
  const [crops, setCrops] = useState<(PercentCrop | null)[]>([]);
  const [results, setResults] = useState<(File | null)[]>([]);
  const [omit, setOmit] = useState<boolean[]>([]);
  const cropperRef = useRef<ImageCropperHandle>(null);

  const currentUrl = urls[idx] ?? null;

  // Convierte PercentCrop -> Crop (unit:'%') para pasarlo al cropper
  const toCrop = (pc: PercentCrop | null | undefined): Crop | undefined =>
    pc ? ({ ...pc, unit: "%" } as Crop) : undefined;

  useEffect(() => {
    const u = files.map((f) => URL.createObjectURL(f));
    setUrls((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return u;
    });
    setCrops((prev) =>
      Array.from({ length: files.length }, (_, i) => prev[i] ?? null)
    );
    setResults((prev) =>
      Array.from({ length: files.length }, (_, i) => prev[i] ?? null)
    );
    setOmit((prev) =>
      Array.from({ length: files.length }, (_, i) => prev[i] ?? false)
    );
    setIdx(0);
    return () => u.forEach((x) => URL.revokeObjectURL(x));
  }, [files]);

  const exportOpts = (file: File): Output => ({
    mode: "native",
    mime: file.type === "image/png" ? "image/png" : "image/jpeg",
    quality: file.type === "image/jpeg" ? 0.98 : undefined,
  });

  // PercentCrop SIEMPRE
  const commitCurrent = async (overridePercent?: PercentCrop) => {
    const percent = overridePercent ?? crops[idx];
    const imageEl = cropperRef.current?.getImageEl();
    if (!percent || !imageEl) return;

    const base = files[idx];
    const res = await exportPercentCropToBlob(
      imageEl,
      percent,
      exportOpts(base)
    );
    const name = base.name.replace(/\.[^.]+$/, "");
    const ext = base.type === "image/png" ? "png" : "jpg";
    const file = new File([res.blob], `${name}_crop.${ext}`, {
      type: res.blob.type,
    });

    setResults((prev) => {
      const copy = [...prev];
      copy[idx] = file;
      return copy;
    });
  };

  // Usar imagen completa → con unit:'%'
  const useOriginal = async () => {
    const full: PercentCrop = {
      unit: "%",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
    setCrops((prev) => {
      const copy = [...prev];
      copy[idx] = full;
      return copy;
    });
    await commitCurrent(full);
  };

  const go = async (nextIdx: number) => {
    if (crops[idx] && !results[idx] && !omit[idx]) {
      try {
        await commitCurrent();
      } catch {}
    }
    setIdx(nextIdx);
  };
  const goPrev = () => go(Math.max(0, idx - 1));
  const goNext = () => go(Math.min(files.length - 1, idx + 1));

  const allReady = useMemo(
    () => results.every((r, i) => omit[i] || r instanceof File || !crops[i]),
    [results, crops, omit]
  );

  const confirmAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (!omit[i] && !results[i] && crops[i]) {
        const prev = idx;
        setIdx(i);
        await new Promise((r) => setTimeout(r, 0));
        try {
          await commitCurrent();
        } catch {}
        setIdx(prev);
      }
    }
    const final: File[] = [];
    for (let i = 0; i < files.length; i++) {
      if (omit[i]) continue;
      final.push(results[i] ?? files[i]);
    }
    onDone(final);
    onOpenChange(false);
  };

  const resetCurrent = () =>
    setResults((prev) => {
      const copy = [...prev];
      copy[idx] = null;
      return copy;
    });
  const toggleOmit = () =>
    setOmit((prev) => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  // const handleChangeCrop = () => {
  //   if (results[idx])
  //     setResults((p) => {
  //       const c = [...p];
  //       c[idx] = null;
  //       return c;
  //     });
  // };

  const status = omit[idx]
    ? { text: "Excluida", color: "bg-muted text-muted-foreground" }
    : results[idx]
    ? { text: "Recortada", color: "bg-emerald-600 text-white" }
    : crops[idx]
    ? { text: "Pendiente", color: "bg-amber-500 text-white" }
    : {
        text: "Sin recorte",
        color:
          "bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-50",
      };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[92vw] max-h-[92vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-sm sm:text-base font-medium">
              Imágenes ({idx + 1}/{files.length})
            </DialogTitle>
            <Badge
              className={`h-6 px-2 text-[11px] rounded-full ${status.color}`}
              variant="secondary"
            >
              {status.text}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-rows-[1fr_auto] md:grid-rows-1 md:grid-cols-[1fr_280px] border-t">
          {/* IZQ: Cropper + thumbs */}
          <div className="flex flex-col bg-muted/40">
            <div className="w-full flex items-center justify-center max-h-[62vh] md:max-h-[66vh] overflow-auto p-3 sm:p-4">
              {currentUrl && (
                <ImageCropper
                  ref={cropperRef}
                  src={currentUrl}
                  aspect={1}
                  minWidth={120}
                  minHeight={120}
                  initial={toCrop(crops[idx])}
                  onComplete={(_px, percent) =>
                    setCrops((prev) => {
                      const copy = [...prev];
                      copy[idx] = percent;
                      return copy;
                    })
                  }
                  onChange={() => {
                    if (results[idx]) {
                      setResults((prev) => {
                        const copy = [...prev];
                        copy[idx] = null;
                        return copy;
                      });
                    }
                  }}
                />
              )}
            </div>

            {urls.length > 1 && (
              <>
                <Separator />
                <div className="flex gap-2 p-3 overflow-x-auto bg-background/60">
                  {urls.map((u, i) => (
                    <button
                      key={i}
                      onClick={() => go(i)}
                      className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-md overflow-hidden ring-2 transition ${
                        i === idx
                          ? "ring-primary"
                          : "ring-transparent hover:ring-muted-foreground/20"
                      }`}
                      title={`Imagen ${i + 1}`}
                    >
                      <img
                        src={u}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {omit[i] && (
                        <span className="absolute right-1 top-1 text-[10px] bg-amber-600 text-white px-1 rounded">
                          omit
                        </span>
                      )}
                      {results[i] && !omit[i] && (
                        <span className="absolute right-1 top-1 text-[10px] bg-primary text-white px-1 rounded">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* BARRA INFERIOR mobile */}
            <div className="md:hidden sticky bottom-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
              <div className="flex items-center justify-between px-3 py-2">
                <ToolbarNav
                  onPrev={goPrev}
                  onNext={goNext}
                  onApply={() => commitCurrent()}
                  onReset={resetCurrent}
                  onToggleOmit={toggleOmit}
                  onUseOriginal={useOriginal}
                  canPrev={idx > 0}
                  canNext={idx < files.length - 1}
                  canApply={!!crops[idx] && !omit[idx]}
                  canReset={!!results[idx]}
                  omitted={omit[idx]}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={confirmAll}
                    disabled={!files.length || !allReady}
                    className="gap-1"
                  >
                    <ImageDown className="h-4 w-4" /> Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* DER: Panel acciones (md+) */}
          <div className="hidden md:flex flex-col bg-background border-l">
            <div className="p-3 sm:p-4 space-y-3">
              <TooltipProvider delayDuration={150}>
                <ToolbarNav
                  vertical
                  onPrev={goPrev}
                  onNext={goNext}
                  onApply={() => commitCurrent()}
                  onReset={resetCurrent}
                  onToggleOmit={toggleOmit}
                  onUseOriginal={useOriginal}
                  canPrev={idx > 0}
                  canNext={idx < files.length - 1}
                  canApply={!!crops[idx] && !omit[idx]}
                  canReset={!!results[idx]}
                  omitted={omit[idx]}
                />
              </TooltipProvider>

              <Separator className="my-2" />

              <div className="space-y-2 text-sm">
                <Row l="Índice" r={`${idx + 1} / ${files.length}`} />
                <Row l="Omitida" r={omit[idx] ? "Sí" : "No"} />
                <Row
                  l="Estado"
                  r={
                    results[idx]
                      ? "Recortada"
                      : crops[idx]
                      ? "Pendiente"
                      : "Sin recorte"
                  }
                />
                <Row
                  l="Formato"
                  r={
                    files[idx]?.type?.replace("image/", "").toUpperCase() || "—"
                  }
                />
              </div>
            </div>

            <div className="mt-auto border-t p-3 sm:p-4">
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-1"
                  onClick={confirmAll}
                  disabled={!files.length || !allReady}
                >
                  <ImageDown className="h-4 w-4" /> Guardar lote
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ l, r }: { l: string; r: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{l}</span>
      <span className="font-mono">{r}</span>
    </div>
  );
}

/* ===== Toolbar compacta con "Usar original" ===== */
function ToolbarNav({
  onPrev,
  onNext,
  onApply,
  onReset,
  onToggleOmit,
  onUseOriginal,
  canPrev,
  canNext,
  canApply,
  canReset,
  omitted,
  vertical = false,
}: {
  onPrev: () => void;
  onNext: () => void;
  onApply: () => void;
  onReset: () => void;
  onToggleOmit: () => void;
  onUseOriginal: () => void;
  canPrev: boolean;
  canNext: boolean;
  canApply: boolean;
  canReset: boolean;
  omitted: boolean;
  vertical?: boolean;
}) {
  const Wrap = vertical ? "div" : "div";
  return (
    <Wrap
      className={`inline-flex ${
        vertical ? "flex-col items-stretch gap-2" : "items-center gap-2"
      }`}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            onClick={onPrev}
            disabled={!canPrev}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Anterior</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="default"
            onClick={onApply}
            disabled={!canApply}
            aria-label="Aplicar recorte"
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Aplicar recorte</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            onClick={onNext}
            disabled={!canNext}
            aria-label="Siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Siguiente</TooltipContent>
      </Tooltip>

      <Separator
        orientation={vertical ? "horizontal" : "vertical"}
        className="mx-1"
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            onClick={onReset}
            disabled={!canReset}
            aria-label="Rehacer"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Rehacer recorte</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant={omitted ? "default" : "outline"}
            onClick={onToggleOmit}
            aria-label="Omitir/Incluir"
          >
            {omitted ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {omitted ? "Incluir en lote" : "Excluir del lote"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            onClick={onUseOriginal}
            aria-label="Usar original"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Usar imagen completa</TooltipContent>
      </Tooltip>
    </Wrap>
  );
}
