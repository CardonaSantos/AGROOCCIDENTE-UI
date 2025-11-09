// src/components/Chart/MetaDonut.tsx
"use client";

import { ResponsivePie } from "@nivo/pie";
import * as React from "react";
import { cn } from "@/lib/utils";

interface MetaDonutProps {
  value: number; // 0..100
  className?: string;
  label?: string; // ej. "Avance" (opcional, pequeñito arriba del %)
  interactive?: boolean;
}

export function MetaDonut({
  value,
  className,
  label = "Avance",
  interactive = false,
}: MetaDonutProps) {
  const v = Math.max(0, Math.min(100, value));
  const data = React.useMemo(
    () => [
      { id: "Avance", value: v },
      { id: "Restante", value: 100 - v },
    ],
    [v]
  );

  return (
    <div className={cn("relative w-full h-44", className)}>
      <ResponsivePie
        data={data}
        innerRadius={0.8}
        padAngle={1}
        startAngle={90}
        endAngle={450}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        isInteractive={interactive}
        legends={[]}
        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        colors={["hsl(var(--primary))", "hsl(var(--muted))"]}
        theme={{
          //   textColor: 'hsl(var(--foreground))',
          tooltip: { container: { background: "hsl(var(--popover))" } },
        }}
        motionConfig="gentle"
        sortByValue={true}
        activeOuterRadiusOffset={0}
        cornerRadius={6}
      />
      {/* Centro: solo % (y etiqueta chiquita opcional) */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center leading-none">
          {label ? (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
          ) : null}
          <span className="text-xl font-semibold">{v.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
