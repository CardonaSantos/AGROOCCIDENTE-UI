import dayjs from "dayjs";

import "dayjs/locale/es";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TZGT } from "@/Pages/Utils/Utils"; // ej. "America/Guatemala"
import {
  AlertCircle,
  Calendar,
  HandCoins,
  Percent,
  Receipt,
  ShieldQuestion,
  Timer,
  Wallet,
} from "lucide-react";
export type PlanCuotaFila = { numero: number; fechaISO: string; monto: number };

export type PlanPreview = {
  cuotas: PlanCuotaFila[];
  interesTotal: number;
  principalFinanciado: number; // total - enganche
  totalAPagar: number; // suma de cuotas
};

export function SummaryCreditoCompra({ preview }: { preview: PlanPreview }) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldQuestion className="h-4 w-4" /> Resumen del plan
        </CardTitle>
        <CardDescription>
          Principal financiado:{" "}
          <b>Q {preview.principalFinanciado.toFixed(2)}</b> • Interés total:{" "}
          <b>Q {preview.interesTotal.toFixed(2)}</b>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground border-b pb-2">
          <div className="col-span-2">#</div>
          <div className="col-span-5">Vencimiento</div>
          <div className="col-span-5 text-right">Monto</div>
        </div>
        <div className="max-h-64 overflow-y-auto divide-y">
          {preview.cuotas.map((c) => (
            <div key={c.numero} className="grid grid-cols-12 py-2 text-sm">
              <div className="col-span-2">{c.numero}</div>
              <div className="col-span-5">
                {dayjs(c.fechaISO).tz(TZGT).format("dddd DD/MM/YYYY")}
              </div>
              <div className="col-span-5 text-right">
                Q {c.monto.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between text-sm">
          <span>Total a pagar</span>
          <Badge variant="secondary">Q {preview.totalAPagar.toFixed(2)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
