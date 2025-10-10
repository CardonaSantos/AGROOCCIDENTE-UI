import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlanCuotaFila } from "./interfaces/types";

type Props = {
  isManual: boolean;
  cuotas: PlanCuotaFila[] | null; // override cuando se edita
  adoptPreview: () => void;
  resetToPreview: () => void;
  editCuotaFecha: (id: string, ymd: string) => void;
  editCuotaMonto: (id: string, monto: number) => void;
  onSubmit: () => void | Promise<void>;
  canSubmit: boolean;
  isPending: boolean;
};

export function CuotasManualEditor({
  isManual,
  cuotas,
  adoptPreview,
  resetToPreview,
  editCuotaFecha,
  editCuotaMonto,
  onSubmit,
  canSubmit,
  isPending,
}: Props) {
  return (
    <div className="mt-3">
      <div className="flex gap-2 justify-end">
        {!isManual ? (
          <Button variant="outline" onClick={adoptPreview}>
            Editar cuotas
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={resetToPreview}>
              Regenerar desde plan
            </Button>
            <Button onClick={onSubmit} disabled={!canSubmit || isPending}>
              {isPending ? "Creando crédito…" : "Crear crédito"}
            </Button>
          </>
        )}
      </div>

      {isManual && !!cuotas?.length && (
        <div className="mt-2 max-h-72 overflow-y-auto divide-y">
          {cuotas.map((c) => (
            <div key={c.id} className="grid grid-cols-12 gap-2 py-2 text-sm">
              <div className="col-span-2 flex items-center">{c.numero}</div>
              <div className="col-span-5">
                <Input
                  type="date"
                  value={dayjs(c.fechaISO).format("YYYY-MM-DD")}
                  onChange={(e) => editCuotaFecha(c.id, e.target.value)}
                />
              </div>
              <div className="col-span-5">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={String(c.monto)}
                  onChange={(e) =>
                    editCuotaMonto(c.id, Number(e.target.value || 0))
                  }
                  className="text-right"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
