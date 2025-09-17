import type React from "react";
import {
  useState,
  useCallback,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  ZoomIn,
  ZoomOut,
  X,
  RotateCcw,
  Check,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Interfaces
type RawImage = {
  file: File;
  src: string;
};

type CroppedImage = {
  fileName: string;
  blob: Blob;
  url: string;
  originalIndex: number;
};

interface ImageCropperUploaderProps {
  aspectRatio?: number;
  className?: string;
  croppedImages: CroppedImage[];
  setCroppedImages: Dispatch<SetStateAction<CroppedImage[]>>;
}

export const ImageCropperUploader: React.FC<ImageCropperUploaderProps> = ({
  aspectRatio = 4 / 3,
  className,
  croppedImages,
  setCroppedImages,
}) => {
  const [rawImages, setRawImages] = useState<RawImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(
    null
  );
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  // Función para obtener las dimensiones reales de la imagen
  const getImageDimensions = useCallback(
    (src: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = src;
      });
    },
    []
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const arr: RawImage[] = [];

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      const result = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      arr.push({ file, src: result });
    }

    setRawImages(arr);
    setCurrentIndex(0);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setIsEditing(true);
    setEditingImageIndex(null);

    // Obtener dimensiones de la primera imagen
    if (arr.length > 0) {
      const dimensions = await getImageDimensions(arr[0].src);
      setImageDimensions(dimensions);
    }

    // Reset the input so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getCroppedBlob = async (): Promise<Blob | null> => {
    if (!croppedAreaPixels || !imageDimensions) return null;

    const image = new Image();
    image.src =
      isEditing && editingImageIndex !== null
        ? croppedImages[editingImageIndex].url
        : rawImages[currentIndex].src;

    image.crossOrigin = "anonymous";

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Calcular el factor de escala entre la imagen mostrada y la imagen real
    const scaleX = image.naturalWidth / imageDimensions.width;
    const scaleY = image.naturalHeight / imageDimensions.height;

    // Ajustar las dimensiones del área recortada según la escala real
    const realCropWidth = croppedAreaPixels.width * scaleX;
    const realCropHeight = croppedAreaPixels.height * scaleY;
    const realCropX = croppedAreaPixels.x * scaleX;
    const realCropY = croppedAreaPixels.y * scaleY;

    // Configurar el canvas con las dimensiones reales del recorte
    canvas.width = realCropWidth;
    canvas.height = realCropHeight;

    ctx.save();

    // Si hay rotación, aplicarla
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Dibujar la imagen recortada con las dimensiones reales
    ctx.drawImage(
      image,
      realCropX,
      realCropY,
      realCropWidth,
      realCropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.95
      ); // Usar JPEG con alta calidad
    });
  };

  const handleCropSave = async () => {
    const blob = await getCroppedBlob();
    if (!blob) return;

    if (isEditing && editingImageIndex !== null) {
      // Update existing cropped image
      const updatedImages = [...croppedImages];
      URL.revokeObjectURL(updatedImages[editingImageIndex].url);
      updatedImages[editingImageIndex] = {
        ...updatedImages[editingImageIndex],
        blob,
        url: URL.createObjectURL(blob),
      };
      setCroppedImages(updatedImages);
      setIsEditing(false);
      setEditingImageIndex(null);
    } else {
      // Add new cropped image
      const fileName = rawImages[currentIndex].file.name;
      const url = URL.createObjectURL(blob);
      setCroppedImages((prev) => [
        ...prev,
        { fileName, blob, url, originalIndex: currentIndex },
      ]);

      // Move to next image if any
      if (currentIndex < rawImages.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCroppedAreaPixels(null);

        // Obtener dimensiones de la siguiente imagen
        const nextDimensions = await getImageDimensions(
          rawImages[currentIndex + 1].src
        );
        setImageDimensions(nextDimensions);
      } else {
        // Finished all images
        setIsEditing(false);
        setImageDimensions(null);
      }
    }
  };

  const handleCropCancel = () => {
    if (isEditing && editingImageIndex !== null) {
      setIsEditing(false);
      setEditingImageIndex(null);
    } else if (currentIndex < rawImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsEditing(false);
    }

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setImageDimensions(null);
  };

  const handleEditImage = async (index: number) => {
    setEditingImageIndex(index);
    setIsEditing(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);

    // Obtener dimensiones de la imagen a editar
    const dimensions = await getImageDimensions(croppedImages[index].url);
    setImageDimensions(dimensions);
  };

  const handleDeleteImage = (index: number) => {
    const updatedImages = [...croppedImages];
    URL.revokeObjectURL(updatedImages[index].url);
    updatedImages.splice(index, 1);
    setCroppedImages(updatedImages);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handlePrevImage = async () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);

      const dimensions = await getImageDimensions(rawImages[newIndex].src);
      setImageDimensions(dimensions);
    }
  };

  const handleNextImage = async () => {
    if (currentIndex < rawImages.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);

      const dimensions = await getImageDimensions(rawImages[newIndex].src);
      setImageDimensions(dimensions);
    }
  };

  // Calcular altura dinámica basada en las dimensiones de la imagen
  const getCropperHeight = () => {
    if (!imageDimensions) return 300;

    const maxHeight = 400;
    const maxWidth = 600;

    const { width, height } = imageDimensions;
    const imageAspectRatio = width / height;

    if (imageAspectRatio > 1) {
      // Imagen horizontal
      return Math.min(maxWidth / imageAspectRatio, maxHeight);
    } else {
      // Imagen vertical o cuadrada
      return Math.min(maxHeight, maxWidth * imageAspectRatio);
    }
  };

  useEffect(() => {
    return () => {
      croppedImages.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, []);

  return (
    <div className={cn("space-y-2 max-w-4xl mx-auto", className)}>
      {/* File Upload Section */}
      <Card>
        <CardContent className="pt-3 pb-3">
          <div
            className="flex flex-col items-center justify-center py-2 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-5 w-5 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Haz clic para seleccionar imágenes
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={inputRef}
              onChange={handleFileChange}
              className="hidden"
              aria-label="Seleccionar imágenes para recortar"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cropping Interface */}
      {isEditing && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Image Navigation */}
            {editingImageIndex === null && rawImages.length > 1 && (
              <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevImage}
                  disabled={currentIndex === 0}
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm font-medium">
                  Imagen {currentIndex + 1} de {rawImages.length}
                  {imageDimensions && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({imageDimensions.width}×{imageDimensions.height}px)
                    </span>
                  )}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNextImage}
                  disabled={currentIndex === rawImages.length - 1}
                  aria-label="Siguiente imagen"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Cropper con altura dinámica */}
            <div
              className="relative w-full bg-black"
              style={{ height: `${getCropperHeight()}px` }}
            >
              <Cropper
                image={
                  editingImageIndex !== null
                    ? croppedImages[editingImageIndex].url
                    : rawImages[currentIndex]?.src
                }
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit="contain"
                showGrid={true}
              />
            </div>

            {/* Controls */}
            <div className="p-4 space-y-4 bg-white dark:bg-zinc-950">
              {/* Zoom Controls */}
              <div className="flex items-center space-x-4">
                <ZoomOut className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.1}
                    onValueChange={(values: number[]) => setZoom(values[0])}
                    aria-label="Ajustar zoom"
                  />
                </div>
                <ZoomIn className="h-5 w-5 text-gray-500" />
                <span className="text-xs text-gray-500 min-w-[3rem]">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-between">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRotate}
                    aria-label="Rotar imagen 90 grados"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Rotar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                      setRotation(0);
                    }}
                    aria-label="Restablecer ajustes"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restablecer
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCropCancel}
                    aria-label="Cancelar"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCropSave()}
                    aria-label="Usar imagen completa"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Usar completa
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleCropSave}
                    aria-label="Guardar recorte"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {editingImageIndex !== null
                      ? "Actualizar recorte"
                      : "Guardar recorte"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cropped Images Gallery */}
      {croppedImages.length > 0 && (
        <Card>
          <CardContent className="">
            <div className="flex justify-between items-center mb-4 pt-2">
              <h3 className="text-xs">Imágenes recortadas</h3>
              <Badge variant="outline">{croppedImages.length} imágenes</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto max-h-52">
              {croppedImages.map((img, i) => (
                <div
                  key={i}
                  className="group relative border rounded-lg overflow-hidden bg-transparent"
                >
                  <div className="relative">
                    <img
                      src={img.url || "/placeholder.svg"}
                      alt={img.fileName}
                      className="w-full h-48 object-cover"
                    />
                    {/* Image Actions Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40"
                        onClick={() => handleEditImage(i)}
                        aria-label="Editar imagen"
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40"
                        onClick={() => handleDeleteImage(i)}
                        aria-label="Eliminar imagen"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
