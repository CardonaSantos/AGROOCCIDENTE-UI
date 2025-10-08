import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

export type ImageCropperResult = {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
};

type ImageCropperProps = {
  src: string;
  aspect?: number; // ej. 1, 4/3, 16/9
  circularCrop?: boolean; // recorte “redondo” (overlay + preview circular)
  minWidth?: number; // en px (en el espacio mostrado)
  minHeight?: number;
  output?: {
    // tamaño final opcional (re-escala el crop)
    width?: number;
    height?: number;
    mime?: "image/jpeg" | "image/png" | "image/webp";
    quality?: number; // 0..1
  };
  initial?: Crop;
  onChange?: (crop: Crop) => void;
  onComplete?: (res: ImageCropperResult, crop: Crop) => void;
};

export function ImageCropper({
  src,
  aspect,
  circularCrop,
  minWidth = 20,
  minHeight = 20,
  output,
  initial,
  onChange,
  onComplete,
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>(
    initial ?? {
      unit: "%",
      width: 60,
      height: 60,
      x: 20,
      y: 20,
      ...(aspect ? { aspect } : {}),
    }
  );
  const [completed, setCompleted] = useState<Crop>();

  useEffect(() => {
    if (!completed || !imgRef.current || !onComplete) return;

    const run = async () => {
      const result = await toBlob(imgRef.current!, completed, output);
      onComplete(result, completed);
    };
    void run();
  }, [completed, onComplete, output]);

  return (
    <ReactCrop
      crop={crop}
      onChange={(c) => {
        setCrop(c);
        onChange?.(c);
      }}
      onComplete={(c) => setCompleted(c)}
      circularCrop={circularCrop}
      minWidth={minWidth}
      minHeight={minHeight}
      keepSelection
      ruleOfThirds
    >
      <img ref={imgRef} src={src} alt="" />
    </ReactCrop>
  );
}

// helpers
async function toBlob(
  image: HTMLImageElement,
  crop: Crop,
  out?: { width?: number; height?: number; mime?: string; quality?: number }
): Promise<ImageCropperResult> {
  const mime = out?.mime ?? "image/jpeg";
  const quality = out?.quality ?? 0.92;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const sx = Math.round((crop.x ?? 0) * scaleX);
  const sy = Math.round((crop.y ?? 0) * scaleY);
  const sw = Math.round((crop.width ?? 0) * scaleX);
  const sh = Math.round((crop.height ?? 0) * scaleY);

  const targetW = out?.width ?? sw;
  const targetH = out?.height ?? sh;

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, targetW, targetH);

  const blob: Blob = await new Promise((res) =>
    canvas.toBlob((b) => res(b!), mime, quality)
  );
  const dataUrl = canvas.toDataURL(mime, quality);

  return { blob, dataUrl, width: targetW, height: targetH };
}

// import "react-image-crop/dist/ReactCrop.css";
// import React, { useRef, useState, useEffect } from "react";
// import ReactCrop, { type Crop } from "react-image-crop";

// type Props = { src: string };

// export default function BasicCrop({ src }: Props) {
//   const [crop, setCrop] = useState<Crop>({
//     unit: "%", // Can be 'px' or '%'
//     x: 25,
//     y: 25,
//     width: 50,
//     height: 50,
//   });
//   const [completedCrop, setCompletedCrop] = useState<Crop>();
//   const imgRef = useRef<HTMLImageElement>(null);

//   return (
//     <div className="max-w-xl">
//       <ReactCrop
//         crop={crop}
//         onChange={(c) => setCrop(c)}
//         onComplete={(c) => setCompletedCrop(c)}
//         // extras útiles más abajo
//       >
//         <img ref={imgRef} src={src} alt="to crop" />
//       </ReactCrop>
//     </div>
//   );
// }
