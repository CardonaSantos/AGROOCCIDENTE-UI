"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  CalendarDays,
  UserRound,
  ClipboardList,
  PackageOpen,
  Tag,
  CheckCircle2,
  Box,
} from "lucide-react";

import type { RecepcionParcialUI } from "./interfaces/recepcionesInterfaces";
import {
  formattFecha,
  formattFechaWithMinutes,
  formattMoneda,
} from "@/Pages/Utils/Utils";

interface PropsLineas {
  lineas: RecepcionParcialUI[];
}

export default function LineasRecepciones({ lineas }: PropsLineas) {
  const recepciones = Array.isArray(lineas) ? lineas : [];

  if (recepciones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recepciones parciales</CardTitle>
          <CardDescription>Líneas de recepciones parciales</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-muted-foreground">
          <PackageOpen className="h-5 w-5" />
          <span>No hay recepciones registradas.</span>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Recepciones registradas: 0
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recepciones parciales</CardTitle>
        <CardDescription>Líneas de recepciones parciales</CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        <div className="space-y-4">
          {recepciones.map((r) => {
            const unidadesOrdenadas = r.lineas.reduce(
              (acc, li) => acc + (li.cantidadOrdenada ?? 0),
              0
            );
            const unidadesRecibidas = r.totales.unidadesRecibidas ?? 0;
            const pct =
              unidadesOrdenadas > 0
                ? Math.min(
                    100,
                    Math.round((unidadesRecibidas / unidadesOrdenadas) * 100)
                  )
                : 0;

            return (
              <motion.div
                key={r.recepcionId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border"
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="gap-1" variant="secondary">
                        <ClipboardList className="h-4 w-4" />
                        Recepción #{r.recepcionId}
                      </Badge>

                      <Badge variant="outline" className="gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {formattFechaWithMinutes(r.fecha)}
                      </Badge>

                      <Badge variant="outline" className="gap-1">
                        <UserRound className="h-4 w-4" />
                        {r.usuario?.nombre ?? "—"}
                      </Badge>

                      <Badge variant="outline" className="gap-1">
                        <PackageOpen className="h-4 w-4" />
                        {r.totales.lineas} líneas
                      </Badge>

                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {unidadesRecibidas} unid.
                      </Badge>
                    </div>

                    {r.observaciones ? (
                      <p className="text-sm text-muted-foreground">
                        {r.observaciones}
                      </p>
                    ) : null}
                  </div>

                  {/* Panel de progreso por recepción */}
                  <div className="shrink-0 rounded-2xl border bg-card p-4 sm:w-80">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs uppercase text-muted-foreground">
                        Avance
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {unidadesRecibidas}/{unidadesOrdenadas} unid.
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="mt-1 text-right text-xs text-muted-foreground">
                      {pct}% recibido
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Líneas */}
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-2">
                    {r.lineas.map((l) => (
                      <div
                        key={l.lineaId}
                        className="grid grid-cols-1 items-center gap-2 rounded-xl border p-3 sm:grid-cols-12"
                      >
                        {/* Item + tipo */}
                        <div className="sm:col-span-4">
                          <div className="flex items-start gap-3">
                            <ItemThumb
                              src={l.item?.imagenUrl}
                              alt={l.item?.nombre}
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-medium">
                                  {l.item?.nombre ?? "—"}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="h-5 px-2 text-[10px]"
                                >
                                  {l.item?.itemTipo ?? "ITEM"}
                                </Badge>
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <Tag className="h-3.5 w-3.5" />
                                <span className="truncate">
                                  {l.item?.codigo ?? "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cantidades */}
                        <div className="sm:col-span-4">
                          <div className="grid grid-cols-3 gap-2">
                            <KpiSm
                              label="Ordenado"
                              value={l.cantidadOrdenada}
                            />
                            <KpiSm
                              label="Recibido"
                              value={l.cantidadRecibida}
                            />
                            <KpiSm
                              label="Pendiente"
                              value={Math.max(
                                0,
                                (l.cantidadOrdenada ?? 0) -
                                  (l.cantidadRecibida ?? 0)
                              )}
                              highlight={
                                (l.cantidadOrdenada ?? 0) -
                                  (l.cantidadRecibida ?? 0) >
                                0
                              }
                            />
                          </div>
                        </div>

                        {/* Costos / tiempos */}
                        <div className="sm:col-span-4">
                          <div className="grid grid-cols-2 gap-2">
                            <KpiSm
                              label="Costo U."
                              value={formattMoneda(l.costoUnitario)}
                            />
                            <KpiSm
                              label="Vence"
                              value={
                                l.fechaExpiracion
                                  ? formattFecha(l.fechaExpiracion)
                                  : "—"
                              }
                            />
                            <MetaTime label="Creado" iso={l.createdAt} />
                            <MetaTime label="Actualizado" iso={l.updatedAt} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="text-sm text-muted-foreground">
        Recepciones registradas: {recepciones.length}
      </CardFooter>
    </Card>
  );
}

/* -------------------- Subcomponentes -------------------- */

function ItemThumb({ src, alt }: { src?: string | null; alt?: string | null }) {
  if (!src) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/40">
        <Box className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="h-10 w-10 overflow-hidden rounded-lg border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? "Item"}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

function KpiSm({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-lg border p-2",
        highlight
          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
          : "",
      ].join(" ")}
    >
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{String(value ?? "—")}</div>
    </div>
  );
}

function MetaTime({ label, iso }: { label: string; iso?: string }) {
  return (
    <div className="rounded-lg border p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="truncate text-xs">
        {iso ? formattFechaWithMinutes(iso) : "—"}
      </div>
    </div>
  );
}

/* -------------------- Utils -------------------- */
