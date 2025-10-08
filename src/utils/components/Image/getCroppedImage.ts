import { Crop } from "react-image-crop";

export function getCroppedBlob(
  image: HTMLImageElement,
  crop: Crop,
  mime: string = "image/jpeg",
  quality = 0.92
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const px = Math.round((crop.width ?? 0) * scaleX);
  const py = Math.round((crop.height ?? 0) * scaleY);

  canvas.width = px;
  canvas.height = py;

  const ctx = canvas.getContext("2d")!;
  const sx = Math.round((crop.x ?? 0) * scaleX);
  const sy = Math.round((crop.y ?? 0) * scaleY);

  ctx.drawImage(image, sx, sy, px, py, 0, 0, px, py);

  return new Promise((res) => canvas.toBlob((b) => res(b!), mime, quality));
}
