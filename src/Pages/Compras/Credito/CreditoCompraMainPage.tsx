import { useMemo, useState } from "react";
import "dayjs/locale/es";
import { Button } from "@/components/ui/button";
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
import { cuotasForSubmit, ensureId, getMontoBase } from "./helpers/helpersplan";
import { CuotasManualEditor } from "./CuotasManualEditor";
import { useStore } from "@/components/Context/ContextSucursal";
import PurchasePaymentFormDialog, {
  CajaConSaldo,
} from "@/utils/components/SelectMethodPayment/PurchasePaymentFormDialog";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { toast } from "sonner";
import { getApiErrorMessageAxios } from "@/Pages/Utils/UtilsErrorApi";
import { UICreditoCompra } from "./creditoCompraDisponible/interfaces/interfaces";
import MapCreditoCompraMain from "./creditoCompraDisponible/MapCreditoCompraMain";
import { DetalleNormalizado } from "../table-select-recepcion/detalleNormalizado";
import { buildPlanPreview } from "./helpers/helpers2";
type MetodoPago =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "TARJETA"
  | "CHEQUE"
  | "CREDITO"
  | "OTRO"
  | "CONTADO";

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

  cajasDisponibles: CajaConSaldo[];
  montoRecepcion: number;
  creditoFromCompra: UICreditoCompra | undefined;
  handleRefresAll: () => void;
  normalizados: DetalleNormalizado[];
}
export default function CreditoCompraMainPage({
  compraId,
  proveedorId,
  compraTotal,
  proveedores,
  recepciones = [],
  cuentasBancarias,
  cajasDisponibles,
  montoRecepcion,
  handleRefresAll,
  creditoFromCompra,
  normalizados,
}: CreditoCompraMainProps) {
  const [openPaymentMethod, setOpenPaymentMethod] = useState<boolean>(false);
  const [openConfirmPayment, setOpenConfirmPayment] = useState<boolean>(false);

  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("");

  const userId = useStore((state) => state.userId) ?? 0;
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;
  const isCreditoRegistAvaliable: boolean = creditoFromCompra ? true : false;

  const [proveedorSelected, setProveedorSelected] = useState<
    string | undefined
  >(undefined);
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
    cantidadCuotas: 2,
    interesTipo: InteresTipo.NONE,
    interes: 0,
    planCuotaModo: PlanCuotaModo.IGUALES,
    enganche: null,
    registrarPagoEngancheAhora: true,
    cuentaBancariaId: 0,
    observaciones: "",
    cuotas: [],
  });

  const [isManual, setIsManual] = useState(false);
  const [cuotasOverride, setCuotasOverride] = useState<PlanCuotaFila[] | null>(
    null
  );
  const [cuentaBancariaSelected, setCuentaBancariaSelected] =
    useState<string>("");
  const [cajaSelected, setCajaSelected] = useState<string | null>(null);

  // POST mutation (usa tu hook genérico). Ajusta el tipo TData según tu API.
  const { mutateAsync, isPending } = useApiMutation<
    any,
    CrearCreditoCompraPayload
  >("post", `/credito-documento-compra/create-registro`, undefined, {
    onSuccess: () => {},
  });

  const canSubmit = useMemo(() => {
    const base =
      form.montoOriginal ??
      (form.modo === "POR_RECEPCION" && form.recepcionId
        ? recepciones.find((r) => r.id === form.recepcionId)?.valor ??
          compraTotal
        : compraTotal);
    return base > 0 && form.cantidadCuotas >= 1 && form.diasEntrePagos > 0;
  }, [form, compraTotal, recepciones]);

  const preview = useMemo(
    () =>
      buildPlanPreview({
        montoTotal: getMontoBase(form, compraTotal, recepciones),
        fechaEmisionISO: form.fechaEmisionISO,
        diasCredito: form.diasCredito,
        diasEntrePagos: form.diasEntrePagos,
        n: form.cantidadCuotas,
        interesTipo: form.interesTipo,
        interes: form.interes,
        planCuotaModo: form.planCuotaModo,
        enganche:
          form.planCuotaModo === PlanCuotaModo.PRIMERA_MAYOR
            ? form.enganche
            : null,
      }),
    [form, compraTotal, recepciones]
  );

  const isValidMovimientoFinanciero =
    form.planCuotaModo === PlanCuotaModo.PRIMERA_MAYOR;

  const adoptPreview = () => {
    setCuotasOverride(preview.cuotas.map(ensureId)); // o .map(x => x) si ya traen id
    setIsManual(true);
  };

  const onSubmit = async () => {
    try {
      const cuotas = cuotasForSubmit(
        isManual,
        cuotasOverride,
        form,
        compraTotal,
        recepciones
      );

      const engancheMonto =
        form.planCuotaModo === "PRIMERA_MAYOR" && cuotas.length > 0
          ? cuotas[0].monto
          : undefined;

      const needsAccount = ["TRANSFERENCIA", "TARJETA", "CHEQUE"].includes(
        String(metodoPago)
      );

      const cuentaIdSafe =
        form.registrarPagoEngancheAhora &&
        needsAccount &&
        Number.isFinite(Number(cuentaBancariaSelected))
          ? Number(cuentaBancariaSelected)
          : undefined;

      const payload: CrearCreditoCompraPayload = {
        compraId,
        proveedorId: form.proveedorId,
        usuarioId: userId,
        modo: form.modo,
        recepcionId:
          form.modo === "POR_RECEPCION" ? form.recepcionId : undefined,
        fechaEmisionISO: form.fechaEmisionISO,
        montoOriginal: getMontoBase(form, compraTotal, recepciones),
        folioProveedor: undefined,
        diasCredito: form.diasCredito,
        diasEntrePagos: form.diasEntrePagos,
        cantidadCuotas: form.cantidadCuotas, // SIN contar enganche
        interesTipo: form.interesTipo,
        interes: form.interes,
        planCuotaModo: form.planCuotaModo,
        cuotas,
        enganche:
          form.planCuotaModo === "PRIMERA_MAYOR" ? engancheMonto : undefined,
        registrarPagoEngancheAhora: form.registrarPagoEngancheAhora,
        metodoPago: form.registrarPagoEngancheAhora ? metodoPago : undefined, // <- usa el elegido
        sucursalId: form.registrarPagoEngancheAhora ? sucursalId : undefined,
        cuentaBancariaId: cuentaIdSafe, // <- evita NaN
        descripcion: form.registrarPagoEngancheAhora
          ? form.observaciones?.trim() || "Pago de enganche (cuota #1)"
          : undefined,
      };

      console.log("El payload generado con enganche es: ", payload);

      const p = mutateAsync(payload);

      toast.promise(p, {
        loading: "Registrando crédito...",
        success: "Registro de crédito creado",
        error: (e) => getApiErrorMessageAxios(e),
      });

      await p;
      handleRefresAll();
      setOpenConfirmPayment(false);
      setOpenPaymentMethod(false);
    } catch (e) {
      toast.error(getApiErrorMessageAxios(e));
    }
  };

  console.log("creditoFromCompra es: ", creditoFromCompra);

  return (
    <div className="space-y-4">
      {isCreditoRegistAvaliable ? (
        <MapCreditoCompraMain
          normalizados={normalizados}
          cajasDisponibles={cajasDisponibles}
          sucursalId={sucursalId}
          documentoId={creditoFromCompra?.id ?? 0} // ← ver fix #3
          userId={userId}
          handleRefresAll={handleRefresAll}
          creditoFromCompra={creditoFromCompra}
          cuentasBancarias={cuentasBancarias}
          proveedores={proveedores}
          compraId={compraId} // ✅ pásalo aquí
        />
      ) : (
        <>
          <GenerateCredito
            cuentasBancarias={cuentasBancarias}
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
            <Button
              disabled={!canSubmit || isPending}
              onClick={() => {
                if (isValidMovimientoFinanciero) {
                  setOpenPaymentMethod(true);
                } else {
                  setOpenConfirmPayment(true);
                }
              }}
            >
              {isPending ? "Creando crédito…" : "Crear crédito"}
            </Button>
          </div>
        </>
      )}

      <PurchasePaymentFormDialog
        open={openPaymentMethod}
        onOpenChange={setOpenPaymentMethod}
        proveedores={proveedores}
        cuentasBancarias={cuentasBancarias}
        cajasDisponibles={cajasDisponibles}
        montoRecepcion={montoRecepcion}
        formatMoney={formattMonedaGT}
        observaciones={form.observaciones}
        setObservaciones={(e) =>
          setForm((previa) => ({
            ...previa,
            observaciones: e,
          }))
        }
        proveedorSelected={proveedorSelected}
        setProveedorSelected={setProveedorSelected}
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        cuentaBancariaSelected={cuentaBancariaSelected}
        setCuentaBancariaSelected={setCuentaBancariaSelected}
        cajaSelected={cajaSelected}
        setCajaSelected={setCajaSelected}
        onContinue={() => {
          setOpenConfirmPayment(true);
          setOpenPaymentMethod(false);
        }}
      />

      <AdvancedDialog
        open={openConfirmPayment}
        onOpenChange={setOpenConfirmPayment}
        title="Confirmar creacion de credito por compra"
        description="Se comenzará un registro de credito a partir de esta compra"
        confirmButton={{
          label: "Si, continuar y crear",
          onClick: () => {
            onSubmit();
          },
          loading: isPending,
          disabled: isPending,
          loadingText: "Registrando crédito...",
        }}
        cancelButton={{
          label: "Cancelar",
          onClick: () => setOpenConfirmPayment(false),
          disabled: isPending,
          loadingText: "Cancelando...",
        }}
      />
    </div>
  );
}
