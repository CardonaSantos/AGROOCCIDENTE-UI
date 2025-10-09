import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import ReactCrop, {
  type Crop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

export type ImageCropperResult = { blob: Blob; width: number; height: number };

export type Output = {
  mode?: "native" | "fit" | "exact";
  width?: number;
  height?: number;
  maxDim?: number;
  allowUpscale?: boolean;
  mime?: "image/jpeg" | "image/png";
  quality?: number;
};

type Props = {
  src: string;
  aspect?: number;
  circularCrop?: boolean;
  minWidth?: number;
  minHeight?: number;
  initial?: Crop; // acepta % o px; usaremos %
  onChange?: (cropPx: PixelCrop, percent: PercentCrop) => void;
  onComplete?: (cropPx: PixelCrop, percent: PercentCrop) => void;
  className?: string;
};

export type ImageCropperHandle = {
  getImageEl: () => HTMLImageElement | null;
  getCrop: () => Crop | null;
  setCrop: (c: Crop) => void;
  reset: (initial?: Crop) => void;
};

const defaultCrop = (aspect?: number): Crop => ({
  unit: "%",
  width: 60,
  height: 60,
  x: 20,
  y: 20,
  ...(aspect ? { aspect } : {}),
});

export const ImageCropper = forwardRef<ImageCropperHandle, Props>(
  function ImageCropper(
    {
      src,
      aspect,
      circularCrop,
      minWidth = 20,
      minHeight = 20,
      initial,
      onChange,
      onComplete,
      className = "max-h-[75vh] w-auto object-contain",
    },
    ref
  ) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>(initial ?? defaultCrop(aspect));

    useEffect(() => {
      setCrop(initial ?? defaultCrop(aspect));
    }, [src, initial, aspect]);

    useImperativeHandle(ref, () => ({
      getImageEl: () => imgRef.current,
      getCrop: () => crop ?? null,
      setCrop: (c: Crop) => setCrop(c),
      reset: (init?: Crop) => setCrop(init ?? defaultCrop(aspect)),
    }));

    return (
      <ReactCrop
        crop={crop}
        onChange={(c, percent) => {
          setCrop(c);
          onChange?.(c as PixelCrop, percent);
        }}
        onComplete={(c, percent) => onComplete?.(c as PixelCrop, percent)}
        circularCrop={circularCrop}
        minWidth={minWidth}
        minHeight={minHeight}
        keepSelection
        ruleOfThirds
        className={className}
      >
        <img ref={imgRef} src={src} alt="" className={className} />
      </ReactCrop>
    );
  }
);

// ===== Export usando PercentCrop =====
export async function exportPercentCropToBlob(
  imageEl: HTMLImageElement,
  percent: PercentCrop,
  out: Output = { mode: "native" }
): Promise<ImageCropperResult> {
  const naturalW = imageEl.naturalWidth;
  const naturalH = imageEl.naturalHeight;

  const sx = Math.round(((percent.x ?? 0) * naturalW) / 100);
  const sy = Math.round(((percent.y ?? 0) * naturalH) / 100);
  const sw = Math.round(((percent.width ?? 0) * naturalW) / 100);
  const sh = Math.round(((percent.height ?? 0) * naturalH) / 100);

  let targetW = sw,
    targetH = sh;
  const mode = out.mode ?? "native";
  if (mode === "exact") {
    targetW = Math.max(1, out.width ?? sw);
    targetH = Math.max(1, out.height ?? sh);
  } else if (mode === "fit") {
    const maxDim = out.maxDim ?? Math.max(sw, sh);
    const r = Math.min(maxDim / sw, maxDim / sh);
    const scale = out.allowUpscale ? r : Math.min(1, r);
    targetW = Math.max(1, Math.round(sw * scale));
    targetH = Math.max(1, Math.round(sh * scale));
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imageEl, sx, sy, sw, sh, 0, 0, targetW, targetH);

  const mime = out.mime ?? "image/jpeg";
  const quality = mime === "image/jpeg" ? out.quality ?? 0.98 : undefined;

  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
      mime,
      quality
    )
  );

  return { blob, width: targetW, height: targetH };
}
