import { useMemo, useState } from "react";
import "dayjs/locale/es";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TZGT } from "@/Pages/Utils/Utils"; // ej. "America/Guatemala"
import { AlertCircle } from "lucide-react";
import { useApiMutation } from "@/hooks/genericoCall/genericoCallHook";
import { SummaryCreditoCompra } from "./SummaryCreditoCompra";
import dayjs from "dayjs";
import {
  CrearCreditoCompraPayload,
  CreditoCompraForm,
  InteresTipo,
  PlanCuotaFila,
  PlanCuotaModo,
  ProveedorOption,
  RecepcionValorada,
} from "./interfaces/types";
import { GenerateCredito } from "./GenerateCredito";
import {
  cuotasForSubmit,
  ensureId,
  getMontoBase,
  previewFrom,
} from "./helpers/helpersplan";
import { CuotasManualEditor } from "./CuotasManualEditor";
import { useStore } from "@/components/Context/ContextSucursal";
interface CreditoCompraMainProps {
  compraId: number;
  proveedorId: number;
  compraTotal: number; // total de la compra (para default)
  proveedores: ProveedorOption[];
  recepciones?: RecepcionValorada[];

  cuentasBancarias: {
    id: number;
    nombre: string;
  }[];
}
export default function CreditoCompraMainPage({
  compraId,
  proveedorId,
  compraTotal,
  proveedores,
  recepciones = [],
  cuentasBancarias,
}: CreditoCompraMainProps) {
  const userId = useStore((state) => state.userId) ?? 0;
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;

  const [enabled, setEnabled] = useState<boolean>(true);

  const [form, setForm] = useState<CreditoCompraForm>({
    usuarioId: userId,
    proveedorId,
    compraId,
    modo: "POR_COMPRA",
    recepcionId: undefined,
    montoOriginal: undefined,
    fechaEmisionISO: dayjs().tz(TZGT).startOf("day").toDate().toISOString(),
    diasCredito: 0,
    diasEntrePagos: 15,
    cantidadCuotas: 4,
    interesTipo: InteresTipo.NONE,
    interes: 0,
    planCuotaModo: PlanCuotaModo.IGUALES,
    enganche: null,
    registrarPagoEngancheAhora: false,
    cuentaBancariaId: 0,
    cuotas: [],
  });

  const [isManual, setIsManual] = useState(false);
  const [cuotasOverride, setCuotasOverride] = useState<PlanCuotaFila[] | null>(
    null
  );

  // POST mutation (usa tu hook genérico). Ajusta el tipo TData según tu API.
  const { mutateAsync, isPending } = useApiMutation<any, any>(
    "post",
    `/compras/${compraId}/cxp-documentos`,
    undefined,
    {
      onSuccess: () => {
        // TODO: toast + navigate / invalidate queries
      },
    }
  );

  const canSubmit = useMemo(() => {
    const base =
      form.montoOriginal ??
      (form.modo === "POR_RECEPCION" && form.recepcionId
        ? recepciones.find((r) => r.id === form.recepcionId)?.valor ??
          compraTotal
        : compraTotal);
    return base > 0 && form.cantidadCuotas >= 1 && form.diasEntrePagos > 0;
  }, [form, compraTotal, recepciones]);

  // 1) Preview solo para mostrar en UI (derivado)
  const preview = useMemo(
    () => previewFrom(form, compraTotal, recepciones),
    [form, compraTotal, recepciones]
  );

  // 2) Handlers opcionales para edición manual (sin loops)
  const adoptPreview = () => {
    setCuotasOverride(preview.cuotas.map(ensureId)); // o .map(x => x) si ya traen id
    setIsManual(true);
  };

  // 3) Submit: transformas AHÍ MISMO (single source of truth)
  const onSubmit = async () => {
    const cuotas = cuotasForSubmit(
      isManual,
      cuotasOverride,
      form,
      compraTotal,
      recepciones
    );

    const payload: CrearCreditoCompraPayload = {
      //identificacion
      compraId: compraId,
      folioProveedor: undefined,
      montoOriginal: getMontoBase(form, compraTotal, recepciones),
      diasCredito: form.diasCredito,
      cantidadCuotas: form.cantidadCuotas,
      interes: form.interes,
      recepcionId: form.modo === "POR_RECEPCION" ? form.recepcionId : undefined,
      enganche:
        typeof form.enganche === "number"
          ? form.enganche
          : form.enganche?.valor ?? 0,
      diasEntrePagos: form.diasEntrePagos,
      fechaEmisionISO: form.fechaEmisionISO,
      modo: form.modo,
      metodoPago: "CONTADO",
      interesTipo: form.interesTipo,
      usuarioId: userId,
      planCuotaModo: form.planCuotaModo,
      cuentaBancariaId: 1,
      proveedorId: form.proveedorId,
      sucursalId: sucursalId,
      descripcion: "Descripcion de mi primer pago enganche",
      registrarPagoEngancheAhora: form.registrarPagoEngancheAhora,
      cuotas, // <- aquí ya va el array bueno
    };
    console.log("El payload es: ", payload);

    await mutateAsync(payload);
  };

  console.log("El preview es: ", preview);
  console.log("El formulario creando es: ", form);
  console.log("Las cuotas manuales son: ", cuotasOverride);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label>Generar crédito de compra</Label>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled ? (
        <>
          <GenerateCredito
            form={form}
            setForm={setForm}
            proveedores={proveedores}
            recepciones={recepciones}
            compraTotal={compraTotal}
          />
          <SummaryCreditoCompra preview={preview} />
          <CuotasManualEditor
            isManual={isManual}
            cuotas={cuotasOverride}
            adoptPreview={adoptPreview}
            resetToPreview={() => {
              setIsManual(false);
              setCuotasOverride(null);
            }}
            editCuotaFecha={(id, ymd) => {
              if (!isManual || !cuotasOverride) adoptPreview();
              setCuotasOverride((prev) =>
                (prev ?? preview.cuotas.map(ensureId)).map((c) =>
                  c.id === id
                    ? { ...c, fechaISO: dayjs(ymd).toDate().toISOString() }
                    : c
                )
              );
            }}
            editCuotaMonto={(id, monto) => {
              if (!isManual || !cuotasOverride) adoptPreview();
              setCuotasOverride((prev) =>
                (prev ?? preview.cuotas.map(ensureId)).map((c) =>
                  c.id === id ? { ...c, monto } : c
                )
              );
            }}
            onSubmit={onSubmit}
            canSubmit={canSubmit}
            isPending={isPending}
          />

          <div className="flex items-center justify-end gap-2">
            {!canSubmit && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" /> Revisa monto, frecuencia y #
                cuotas.
              </div>
            )}
            <Button disabled={!canSubmit || isPending} onClick={onSubmit}>
              {isPending ? "Creando crédito…" : "Crear crédito"}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
