// --- Authorization.tsx ---
import React from "react";
import { NormalizedSolicitud } from "./interfaces/Interfaces.interfaces";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Building2,
  User2,
  Phone,
  MapPin,
  Wallet,
  Percent,
  Clock,
  Package,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { formattMoneda } from "@/Pages/Utils/Utils";

interface PropsAuth {
  auth: NormalizedSolicitud;
  onReview: () => void;
}

// Helpers
const formatDate = (iso?: string | null) => {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-GT", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
};

const estadoVariantMap: Record<string, { label: string; className: string }> = {
  PENDIENTE: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
  APROBADA: { label: "Aprobada", className: "bg-green-100 text-green-800" },
  RECHAZADA: { label: "Rechazada", className: "bg-red-100 text-red-800" },
  CANCELADA: { label: "Cancelada", className: "bg-gray-100 text-gray-800" },
};

function InfoItem({
  icon: Icon,
  label,
  value,
  srLabel,
}: {
  icon: React.ElementType;
  label?: string;
  value: React.ReactNode;
  srLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label ? (
        <span className="text-muted-foreground">{label}:&nbsp;</span>
      ) : null}
      <span aria-label={srLabel}>{value}</span>
    </div>
  );
}

function LineItemsPreview({
  lineas,
}: {
  lineas: NormalizedSolicitud["lineas"];
}) {
  if (!lineas?.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Package className="h-4 w-4" aria-hidden="true" />
        Sin líneas
      </div>
    );
  }
  const max = 2;
  const first = lineas.slice(0, max);
  const rest = lineas.length - first.length;

  return (
    <div className="space-y-1.5">
      {first.map((ln) => (
        <div key={ln.id} className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            <span className="font-medium">{ln.cantidad}×</span>{" "}
            <span className="truncate inline-block max-w-[18rem] align-bottom">
              {ln.item.nombre}
            </span>{" "}
            <span className="text-muted-foreground">
              ({formattMoneda(ln.subtotal)})
            </span>
          </span>
        </div>
      ))}
      {rest > 0 && (
        <div className="text-xs text-muted-foreground">
          y {rest} ítem{rest > 1 ? "es" : ""} más…
        </div>
      )}
    </div>
  );
}

export default function Authorization({ auth, onReview }: PropsAuth) {
  const nombreCliente = `${auth.cliente.nombre}${
    auth.cliente.apellidos ? " " + auth.cliente.apellidos : ""
  }`;
  const monto = formattMoneda(auth.economico.totalPropuesto);

  const estadoInfo =
    estadoVariantMap[auth.estado] ??
    ({ label: auth.estado, className: "bg-slate-100 text-slate-800" } as const);

  const proximo = formatDate(auth.schedule.proximoVencimientoISO);
  const fechaSolicitud = formatDate(auth.fechas.solicitudISO);

  const tieneEnganche = auth.schedule.tieneEnganche;
  const cuotasNormales = auth.schedule.cuotas.filter(
    (c) => c.etiqueta === "NORMAL"
  ).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            <span className="font-semibold">{nombreCliente}</span>
          </CardTitle>

          <Badge
            className={`px-2 py-1 text-[11px] font-medium rounded-full ${estadoInfo.className}`}
            aria-label={`Estado: ${estadoInfo.label}`}
          >
            {estadoInfo.label}
          </Badge>
        </div>

        <CardDescription className="flex flex-col gap-1 mt-1">
          <span className="line-clamp-2">
            <strong>{auth.solicitadoPor.nombre}</strong> solicita un crédito por{" "}
            <strong>{monto}</strong>.
          </span>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <InfoItem
              icon={Wallet}
              label="Monto"
              value={<span className="font-medium">{monto}</span>}
              srLabel="Monto total propuesto"
            />
            <InfoItem
              icon={CalendarDays}
              label="Solicitado"
              value={fechaSolicitud}
              srLabel="Fecha de solicitud"
            />
            <InfoItem
              icon={Clock}
              label="Próximo venc."
              value={proximo}
              srLabel="Próximo vencimiento"
            />
            <InfoItem
              icon={Building2}
              label="Sucursal"
              value={auth.sucursal?.nombre ?? "N/A"}
              srLabel="Sucursal"
            />
          </div>
        </CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="py-3">
        {/* Vista rápida compacta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Resumen de crédito
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4" aria-hidden="true" />
                <span>{auth.economico.interesPorcentaje}%</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>{tieneEnganche ? "Con enganche" : "Sin enganche"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>{auth.economico.diasEntrePagos} días</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <span>
                  {cuotasNormales} cuota{cuotasNormales === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Ítems
            </div>
            <LineItemsPreview lineas={auth.lineas} />
          </div>
        </div>

        {/* Detalles expandibles */}
        <Accordion type="single" collapsible className="mt-3">
          <AccordionItem value="cred">
            <AccordionTrigger>Detalles del crédito</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <InfoItem
                  icon={Wallet}
                  label="Cuota inicial"
                  value={
                    auth.economico.cuotaInicialPropuesta != null
                      ? formattMoneda(auth.economico.cuotaInicialPropuesta)
                      : "No aplica"
                  }
                />
                <InfoItem
                  icon={Clock}
                  label="Cuotas"
                  value={auth.economico.cuotasTotalesPropuestas}
                />
                <InfoItem
                  icon={Percent}
                  label="Interés"
                  value={`${auth.economico.interesTipo} • ${auth.economico.interesPorcentaje}%`}
                />
                <InfoItem
                  icon={Clock}
                  label="Cada"
                  value={`${auth.economico.diasEntrePagos} días`}
                />
                <InfoItem
                  icon={CalendarDays}
                  label="Primera cuota"
                  value={formatDate(auth.fechas.primeraCuotaISO)}
                />
                <InfoItem
                  icon={CheckCircle2}
                  label="Plan"
                  value={auth.economico.planCuotaModo}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cliente">
            <AccordionTrigger>Cliente</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoItem icon={User2} label="Nombre" value={nombreCliente} />
                <InfoItem
                  icon={Phone}
                  label="Teléfono"
                  value={auth.cliente.telefono ?? "N/A"}
                />
                <InfoItem
                  icon={MapPin}
                  label="Dirección"
                  value={auth.cliente.direccion ?? "N/A"}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="solicitante">
            <AccordionTrigger>Solicitado por</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoItem
                  icon={User2}
                  label="Nombre"
                  value={auth.solicitadoPor.nombre}
                />
                <InfoItem
                  icon={Phone}
                  label="Correo"
                  value={auth.solicitadoPor.correo ?? "N/A"}
                />
                <InfoItem
                  icon={Building2}
                  label="Rol"
                  value={auth.solicitadoPor.rol ?? "N/A"}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="lineas">
            <AccordionTrigger>Detalle de líneas</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {auth.lineas.map((ln) => (
                  <div
                    key={ln.id}
                    className="flex items-start justify-between gap-3 rounded-lg border p-2"
                    role="listitem"
                    aria-label={`${ln.cantidad}× ${ln.item.nombre}`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Package className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {ln.cantidad}× {ln.item.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ln.item.codigo ?? ln.item.type}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium shrink-0">
                      {formattMoneda(ln.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cuotas">
            <AccordionTrigger>Plan de pagos</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {auth.schedule.cuotas.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                    aria-label={`Cuota ${c.numero}`}
                  >
                    <div className="flex items-center gap-2">
                      {c.etiqueta === "ENGANCHE" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      <div className="text-sm">
                        {c.etiqueta === "ENGANCHE"
                          ? "Enganche"
                          : `Cuota ${c.numero}`}
                        <span className="text-muted-foreground">
                          {" "}
                          • {formatDate(c.fechaISO)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formattMoneda(c.monto)}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-sm">
                  <span className="text-muted-foreground">Total plan</span>
                  <span className="font-semibold">
                    {formattMoneda(auth.schedule.sumaCuotas)}
                  </span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {auth.comentario ? (
            <AccordionItem value="comentario">
              <AccordionTrigger>Comentario</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm whitespace-pre-line break-words">
                  {auth.comentario}
                </p>
              </AccordionContent>
            </AccordionItem>
          ) : null}
        </Accordion>
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-2">
        <Button onClick={onReview} aria-label="Revisar autorización">
          Revisar
        </Button>
      </CardFooter>
    </Card>
  );
}
