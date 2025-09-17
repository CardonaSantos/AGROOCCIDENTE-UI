// src/components/navigation/BackButton.tsx
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoBack } from "./useGoBack";

type BackButtonProps = {
  fallback?: string;
  className?: string;
  label?: string;
  placement?: "inline" | "absolute" | "fixed";
  compact?: boolean; // h-7 w-7
};

export function BackButton({
  fallback = "/",
  className,
  label,
  placement = "inline",
  compact = true,
}: BackButtonProps) {
  const goBack = useGoBack(fallback);

  const posClass =
    placement === "absolute"
      ? "absolute"
      : placement === "fixed"
      ? "fixed"
      : "";

  return (
    <Button
      type="button"
      onClick={goBack}
      aria-label={label ?? "Volver"}
      variant="outline"
      size="icon"
      className={cn(
        posClass,
        compact && "h-7 w-7 p-0", // más pequeño que el icon default de shadcn
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label && <span className="ml-2">{label}</span>}
    </Button>
  );
}
