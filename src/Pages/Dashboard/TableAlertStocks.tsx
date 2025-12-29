import { useEffect, useState } from "react";
import { StockAlert } from "./AlertStocks.utils";
import { getAlertsStocks } from "./AlertStocks.api";
import { useStore } from "@/components/Context/ContextSucursal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, AlertCircle, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-destructive flex items-center gap-2 text-xs">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center bg-muted/20">
        <p className="text-xs font-medium text-muted-foreground">
          Sin alertas de stock.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 mt-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Alertas de Stock Bajo
          </h2>
        </div>
        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
          Total: {alerts.length}
        </Badge>
      </div>

      <ScrollArea className="h-[450px] w-full rounded-md border bg-slate-50/40 p-2 dark:bg-slate-900/10">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {alerts
            .sort((a, b) => a.stockActual - b.stockActual)
            .map((alert) => {
              const isCritical = alert.stockActual === 0;

              // Estilos compactos
              const containerClass = isCritical
                ? "border-red-200 bg-red-50/80 dark:bg-red-950/30 dark:border-red-900"
                : "border-orange-200 bg-orange-50/80 dark:bg-orange-950/30 dark:border-orange-900";

              const textStatusColor = isCritical
                ? "text-red-700 dark:text-red-400"
                : "text-orange-700 dark:text-orange-400";

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border p-2.5 shadow-sm",
                    containerClass
                  )}
                >
                  {/* 1. Icono Compacto */}
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white/60 dark:bg-black/20",
                      textStatusColor
                    )}
                  >
                    {isCritical ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                  </div>

                  {/* 2. Información Central (Nombre + Estado + Min) */}
                  <div className="flex flex-1 flex-col min-w-0">
                    <div className="flex justify-between items-start">
                      <h3
                        className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate mr-1"
                        title={alert.nombre}
                      >
                        {alert.nombre}
                      </h3>
                    </div>

                    {/* Fila de metadatos ultra-compacta */}
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          "text-[9px] font-black uppercase tracking-tight",
                          textStatusColor
                        )}
                      >
                        {isCritical ? "AGOTADO" : "BAJO"}
                      </span>
                      <span className="text-[9px] text-muted-foreground/40">
                        |
                      </span>
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                        <span>Min: {alert.stockMinimo}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Valor Stock Actual (Destacado) */}
                  <div className="shrink-0 flex flex-col items-end">
                    <Badge
                      variant={isCritical ? "destructive" : "default"}
                      className={cn(
                        "h-6 px-2 text-xs font-bold shadow-none",
                        !isCritical &&
                          "bg-orange-500 hover:bg-orange-600 text-white border-transparent"
                      )}
                    >
                      {alert.stockActual}
                    </Badge>
                  </div>
                </div>
              );
            })}
        </div>
      </ScrollArea>
    </div>
  );
}

export default TableAlertStocks;
