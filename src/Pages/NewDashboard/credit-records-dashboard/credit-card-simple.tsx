import { useMemo } from "react";
import { SimpleCredit } from "../credit-authorizations/interfaces/credit-records";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User2,
  Phone,
  MapPin,
  CalendarClock,
  CalendarDays,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { formattFecha, formattMoneda } from "@/Pages/Utils/Utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CreditCardProps {
  credit: SimpleCredit;
}

function CreditCardSimple({ credit }: CreditCardProps) {
  // Próxima cuota (la primera no pagada)
  const nextCuota = useMemo(() => {
    return (
      credit.cuotas.find((q) => !q.fechaPago && q.estado !== "PAGADA") ??
      credit.cuotas[0]
    );
  }, [credit.cuotas]);

  // Cantidad de cuotas pendientes y total estimado pendiente (usando campo monto)
  const { pendientes, totalPendiente } = useMemo(() => {
    let p = 0;
    let sum = 0;
    for (const q of credit.cuotas) {
      const isPaid = !!q.fechaPago || q.estado === "PAGADA";
      if (!isPaid) {
        p++;
        sum += q.monto ?? 0;
      }
    }
    return { pendientes: p, totalPendiente: sum };
  }, [credit.cuotas]);

  // Estado rápido: vencida si la próxima cuota ya pasó
  const estadoVencido = useMemo(() => {
    if (!nextCuota?.fechaVencimiento) return false;
    const today = new Date();
    const venc = new Date(nextCuota.fechaVencimiento);
    // Comparar por fecha a medianoche para evitar TZ raras
    venc.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return venc.getTime() < today.getTime() && !nextCuota.fechaPago;
  }, [nextCuota]);

  return (
    <Card className="group h-full transition-all border-muted-foreground/10 hover:border-primary/50 hover:shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-semibold tracking-wide">
            CRED-{credit.id}
          </CardTitle>

          {/* Frecuencia de pago como badge */}
          <Badge variant="secondary" className="text-[10px] uppercase">
            {credit.frecuenciaPago}
          </Badge>

          <Link to={`/credito-details/${credit.id}`}>
            <Button variant="destructive" className="text-[10px] uppercase">
              Registrar pago
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Bloque cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <User2 className="size-4 shrink-0" />
            <span className="truncate" title={credit.cliente.nombre}>
              {credit.cliente.nombre}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="size-4 shrink-0" />
            <span className="truncate">{credit.cliente.telefono ?? "—"}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 sm:col-span-2 min-w-0">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">{credit.cliente.direccion ?? "—"}</span>
          </div>
        </div>

        {/* Línea divisoria sutil */}
        <div className="my-3 h-px bg-border/60" />

        {/* Resumen del crédito */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Inicio</p>
              <p className="font-medium truncate">
                {formattFecha(credit.fechaInicio)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Próx. cuota</p>
              <p className="font-medium truncate">
                {formattFecha(nextCuota?.fechaVencimiento ?? null)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="size-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Pendiente</p>
              <p className="font-medium truncate">
                {formattMoneda(totalPendiente)}{" "}
                <span className="text-muted-foreground">
                  · {pendientes} por pagar
                </span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {/* Estado compacto con ícono */}
        <div className="flex items-center gap-2 text-xs">
          {estadoVencido ? (
            <>
              <AlertCircle className="size-4 text-destructive" />
              <span className="text-destructive font-medium">Vencida</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-emerald-600 font-medium">Al día</span>
            </>
          )}
          {/* Comentario si existe */}
          {credit.comentario ? (
            <span className="text-muted-foreground truncate max-w-[12rem] sm:max-w-none">
              · {credit.comentario}
            </span>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}

export default CreditCardSimple;
