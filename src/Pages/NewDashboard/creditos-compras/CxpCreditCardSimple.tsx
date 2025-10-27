// src/features/cxp/components/CxpCreditCardSimple.tsx
// --------------------------------------------------
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formattFecha, formattMoneda } from "@/Pages/Utils/Utils";
import { UICxpCard } from "./interfaces/credito-cuota";
import { Link } from "react-router-dom";

interface Props {
  cxp: UICxpCard;
  onRegistrarPago?: (documentoId: number) => void;
}

export default function CxpCreditCardSimple({ cxp, onRegistrarPago }: Props) {
  const estadoVencido = useMemo(() => {
    const n = cxp.proximaCuota;
    if (!n?.fechaVencimiento) return false;
    const hoy = new Date();
    const venc = new Date(n.fechaVencimiento);
    venc.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
    return venc.getTime() < hoy.getTime() && !n.vencida;
  }, [cxp.proximaCuota]);

  return (
    <Card className="group h-full transition-all border-muted-foreground/10 hover:border-primary/50 hover:shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-semibold tracking-wide">
            CRED-{cxp.id}
          </CardTitle>

          <Badge variant="secondary" className="text-[10px] uppercase">
            {cxp.frecuenciaLabel}
          </Badge>

          <Link to={`/compra/${cxp.compraId}`}>
            <Button
              variant="destructive"
              className="text-[10px] uppercase"
              onClick={() => onRegistrarPago?.(cxp.id)}
            >
              Registrar pago
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Proveedor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="size-4 shrink-0" />
            <span className="truncate" title={cxp.proveedorNombre}>
              {cxp.proveedorNombre}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0" />
            <span className="truncate">{cxp.folioProveedor ?? "—"}</span>
          </div>
        </div>

        <div className="my-3 h-px bg-border/60" />

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Inicio</p>
              <p className="font-medium truncate">
                {formattFecha(cxp.fechaEmision)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Próx. cuota</p>
              <p className="font-medium truncate">
                {formattFecha(cxp.proximaCuota?.fechaVencimiento ?? null)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="size-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Pendiente</p>
              <p className="font-medium truncate">
                {formattMoneda(cxp.saldoPendiente)}{" "}
                <span className="text-muted-foreground">
                  · {cxp.cuotasPendientes} por pagar
                </span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
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
          <span className="text-muted-foreground">
            · A pagar hoy: <strong>{formattMoneda(cxp.totalAPagarHoy)}</strong>
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
