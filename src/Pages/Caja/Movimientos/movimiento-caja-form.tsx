"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  DollarSign,
  Building2,
  CreditCard,
  FileText,
  Hash,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  type CrearMovimientoFinancieroDto,
  type MovimientoFinancieroFormProps,
  type MotivoMovimiento,
  type MetodoPago,
  type GastoOperativoTipo,
  type CostoVentaTipo,
  type CajaAbierta,
  MOTIVO_OPTIONS,
  METODO_PAGO_OPTIONS,
  UI_RULES,
} from "./movimientos-financieros";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createMovimientoFinanciero } from "./api";
import { useStore } from "@/components/Context/ContextSucursal";
import { getUltimaCajaAbierta } from "../api";
import { formattFechaWithMinutes } from "@/Pages/Utils/Utils";

// Opciones para subtipos
const GASTO_OPERATIVO_OPTIONS: Array<{
  value: GastoOperativoTipo;
  label: string;
}> = [
  { value: "SALARIO", label: "Salario" },
  { value: "ENERGIA", label: "Energía" },
  { value: "LOGISTICA", label: "Logística" },
  { value: "RENTA", label: "Renta" },
  { value: "INTERNET", label: "Internet" },
  { value: "PUBLICIDAD", label: "Publicidad" },
  { value: "VIATICOS", label: "Viáticos" },
  { value: "OTROS", label: "Otros" },
];

const COSTO_VENTA_OPTIONS: Array<{ value: CostoVentaTipo; label: string }> = [
  { value: "MERCADERIA", label: "Mercadería" },
  { value: "FLETE", label: "Flete" },
  { value: "ENCOMIENDA", label: "Encomienda" },
  { value: "TRANSPORTE", label: "Transporte" },
  { value: "OTROS", label: "Otros" },
];

const MOTIVO_VALUES = [
  // "OTRO_INGRESO",
  "GASTO_OPERATIVO",
  "COMPRA_MERCADERIA",
  "COSTO_ASOCIADO",
  "DEPOSITO_CIERRE",
  "DEPOSITO_PROVEEDOR",
  "PAGO_PROVEEDOR_BANCO",
  "AJUSTE_SOBRANTE",
  "AJUSTE_FALTANTE",
  "DEVOLUCION",
  "BANCO_A_CAJA",
] as const;

const METODO_PAGO_VALUES = [
  "EFECTIVO",
  "TRANSFERENCIA",
  "DEPOSITO",
  "TARJETA",
  "CHEQUE",
  "OTRO",
] as const;

const GASTO_OPERATIVO_VALUES = [
  "SALARIO",
  "ENERGIA",
  "LOGISTICA",
  "RENTA",
  "INTERNET",
  "PUBLICIDAD",
  "VIATICOS",
  "OTROS",
] as const;

const COSTO_VENTA_VALUES = [
  "MERCADERIA",
  "FLETE",
  "ENCOMIENDA",
  "TRANSPORTE",
  "OTROS",
] as const;

// Schema de validación dinámico
const createValidationSchema = (
  motivo?: MotivoMovimiento,
  metodoPago?: MetodoPago,
  isDepositoCierreTotal?: boolean,
  efectivoDisponible?: number
) => {
  const rules = motivo ? UI_RULES[motivo] : null;

  return z.object({
    // ✔️ ahora sí matchea el overload correcto
    motivo: z.enum(MOTIVO_VALUES, { message: "El motivo es requerido" }),

    metodoPago: z
      .enum(METODO_PAGO_VALUES) // puedes añadir { message: "..."} si quieres
      .optional()
      .refine((val) => {
        if (
          motivo === "DEPOSITO_CIERRE" ||
          motivo === "PAGO_PROVEEDOR_BANCO" ||
          motivo === "BANCO_A_CAJA"
        ) {
          return val === "TRANSFERENCIA" || val === "DEPOSITO";
        }
        return true;
      }, "Método de pago inválido para este motivo"),

    monto: z
      .number()
      .refine((val) => {
        if (motivo === "DEPOSITO_CIERRE" && isDepositoCierreTotal) {
          return true;
        }
        return val > 0;
      }, "El monto debe ser mayor a 0")
      .refine((val) => {
        if (
          motivo === "DEPOSITO_CIERRE" &&
          !isDepositoCierreTotal &&
          typeof efectivoDisponible === "number"
        ) {
          return val <= efectivoDisponible;
        }
        return true;
      }, `No puedes depositar más de Q ${efectivoDisponible?.toFixed(2) || 0}`),

    descripcion: z.string().optional(),
    referencia: z.string().optional(),

    proveedorId: z
      .number()
      .optional()
      .refine((val) => {
        if (rules?.requireProveedor) return val !== undefined;
        return true;
      }, "Proveedor es requerido"),

    cuentaBancariaId: z
      .number()
      .optional()
      .refine((val) => {
        if (typeof rules?.requireCuenta === "function") {
          return rules.requireCuenta(metodoPago) ? val !== undefined : true;
        }
        if (rules?.requireCuenta === true) return val !== undefined;
        return true;
      }, "Cuenta bancaria es requerida"),

    gastoOperativoTipo: z
      .enum(GASTO_OPERATIVO_VALUES)
      .optional()
      .refine((val) => {
        if (rules?.requireSubtipoGO) return val !== undefined;
        return true;
      }, "Subtipo de gasto operativo es requerido"),

    costoVentaTipo: z
      .enum(COSTO_VENTA_VALUES)
      .optional()
      .refine((val) => {
        if (rules?.requireCostoVentaTipo) return val !== undefined;
        return true;
      }, "Tipo de costo de venta es requerido"),
  });
};

type FormData = z.infer<ReturnType<typeof createValidationSchema>>;

export function MovimientoFinancieroForm({
  userID,
  proveedores,
  cuentasBancarias,
  getPreviaCerrar,
  reloadContext,
}: MovimientoFinancieroFormProps) {
  const sucursalID = useStore((state) => state.sucursalId) ?? 0;

  const [cajaAbierta, setCajaAbierta] = useState<CajaAbierta | null>(null);
  const [efectivoDisponible, setEfectivoDisponible] = useState<number | null>(
    null
  );
  const [isDepositoCierreTotal, setIsDepositoCierreTotal] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(
      createValidationSchema(
        undefined,
        undefined,
        isDepositoCierreTotal,
        efectivoDisponible || undefined
      )
    ),
    defaultValues: {
      motivo: undefined,
      metodoPago: undefined,
      monto: 0,
      descripcion: "",
      referencia: "",
    },
  });

  const watchedMotivo = form.watch("motivo");
  const watchedMetodoPago = form.watch("metodoPago");
  const watchedMonto = form.watch("monto");

  // Obtener reglas UI para el motivo actual
  const currentRules = watchedMotivo ? UI_RULES[watchedMotivo] : null;

  // Verificar si necesita caja abierta
  const needsCaja = currentRules?.needsCajaIf
    ? typeof currentRules.needsCajaIf === "function"
      ? currentRules.needsCajaIf(watchedMetodoPago)
      : currentRules.needsCajaIf
    : false;

  const loadCajaAbierta = async (): Promise<CajaAbierta | null> => {
    try {
      return await getUltimaCajaAbierta(sucursalID, userID);
    } catch (error) {
      console.error("Error al cargar caja abierta:", error);
      return null;
    }
  };

  // Cargar caja abierta cuando sea necesario
  useEffect(() => {
    if (needsCaja) {
      loadCajaAbierta().then((data) => {
        if (data) setCajaAbierta(data);
      });
    }
  }, [needsCaja]);

  // Forzar método de pago para ciertos motivos
  useEffect(() => {
    if (
      watchedMotivo === "DEPOSITO_CIERRE" ||
      watchedMotivo === "PAGO_PROVEEDOR_BANCO" ||
      watchedMotivo === "BANCO_A_CAJA" // 👈 agrega esto . nuevo
    ) {
      form.setValue("metodoPago", "TRANSFERENCIA");
    }
  }, [watchedMotivo, form]);

  // Cargar previa de cierre cuando sea necesario
  const loadPreviaCierre = async () => {
    if (!getPreviaCerrar) return;

    setLoadingPreview(true);
    try {
      const data = await getPreviaCerrar(sucursalID);
      setEfectivoDisponible(data.efectivoDisponible);
    } catch (error) {
      toast.error("Error al cargar la previa de cierre");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleToggleDepositoCierre = async (isTotal: boolean) => {
    setIsDepositoCierreTotal(isTotal);
    if (isTotal) {
      await loadPreviaCierre();
      if (typeof efectivoDisponible === "number") {
        form.setValue("monto", efectivoDisponible); // 👈 monto total
      }
    } else {
      form.setValue("monto", 0);
      await loadPreviaCierre();
    }
  };

  // Limpiar campos cuando cambia el motivo
  useEffect(() => {
    form.setValue("proveedorId", undefined);
    form.setValue("cuentaBancariaId", undefined);
    form.setValue("gastoOperativoTipo", undefined);
    form.setValue("costoVentaTipo", undefined);

    // Resetear depósito de cierre
    if (watchedMotivo === "DEPOSITO_CIERRE") {
      setIsDepositoCierreTotal(true);
      setEfectivoDisponible(null);
    }
  }, [watchedMotivo, form]);

  // Validar y enviar
  const onSubmit = () => {
    // Validar caja abierta si es necesaria
    if (needsCaja && !cajaAbierta) {
      toast.error("No hay una caja abierta. Abre una caja antes de continuar.");
      return;
    }

    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    const data = form.getValues();
    setIsSubmitting(true);
    setIsConfirmDialogOpen(false);

    try {
      // Construir payload
      const payload: CrearMovimientoFinancieroDto = {
        sucursalId: sucursalID,
        usuarioId: userID,
        motivo: data.motivo!,
        metodoPago: data.metodoPago,
        monto: data.monto,
        descripcion: data.descripcion,
        referencia: data.referencia,
      };

      // Agregar registroCajaId si necesita caja
      if (needsCaja && cajaAbierta) {
        payload.registroCajaId = cajaAbierta.id;
      }

      // Agregar campos relacionales
      if (data.proveedorId) payload.proveedorId = data.proveedorId;
      if (data.cuentaBancariaId)
        payload.cuentaBancariaId = data.cuentaBancariaId;
      if (data.gastoOperativoTipo)
        payload.gastoOperativoTipo = data.gastoOperativoTipo;
      if (data.costoVentaTipo) payload.costoVentaTipo = data.costoVentaTipo;

      // Agregar flags especiales
      if (currentRules?.flags?.esDepositoCierre) {
        payload.esDepositoCierre = true;
      }
      if (currentRules?.flags?.esDepositoProveedor) {
        payload.esDepositoProveedor = true;
      }

      console.log("La data es: ", payload);

      await createMovimientoFinanciero(payload);

      toast.success("Movimiento financiero registrado exitosamente");

      // Resetear formulario
      form.reset();
      setIsDepositoCierreTotal(true);
      setEfectivoDisponible(null);
      setCajaAbierta(null);

      // Recargar contexto si está disponible
      if (reloadContext) {
        await reloadContext();
      }
    } catch (error: any) {
      toast.error(error?.message || "Error al registrar el movimiento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <DollarSign className="h-5 w-5" />
            Registrar Movimiento Financiero
          </CardTitle>
          <CardDescription className="text-center">
            Completa los detalles para registrar un nuevo movimiento financiero
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Fila 1: Motivo y Método de Pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Motivo del Movimiento
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el motivo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOTIVO_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metodoPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Método de Pago
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={
                          watchedMotivo === "DEPOSITO_CIERRE" ||
                          watchedMotivo === "PAGO_PROVEEDOR_BANCO"
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {METODO_PAGO_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fila 2: Campos condicionales (Proveedor, Subtipos) y Monto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda: Campos condicionales */}
                <div className="space-y-4">
                  {/* Proveedor */}
                  {currentRules?.requireProveedor && (
                    <FormField
                      control={form.control}
                      name="proveedorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proveedor</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un proveedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {proveedores.map((proveedor) => (
                                <SelectItem
                                  key={proveedor.id}
                                  value={proveedor.id.toString()}
                                >
                                  {proveedor.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Subtipo Gasto Operativo */}
                  {currentRules?.requireSubtipoGO && (
                    <FormField
                      control={form.control}
                      name="gastoOperativoTipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Gasto Operativo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GASTO_OPERATIVO_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Subtipo Costo de Venta */}
                  {currentRules?.requireCostoVentaTipo && (
                    <FormField
                      control={form.control}
                      name="costoVentaTipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Costo de Venta</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COSTO_VENTA_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Columna derecha: Monto y controles */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="monto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Monto
                        </FormLabel>
                        <FormControl>
                          {watchedMotivo === "DEPOSITO_CIERRE" &&
                          isDepositoCierreTotal ? (
                            <Input
                              disabled
                              value="Se calculará automáticamente"
                              className="text-muted-foreground"
                            />
                          ) : (
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Controles de depósito de cierre */}
                  {watchedMotivo === "DEPOSITO_CIERRE" && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="deposito-total"
                          checked={isDepositoCierreTotal}
                          onCheckedChange={handleToggleDepositoCierre}
                        />
                        <Label htmlFor="deposito-total" className="text-sm">
                          Depósito total (automático)
                        </Label>
                      </div>

                      {!isDepositoCierreTotal && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          {loadingPreview ? (
                            <p>Calculando efectivo disponible...</p>
                          ) : efectivoDisponible !== null ? (
                            <>
                              <p>
                                Efectivo disponible:{" "}
                                <strong>
                                  Q {efectivoDisponible.toFixed(2)}
                                </strong>
                              </p>
                              <p>
                                Saldo tras depósito:{" "}
                                <strong>
                                  Q{" "}
                                  {(efectivoDisponible - watchedMonto).toFixed(
                                    2
                                  )}
                                </strong>
                              </p>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Cuenta Bancaria */}
              {currentRules?.requireCuenta && (
                <FormField
                  control={form.control}
                  name="cuentaBancariaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Cuenta Bancaria
                      </FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una cuenta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cuentasBancarias.map((cuenta) => (
                            <SelectItem
                              key={cuenta.id}
                              value={cuenta.id.toString()}
                            >
                              {cuenta.alias} - {cuenta.banco}{" "}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Descripción y Referencia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descripción del movimiento"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Referencia (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Número de referencia" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Alertas de estado */}
              {needsCaja && !cajaAbierta && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    No hay una caja abierta. Abre una caja antes de continuar.
                  </span>
                </div>
              )}

              {needsCaja && cajaAbierta && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Caja abierta disponible (
                    {formattFechaWithMinutes(cajaAbierta.fechaApertura)})
                  </span>
                </div>
              )}

              {/* Botón de envío */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || (needsCaja && !cajaAbierta)}
              >
                {isSubmitting ? "Registrando..." : "Registrar Movimiento"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Registro</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas registrar este movimiento financiero?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>

            <Button onClick={handleConfirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
