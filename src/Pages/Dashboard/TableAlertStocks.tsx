import { useEffect, useState } from "react";
import { StockAlert } from "./AlertStocks.utils";
import { getAlertsStocks } from "./AlertStocks.api";
import { useStore } from "@/components/Context/ContextSucursal";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowDownCircle, Package } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";

function TableAlertStocks() {
  const userID = useStore((state) => state.userId) ?? 0;
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (userID) {
      getAlertsStocks(userID)
        .then((data) => setAlerts(data))
        .catch((error) => setError(error.message || "Error al cargar alertas"))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [userID]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-destructive">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <p className="font-medium">Error al cargar alertas</p>
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-md bg-muted p-4 text-center">
        <Package className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">
          No hay alertas de stock bajo.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border shadow-md my-4">
      <ScrollArea
        className="overflow-y-auto
        max-h-60"
      >
        <h2 className="my-3 text-sm text-center font-semibold">
          Productos con bajo stock: {alerts.length}{" "}
        </h2>
        <Table>
          <TableCaption className="mb-4">
            Alertas de productos con stock bajo
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Producto</TableHead>
              <TableHead className="w-[20%]">Stock Actual</TableHead>
              <TableHead className="w-[20%]">Stock Mínimo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts
              .sort((a, b) => a.stockActual - b.stockActual)
              .map((alert) => {
                // Calcular la diferencia para determinar la severidad
                const diferencia = alert.stockActual - alert.stockMinimo;
                const severidad =
                  diferencia <= -5
                    ? "destructive"
                    : diferencia < 0
                    ? "destructive"
                    : "default";

                return (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={severidad}
                          className="h-2 w-2 rounded-full p-0"
                        />
                        {alert.nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={severidad} className="font-mono">
                        {alert.stockActual} uds
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ArrowDownCircle className="h-3 w-3" />
                        <span className="font-mono">
                          {alert.stockMinimo} uds
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

export default TableAlertStocks;
