"use client";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { CerrarCajaV2Dto, PreviaCierreResponse } from "./cierre.types";
import { cerrarCajaV2 } from "./caja.api";
import { getPreviaCierre } from "./types2";
import { CuentasBancariasSelect } from "@/Types/CuentasBancarias/CuentasBancariasSelect";

// ------------------------------------------------------
// Types locales
// ------------------------------------------------------

type CuentaBancaria = {
  id: number;
  banco: string;
  numero: string;
  alias?: string | null;
};

type CierreCajaDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  registroCajaId: number;
  usuarioCierreId: number;
  cuentasBancarias: CuentaBancaria[];
  onClosed?: () => void;
  reloadContext: () => Promise<void>;
  //nuevos
  cuentas: CuentasBancariasSelect[];
};

const ComprobanteTipoZ = z.enum([
  "DEPOSITO_BOLETA",
  "TRANSFERENCIA",
  "CHEQUE",
  "TARJETA_VOUCHER",
  "OTRO",
]);

// ------------------------------------------------------
// Schema (sin dependencias fuertes de `previa` para evitar
// problemas al rehidratar el resolver). Hacemos clamps en UI + server.
// ------------------------------------------------------
// const schemaBase = z.object({
//   modo: z.enum([
//     "SIN_DEPOSITO",
//     "DEPOSITO_PARCIAL",
//     "DEPOSITO_TODO",
//     "CAMBIO_TURNO",
//   ] as const),
//   comentarioFinal: z.string().optional(),

//   // Depósito
//   cuentaBancariaId: z.number().optional(),
//   montoParcial: z.number().optional(),

//   // Nuevos
//   dejarEnCaja: z.number().min(0, "No puede ser negativo"),
//   asentarVentas: z.boolean(), // <- antes tenía .default(true)

//   // Cambio de turno
//   abrirSiguiente: z.boolean().optional(),
//   usuarioInicioSiguienteId: z.number().optional(),
//   fondoFijoSiguiente: z.number().optional(),
//   comentarioAperturaSiguiente: z.string().optional(),
// });

const schemaBase = z
  .object({
    modo: z.enum([
      "SIN_DEPOSITO",
      "DEPOSITO_PARCIAL",
      "DEPOSITO_TODO",
      "CAMBIO_TURNO",
    ] as const),
    comentarioFinal: z.string().optional(),

    // Depósito
    cuentaBancariaId: z.number().optional(),
    montoParcial: z.number().optional(),

    // Nuevos (boleta/transferencia)
    comprobanteTipo: ComprobanteTipoZ.optional(),
    comprobanteNumero: z.string().trim().optional(),
    comprobanteFecha: z.string().trim().optional(), // "YYYY-MM-DD" del <input type="date">

    // Nuevos
    dejarEnCaja: z.number().min(0, "No puede ser negativo"),
    asentarVentas: z.boolean(),

    // Cambio de turno
    abrirSiguiente: z.boolean().optional(),
    usuarioInicioSiguienteId: z.number().optional(),
    fondoFijoSiguiente: z.number().optional(),
    comentarioAperturaSiguiente: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const requiereDeposito =
      data.modo === "DEPOSITO_PARCIAL" || data.modo === "DEPOSITO_TODO";

    if (requiereDeposito) {
      if (!data.cuentaBancariaId) {
        ctx.addIssue({
          path: ["cuentaBancariaId"],
          code: z.ZodIssueCode.custom,
          message: "Cuenta bancaria requerida",
        });
      }
      if (!data.comprobanteTipo) {
        ctx.addIssue({
          path: ["comprobanteTipo"],
          code: z.ZodIssueCode.custom,
          message: "Tipo de comprobante requerido",
        });
      }
      if (!data.comprobanteNumero || data.comprobanteNumero.trim().length < 3) {
        ctx.addIssue({
          path: ["comprobanteNumero"],
          code: z.ZodIssueCode.custom,
          message: "Número de comprobante requerido (mín. 3 caract.)",
        });
      }
    }

    if (data.modo === "DEPOSITO_PARCIAL") {
      if (!data.montoParcial || data.montoParcial <= 0) {
        ctx.addIssue({
          path: ["montoParcial"],
          code: z.ZodIssueCode.custom,
          message: "Monto debe ser > 0",
        });
      }
    }
  });

type CierreCajaFormData = z.infer<typeof schemaBase>;

export function CierreCajaDialog({
  open,
  onOpenChange,
  registroCajaId,
  usuarioCierreId,
  // cuentasBancarias,
  onClosed,
  reloadContext,
  cuentas,
}: CierreCajaDialogProps) {
  const [previa, setPrevia] = useState<PreviaCierreResponse | null>(null);
  const [isLoadingPrevia, setIsLoadingPrevia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CierreCajaFormData>({
    resolver: zodResolver(schemaBase),
    defaultValues: {
      modo: "SIN_DEPOSITO",
      abrirSiguiente: true,
      dejarEnCaja: 0,
      asentarVentas: true, // <- default aquí
    },
  });

  console.log("cuentas bancarias en cerrar caja son: ", cuentas);

  const watched = form.watch();

  // Cargar previa al abrir el modal
  useEffect(() => {
    if (open && registroCajaId) {
      setIsLoadingPrevia(true);
      getPreviaCierre(registroCajaId)
        .then((data) => {
          setPrevia(data);
          // setear defaults dependientes de `previa`
          form.setValue("dejarEnCaja", Number(data.fondoFijoActual ?? 0));
          form.setValue(
            "fondoFijoSiguiente",
            Number(data.fondoFijoActual ?? 0)
          );
        })
        .catch((error) => {
          console.error("Error cargando previa:", error);
          toast.error("Error al cargar información de caja");
        })
        .finally(() => {
          setIsLoadingPrevia(false);
        });
    }
  }, [open, registroCajaId]);

  // Valores calculados de negocio
  const enCaja = Number(previa?.enCaja ?? 0);
  const dejarEnCaja = Number(watched.dejarEnCaja ?? 0);
  const disponibleOperable = Math.max(0, enCaja - dejarEnCaja);

  const requiereDeposito = ["DEPOSITO_PARCIAL", "DEPOSITO_TODO"].includes(
    watched.modo
  );

  const calcularDeposito = (): number => {
    if (!previa) return 0;
    if (watched.modo === "DEPOSITO_TODO") return disponibleOperable;
    if (watched.modo === "DEPOSITO_PARCIAL") {
      const v = Number(watched.montoParcial || 0);
      return Math.min(Math.max(v, 0), disponibleOperable);
    }
    return 0;
  };

  const depositoCalculado = calcularDeposito();
  const saldoFinalEsperado = enCaja - depositoCalculado; // saldo físico al cierre

  // Validaciones adicionales a nivel UI (además de zod + clamps en server)
  const cuentaRequeridaError =
    requiereDeposito && !watched.cuentaBancariaId
      ? "Cuenta bancaria requerida"
      : null;
  const montoParcialError =
    watched.modo === "DEPOSITO_PARCIAL" &&
    Number(watched.montoParcial || 0) <= 0
      ? "Monto debe ser > 0"
      : null;

  // Enviar
  // Enviar
  const onSubmit: SubmitHandler<CierreCajaFormData> = async (data) => {
    if (!previa) return;

    // Recalcular con los valores actuales del form (robusto)
    const enCajaLocal = Number(previa.enCaja ?? 0);
    const dejarEnCajaLocal = Number(data.dejarEnCaja ?? 0);
    const disponibleOperableLocal = Math.max(0, enCajaLocal - dejarEnCajaLocal);

    const esDeposito =
      data.modo === "DEPOSITO_PARCIAL" || data.modo === "DEPOSITO_TODO";

    let depositoCalculadoLocal = 0;
    if (data.modo === "DEPOSITO_TODO") {
      depositoCalculadoLocal = disponibleOperableLocal;
    } else if (data.modo === "DEPOSITO_PARCIAL") {
      const v = Number(data.montoParcial || 0);
      depositoCalculadoLocal = Math.min(
        Math.max(v, 0),
        disponibleOperableLocal
      );
    }

    // Validaciones ligeras; el server re-clamp y valida igualmente
    if (esDeposito && !data.cuentaBancariaId) {
      form.setError("cuentaBancariaId", {
        message: "Cuenta bancaria requerida",
      });
      return;
    }

    if (
      data.modo === "DEPOSITO_PARCIAL" &&
      (!data.montoParcial || data.montoParcial <= 0)
    ) {
      form.setError("montoParcial", { message: "Monto debe ser > 0" });
      return;
    }

    if (esDeposito && depositoCalculadoLocal <= 0) {
      toast.error("No hay disponible para depositar.");
      return;
    }

    // Reglas del comprobante cuando hay depósito
    if (esDeposito) {
      if (!data.comprobanteTipo) {
        form.setError("comprobanteTipo", {
          message: "Tipo de comprobante requerido",
        });
        return;
      }
      if (!data.comprobanteNumero?.trim()) {
        form.setError("comprobanteNumero", {
          message: "Número de comprobante requerido",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CerrarCajaV2Dto & {
        dejarEnCaja?: number;
        asentarVentas?: boolean;
        // nuevos (si tu DTO ya los tiene tipados, puedes quitar estas extensiones)
        comprobanteTipo?: string;
        comprobanteNumero?: string;
        comprobanteFecha?: string;
      } = {
        registroCajaId,
        usuarioCierreId,
        modo: data.modo,
        comentarioFinal: data.comentarioFinal,
        dejarEnCaja: Number(data.dejarEnCaja ?? 0),
        asentarVentas: Boolean(data.asentarVentas ?? true),
      };

      if (esDeposito) {
        payload.cuentaBancariaId = data.cuentaBancariaId!;

        // normaliza número (trim + upper + colapsa espacios, limita a 64)
        const num = (data.comprobanteNumero ?? "")
          .replace(/\s+/g, " ")
          .trim()
          .toUpperCase()
          .slice(0, 64);

        payload.comprobanteTipo = data.comprobanteTipo!;
        payload.comprobanteNumero = num;

        // transforma "YYYY-MM-DD" a ISO (medianoche local)
        if (data.comprobanteFecha) {
          payload.comprobanteFecha = new Date(
            `${data.comprobanteFecha}T00:00:00`
          ).toISOString();
        }

        if (data.modo === "DEPOSITO_PARCIAL") {
          payload.montoParcial = depositoCalculadoLocal;
        } else {
          // asegura no enviar campo sobrante
          delete (payload as any).montoParcial;
        }
      }

      if (data.modo === "CAMBIO_TURNO") {
        payload.abrirSiguiente = data.abrirSiguiente ?? true;
        if (payload.abrirSiguiente) {
          payload.usuarioInicioSiguienteId = data.usuarioInicioSiguienteId!;
          payload.fondoFijoSiguiente = data.fondoFijoSiguiente;
          payload.comentarioAperturaSiguiente =
            data.comentarioAperturaSiguiente;
        }
      }

      console.log("El payload es: ", payload);

      await cerrarCajaV2(payload); // POST /caja/cerrar-v3

      toast.success("Caja cerrada exitosamente");
      onOpenChange(false);
      onClosed?.();
    } catch (error) {
      console.error("Error cerrando caja:", error);
      toast.error("Error al cerrar la caja");
    } finally {
      setIsSubmitting(false);
      await reloadContext();
    }
  };

  const formatCuentaBancaria = (cuenta: CuentaBancaria) => {
    const numeroMasked = `****${cuenta.numero.slice(-4)}`;
    return `${cuenta.alias} - ${cuenta.banco || numeroMasked}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cerrar Caja</DialogTitle>
          <DialogDescription>
            Configure los detalles del cierre. El sistema asentará ventas en
            efectivo y actualizará los snapshots del día.
          </DialogDescription>
        </DialogHeader>

        {isLoadingPrevia ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando información...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna principal */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Modo de cierre */}
                  <FormField
                    control={form.control}
                    name="modo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modo de cierre</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-1 gap-3"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="SIN_DEPOSITO"
                                id="sin-deposito"
                              />
                              <Label htmlFor="sin-deposito">
                                Solo cerrar (sin depósito)
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="DEPOSITO_PARCIAL"
                                id="deposito-parcial"
                                disabled={disponibleOperable <= 0}
                              />
                              <Label htmlFor="deposito-parcial">
                                Depositar parcial
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="DEPOSITO_TODO"
                                id="deposito-todo"
                                disabled={disponibleOperable <= 0}
                              />
                              <Label htmlFor="deposito-todo">
                                Depositar todo
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Asentar ventas */}
                  <FormField
                    control={form.control}
                    name="asentarVentas"
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <div className="flex items-center space-x-2">
                          <input
                            id="asentar-ventas"
                            type="checkbox"
                            className="h-4 w-4"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <Label htmlFor="asentar-ventas">
                            Asentar ventas en efectivo antes de depositar
                          </Label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dejar en caja */}
                  <FormField
                    control={form.control}
                    name="dejarEnCaja"
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <FormLabel>Dejar en caja (base)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            max={enCaja}
                            value={Number(field.value ?? 0)}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cuenta bancaria si hay depósito */}
                  {requiereDeposito && (
                    <FormField
                      control={form.control}
                      name="cuentaBancariaId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuenta bancaria *</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione una cuenta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cuentas.map((cuenta) => (
                                <SelectItem
                                  key={cuenta.id}
                                  value={cuenta.id.toString()}
                                >
                                  {formatCuentaBancaria(cuenta)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                          {cuentaRequeridaError ? (
                            <p className="text-sm text-red-500 mt-1">
                              {cuentaRequeridaError}
                            </p>
                          ) : null}
                        </FormItem>
                      )}
                    />
                  )}

                  {requiereDeposito && (
                    <>
                      {/* Tipo de comprobante */}
                      <FormField
                        control={form.control}
                        name="comprobanteTipo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de comprobante *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione el tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ComprobanteTipoZ.options.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {t.replace("_", " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Número de comprobante */}
                      <FormField
                        control={form.control}
                        name="comprobanteNumero"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de comprobante *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej. 123456 / REF-ABCD"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                maxLength={64}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Fecha del comprobante (opcional) */}
                      <FormField
                        control={form.control}
                        name="comprobanteFecha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Fecha del comprobante (opcional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Monto parcial */}
                  {watched.modo === "DEPOSITO_PARCIAL" && (
                    <FormField
                      control={form.control}
                      name="montoParcial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monto a depositar *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min={0.01}
                              max={disponibleOperable}
                              value={Number(field.value ?? 0)}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                          {montoParcialError ? (
                            <p className="text-sm text-red-500 mt-1">
                              {montoParcialError}
                            </p>
                          ) : null}
                          {disponibleOperable <= 0 ? (
                            <p className="text-sm text-yellow-600 mt-1">
                              No hay disponible para depositar (base ≥ efectivo
                              en caja).
                            </p>
                          ) : null}
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Warnings de previa */}
                  {previa?.warnings?.length ? (
                    <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                      {previa.warnings.map((w, i) => (
                        <div key={i}>{w}</div>
                      ))}
                    </div>
                  ) : null}

                  {/* Comentario final */}
                  <FormField
                    control={form.control}
                    name="comentarioFinal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comentario final (opcional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Notas del cierre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Resumen lateral */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resumen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Efectivo en caja:
                        </span>
                        <span className="font-medium">
                          Q {enCaja.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Base a dejar:
                        </span>
                        <span className="font-medium">
                          Q {dejarEnCaja.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Disponible para depósito:
                        </span>
                        <span className="font-medium">
                          Q {disponibleOperable.toFixed(2)}
                        </span>
                      </div>
                      <hr />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Depósito a realizar:
                        </span>
                        <span className="font-medium text-blue-600">
                          Q {depositoCalculado.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Saldo final esperado:
                        </span>
                        <span className="font-medium text-green-600">
                          Q {saldoFinalEsperado.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isValid}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? "Cerrando..." : "Cerrar Caja"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
