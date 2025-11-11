import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// shadcn/ui
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  Package,
  Box,
  Save,
  ArrowLeft,
  Store,
  AlertTriangle,
  Info,
} from "lucide-react";

// Hooks utilitarios del proyecto
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { getApiErrorMessageAxios } from "@/Pages/Utils/UtilsErrorApi";

// ============================
// Tipos de datos
// ============================
export type StockKind = "PRODUCTO" | "PRESENTACION";

export type StockToEditResponse = {
  kind: StockKind; // indica de qué tabla viene el lote
  id: number;
  productoId: number;
  productoNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  cantidad: number; // solo lectura
  fechaIngreso: string; // ISO
  fechaVencimiento?: string | null; // ISO | null
  precioCosto?: number; // solo lectura
  // Campos solo si kind === "PRESENTACION"
  presentacionId?: number;
  presentacionNombre?: string;
  // Extras útiles en UI
  codigoProducto?: string;
};

// ============================
// Esquema del formulario
// ============================
const formSchema = z.object({
  fechaIngreso: z.date(),
  fechaVencimiento: z.date().optional().nullable(),
});

export type StockEditFormValues = z.infer<typeof formSchema>;

// ============================
// Utilitarios
// ============================
function parseISOorNow(v?: string | null) {
  if (!v) return new Date();
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
}

function isoToDateOrUndefined(v?: string | null) {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

// ============================
// Componente principal
// ============================
export default function StockEditing() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const kindParam = search.get("kind") as StockKind | null; // "PRODUCTO" | "PRESENTACION" | null
  const qk = useMemo(
    () => ["stock:get-to-edit", Number(id), kindParam],
    [id, kindParam]
  );

  const { data, isPending, error, refetch } = useApiQuery<StockToEditResponse>(
    [qk, id, kindParam],
    `/stock/get-stock-to-edit/${id}${kindParam ? `?kind=${kindParam}` : ""}`,
    undefined,
    {
      staleTime: 0,
      refetchOnWindowFocus: "always",
    }
  );

  const navigate = useNavigate();
  const stockId = id ? Number(id) : 0;

  const { mutateAsync: patchStock } = useApiMutation<any, any>(
    "patch",
    "stock/update-stock-dates"
  );
  // qk as any,
  // { url: `/stock/get-stock-to-edit/${stockId}`, enabled: !!stockId }

  const form = useForm<StockEditFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fechaIngreso: new Date(),
      fechaVencimiento: undefined,
    },
    values: data
      ? {
          fechaIngreso: parseISOorNow(data.fechaIngreso),
          fechaVencimiento:
            isoToDateOrUndefined(data.fechaVencimiento) ?? undefined,
        }
      : undefined,
  });

  const kindBadge = (kind?: StockKind) => {
    if (!kind) return null;
    return (
      <Badge
        variant={kind === "PRODUCTO" ? "default" : "secondary"}
        className="rounded-full gap-1"
      >
        {kind === "PRODUCTO" ? (
          <Package className="h-3.5 w-3.5" />
        ) : (
          <Box className="h-3.5 w-3.5" />
        )}
        {kind === "PRODUCTO" ? "Lote de producto" : "Lote de presentación"}
      </Badge>
    );
  };

  const onSubmit = async (values: StockEditFormValues) => {
    if (!data) return;

    const payload = {
      id: stockId,
      kind: data.kind, // 'PRODUCTO' | 'PRESENTACION'
      fechaIngreso: values.fechaIngreso.toISOString(),
      fechaVencimiento: values.fechaVencimiento
        ? values.fechaVencimiento.toISOString()
        : null,
    };

    toast.promise(patchStock(payload), {
      loading: "Ajustando stock...",
      success: "Stock Ajustado",
      error: (error) => getApiErrorMessageAxios(error),
    });
  };

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Volver
          </Button>
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <CardDescription>
              <Skeleton className="mt-2 h-4 w-80" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Skeleton className="h-10 w-36" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Volver
          </Button>
        </div>
        <Alert variant="destructive" className="border-destructive/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No se pudo cargar el stock</AlertTitle>
          <AlertDescription>
            Ocurrió un problema al obtener la información. Intenta nuevamente.
          </AlertDescription>
        </Alert>
        <div className="mt-3">
          <Button variant="outline" onClick={() => refetch?.()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const readOnlyRows = [
    { label: "Producto", value: data.productoNombre },
    { label: "Sucursal", value: data.sucursalNombre },
    data.presentacionNombre
      ? { label: "Presentación", value: data.presentacionNombre }
      : null,
    data.codigoProducto
      ? { label: "Código", value: data.codigoProducto }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <div className="flex items-center gap-2">{kindBadge(data.kind)}</div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {data.kind === "PRODUCTO" ? (
              <Package className="h-5 w-5" />
            ) : (
              <Box className="h-5 w-5" />
            )}
            Editar lote #{data.id}
          </CardTitle>
          <CardDescription>
            Actualiza únicamente las fechas del lote. La cantidad es de solo
            lectura para evitar inconsistencias.
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="space-y-6 pt-6">
          {/* Resumen */}
          <section className="grid gap-4 sm:grid-cols-2">
            {readOnlyRows.map((r) => (
              <div key={r.label} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className="font-medium leading-tight">{r.value}</span>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Cantidad</span>
              <Input value={data.cantidad} readOnly className="h-9" />
            </div>
            {typeof data.precioCosto === "number" && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Precio costo
                </span>
                <Input
                  value={data.precioCosto.toFixed(2)}
                  readOnly
                  className="h-9"
                />
              </div>
            )}
          </section>

          <Separator />

          {/* Formulario */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Fecha de ingreso */}
                <FormField
                  control={form.control}
                  name="fechaIngreso"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de ingreso</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                field.value.toLocaleDateString()
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            locale={es}
                            mode="single"
                            selected={field.value}
                            onSelect={(d) => field.onChange(d ?? new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha de caducidad */}
                <FormField
                  control={form.control}
                  name="fechaVencimiento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de caducidad</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                field.value.toLocaleDateString()
                              ) : (
                                <span>Sin fecha (opcional)</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            locale={es}
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={(d) => field.onChange(d ?? null)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Cuidado con la trazabilidad</AlertTitle>
                <AlertDescription>
                  Cambiar la <strong>fecha de ingreso</strong> o la{" "}
                  <strong>fecha de caducidad</strong> afecta reportes de
                  inventario y alertas de vencimiento.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" /> Guardar cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" /> {data.sucursalNombre}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
