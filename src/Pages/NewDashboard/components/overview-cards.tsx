import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoinsIcon } from "lucide-react";
import type { DailyMoney } from "../types/dashboard";

interface OverviewCardsProps {
  ventasMes: number;
  ventasSemana: number;
  ventasDia: DailyMoney;
  formattMonedaGT(value: string | number): string;
}

export function OverviewCards({
  ventasMes,
  ventasSemana,
  ventasDia,
  formattMonedaGT,
}: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas del mes</CardTitle>
          <CoinsIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattMonedaGT(ventasMes)}</div>
        </CardContent>
      </Card>
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ingresos de la semana
          </CardTitle>
          <CoinsIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formattMonedaGT(ventasSemana)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ingresos del dia
          </CardTitle>
          <CoinsIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {ventasDia &&
            typeof ventasDia.totalDeHoy === "number" &&
            !isNaN(ventasDia.totalDeHoy)
              ? formattMonedaGT(ventasDia.totalDeHoy)
              : "Sin ventas aún"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
