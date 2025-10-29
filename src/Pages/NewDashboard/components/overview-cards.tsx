import { Card } from "@/components/ui/card";
import { Coins, PiggyBank, Wallet } from "lucide-react";
import type { DailyMoney } from "../types/dashboard";

interface OverviewCardsProps {
  ventasMes: number;
  ventasSemana: number;
  ventasDia: DailyMoney;
  formattMonedaGT(value: string | number): string;
}

type Accent = "emerald" | "sky" | "amber";

const ACCENT_TEXT: Record<Accent, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  sky: "text-sky-600 dark:text-sky-400",
  amber: "text-amber-600 dark:text-amber-400",
};

const ACCENT_BG: Record<Accent, string> = {
  emerald: "bg-emerald-500/10",
  sky: "bg-sky-500/10",
  amber: "bg-amber-500/10",
};

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: Accent;
}) {
  return (
    <Card
      className={[
        // compacto y consistente con el resto del UI
        "rounded-xl border bg-card/60 shadow-sm",
        "transition-colors hover:bg-card",
      ].join(" ")}
    >
      <div className="flex items-center justify-between p-3 md:p-3.5">
        <div className="min-w-0">
          <p className="text-[11px] md:text-xs text-muted-foreground">
            {title}
          </p>
          <p className="mt-0.5 text-lg md:text-xl font-semibold tabular-nums truncate">
            {value}
          </p>
        </div>

        <div
          className={[
            "shrink-0 rounded-lg p-1.5 md:p-2",
            ACCENT_BG[accent],
            ACCENT_TEXT[accent],
          ].join(" ")}
          aria-hidden
        >
          <div className="size-4 md:size-5 opacity-90">{icon}</div>
        </div>
      </div>
    </Card>
  );
}

export function OverviewCards({
  ventasMes,
  ventasSemana,
  ventasDia,
  formattMonedaGT,
}: OverviewCardsProps) {
  const totalHoyIsValid =
    ventasDia &&
    typeof ventasDia.totalDeHoy === "number" &&
    !isNaN(ventasDia.totalDeHoy);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
      <StatCard
        title="Ventas del mes"
        value={formattMonedaGT(ventasMes)}
        icon={<PiggyBank className="w-full h-full" />}
        accent="emerald"
      />
      <StatCard
        title="Ingresos de la semana"
        value={formattMonedaGT(ventasSemana)}
        icon={<Wallet className="w-full h-full" />}
        accent="sky"
      />
      <StatCard
        title="Ingresos del día"
        value={
          totalHoyIsValid
            ? formattMonedaGT(ventasDia.totalDeHoy)
            : "Sin ventas aún"
        }
        icon={<Coins className="w-full h-full" />}
        accent="amber"
      />
    </div>
  );
}
