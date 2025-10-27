// DescriptionForm.tsx
// ----------------------------------------
// Componente para la sección de descripción de un producto:
// - Stateless: recibe la descripción actual y un callback onChange
// - Renderiza un textarea controlado

"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Text } from "lucide-react";

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export default function DescriptionForm({ value, onChange }: Props) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Descripción</CardTitle>
        <CardDescription>Información detallada del producto</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-2 relative">
          <Label htmlFor="descripcion">Descripción</Label>
          <Text className="absolute right-3 top-9 text-gray-400 h-5 w-5" />
          <Textarea
            id="descripcion"
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Describa el producto"
          />
        </div>
      </CardContent>
    </Card>
  );
}
