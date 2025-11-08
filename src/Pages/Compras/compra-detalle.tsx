"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { useStore } from "@/components/Context/ContextSucursal";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { TZGT } from "../Utils/Utils";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CompraRegistroUI } from "./Interfaces/RegistroCompraInterface";
// ⬇️ hooks genéricos (React Query + Axios client base)
import { useQueryClient } from "@tanstack/react-query";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import {
  ItemDetallesPayloadParcial,
  PayloadRecepcionParcial,
} from "./table-select-recepcion/selectedItems";
import dayjs from "dayjs";
import { CompraRecepcionableResponse } from "./ResumenRecepcionParcial/Interfaces/detalleRecepcionable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComprasMain from "./comprasMain";
import RecepcionesMain from "./Recepciones/RecepcionesMain";
import PaymentMethodCompraDialogConfirm from "./PaymentCompraDialog";
import CreditoCompraMainPage from "./Credito/CreditoCompraMainPage";
import PurchasePaymentFormDialog, {
  CajaConSaldo,
} from "@/utils/components/SelectMethodPayment/PurchasePaymentFormDialog";
import { UICreditoCompra } from "./Credito/creditoCompraDisponible/interfaces/interfaces";
import { normalizarDetalles } from "./Credito/helpers/normalizador";
import { qk } from "./qk";
import {
  CostosAsociadosDialogResult,
  MovimientoFinancieroDraft,
  ProrrateoMeta,
} from "./CostoAsociadoTypes";
import CostosAsociadosDialog from "./components/Costos Asociados Dialog";

interface Option {
  label: string;
  value: string;
}

// Animaciones
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

// 1) Tipos y helpers arriba del componente (o en un archivo de utils compartido)
type MetodoPago =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "TARJETA"
  | "CHEQUE"
  | "CREDITO"
  | "OTRO"
  | "CONTADO";

type RecepcionFlow = "NORMAL" | "PARCIAL";

export default function CompraDetalle() {
  const userId = useStore((state) => state.userId) ?? 0;

  // === Helpers (puros) ======================================================
  const isBankMethod = (m?: MetodoPago | "") =>
    m === "TRANSFERENCIA" || m === "TARJETA" || m === "CHEQUE";
  const isCashMethod = (m?: MetodoPago | "") =>
    m === "EFECTIVO" || m === "CONTADO";

  // === Router / Store =======================================================
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;
  const compraId = Number.isFinite(Number(id)) ? Number(id) : 0;
  const [recepcionFlow, setRecepcionFlow] = useState<RecepcionFlow>("NORMAL");

  // === UI / Dialog states ===================================================
  const [openSendStock, setOpenSendStock] = useState(false);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openFormPaymentDialog, setOpenFormPaymentDialog] = useState(false);

  const [observaciones, setObservaciones] = useState<string>("");
  const [proveedorSelected, setProveedorSelected] = useState<
    string | undefined
  >(undefined);
  const [openCostoDialog, setOpenCostoDialog] = useState(false);

  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("");
  const [cuentaBancariaSelected, setCuentaBancariaSelected] =
    useState<string>("");
  const [cajaSelected, setCajaSelected] = useState<string | null>(null);

  const [isRecibirParcial, setIsRecibirParcial] = useState<boolean>(false);
  const [openRecibirParcial, setOpenRecibirParcial] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const [selectedItems, setSelectedItems] = useState<PayloadRecepcionParcial>({
    compraId: compraId,
    fecha: dayjs().tz(TZGT).startOf("day").toISOString(),
    observaciones: "",
    usuarioId: userId,
    sucursalId: sucursalId,
    lineas: [],
  });

  const [mfDraft, setMfDraft] = useState<MovimientoFinancieroDraft | null>(
    null
  );
  const [prorrateoMeta, setProrrateoMeta] = useState<ProrrateoMeta | null>(
    null
  );
  const [costoStepDone, setCostoStepDone] = useState(false); // marcamos si el usuario completó el paso de costos

  // ⚙️ Mantén lo elegido en el diálogo de costos; sólo completa sucursal/proveedor si falta.
  const buildMf = useCallback(() => {
    if (!mfDraft) return undefined;
    return {
      ...mfDraft,
      sucursalId: mfDraft.sucursalId ?? sucursalId,
      proveedorId: mfDraft.proveedorId ?? Number(proveedorSelected),
      // Importante: NO sobreescribimos metodoPago / cuentaBancariaId / registroCajaId aquí.
    };
  }, [mfDraft, sucursalId, proveedorSelected]);

  // === QUERIES ==============================================================
  const {
    data: registroQ,
    isPending: isPendingRegistro,
    isError: isErrorRegistro,
    error: errorRegistro,
    refetch: reFetchRegistro,
  } = useApiQuery<CompraRegistroUI>(
    ["compra", compraId],
    `/compra-requisicion/get-registro/${compraId}`,
    undefined,
    {
      enabled: Number.isFinite(compraId) && compraId > 0,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    }
  );

  const queryKey = qk.creditoFromCompra(compraId);
  const { data: creditoFromCompra, refetch: refetchCredito } =
    useApiQuery<UICreditoCompra>(
      queryKey,
      `/credito-documento-compra/${compraId}`,
      undefined,
      {
        staleTime: 0,
        refetchOnWindowFocus: false,
      }
    );

  const proveedoresQ = useApiQuery<Array<{ id: number; nombre: string }>>(
    ["proveedores"],
    "/proveedor",
    undefined,
    {
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    }
  );

  const cuentasQ = useApiQuery<Array<{ id: number; nombre: string }>>(
    ["cuentas-bancarias", "simple-select"],
    "cuentas-bancarias/get-simple-select",
    undefined,
    {
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    }
  );

  // Cajas abiertas por sucursal
  const cajasQ = useApiQuery<CajaConSaldo[]>(
    ["cajas-disponibles", sucursalId],
    `/caja/cajas-disponibles/${sucursalId}`,
    undefined,
    {
      enabled: !!sucursalId,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    }
  );

  // === MUTATIONS ============================================================
  const recepcionarM = useApiMutation<any, any>(
    "post",
    `/compra-requisicion/${compraId}/recepcionar`,
    undefined,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["compra", compraId] });
        queryClient.invalidateQueries({ queryKey: ["compras"] });
      },
    }
  );

  const {
    data: recepcionable = {
      id: compraId,
      estado: "ESPERANDO_ENTREGA",
      estadoCalculado: "ESPERANDO_ENTREGA",
      detalles: [],
    },
    isPending: isPendingDrp,
    refetch: reFetchDRP,
  } = useApiQuery<CompraRecepcionableResponse>(
    ["compra-recepcionable", compraId],
    "compras/get-data-compra-parcial",
    { params: { compraId } }
  );

  // === DERIVED ==============================================================
  const registro = registroQ ?? null;
  const proveedores = proveedoresQ.data ?? [];
  const cuentasBancarias = cuentasQ.data ?? [];
  const cajasDisponibles = cajasQ.data ?? [];

  const montoRecepcion = useMemo(() => {
    if (recepcionFlow === "PARCIAL") {
      return selectedItems.lineas.reduce(
        (acc: number, item: ItemDetallesPayloadParcial) =>
          acc + item.cantidadRecibida * item.precioCosto,
        0
      );
    }
    return Number(registro?.resumen?.subtotal ?? registro?.total ?? 0);
  }, [registro, recepcionFlow, selectedItems]);

  // === EFFECTS ==============================================================

  // Reset de banco si el método no es bancario
  useEffect(() => {
    if (!isBankMethod(metodoPago) && cuentaBancariaSelected) {
      setCuentaBancariaSelected("");
    }
  }, [metodoPago, cuentaBancariaSelected]);

  // Autoselección de caja válida si pago en efectivo/contado
  useEffect(() => {
    if (!isCashMethod(metodoPago)) {
      setCajaSelected(null);
      return;
    }
    const candidatas = cajasDisponibles
      .filter((c) => Number(c.disponibleEnCaja) >= montoRecepcion)
      .sort((a, b) => Number(b.disponibleEnCaja) - Number(a.disponibleEnCaja));

    if (!candidatas.length) {
      setCajaSelected(null);
      return;
    }

    const yaSeleccionadaEsValida =
      cajaSelected &&
      candidatas.some((c) => String(c.id) === String(cajaSelected));

    if (!yaSeleccionadaEsValida) {
      setCajaSelected(String(candidatas[0].id));
    }
  }, [metodoPago, cajasDisponibles, montoRecepcion, cajaSelected]);

  // Prefill proveedor del registro
  useEffect(() => {
    const idProv = registro?.proveedor?.id;
    setProveedorSelected(idProv ? String(idProv) : undefined);
  }, [registro?.proveedor?.id]);

  // === Handlers básicos =====================================================
  const onBack = () => navigate(-1);
  const handleSelectCaja = (option: Option | null) => {
    setCajaSelected(option ? option.value : null);
  };

  // === Handler principal: Recepción total (enviar a stock) ==================
  const sendtToStock = useCallback(async () => {
    if (!registro || recepcionarM.isPending) return;

    const usuarioId = registro.usuario.id ?? 1;

    // Validaciones UI
    if (!proveedorSelected) {
      toast.error("Seleccione un proveedor");
      return;
    }
    if (!metodoPago) {
      toast.error("Seleccione un método de pago");
      return;
    }
    if (isBankMethod(metodoPago) && !cuentaBancariaSelected) {
      toast.error("Seleccione una cuenta bancaria para este método");
      return;
    }
    if (isCashMethod(metodoPago)) {
      if (!cajaSelected) {
        toast.error("Seleccione una caja con saldo suficiente.");
        return;
      }
      const cajaSel = cajasDisponibles.find(
        (c) => String(c.id) === String(cajaSelected)
      );
      if (!cajaSel || Number(cajaSel.disponibleEnCaja) < montoRecepcion) {
        toast.error("La caja seleccionada no tiene saldo suficiente.");
        return;
      }
    }

    // ⛏️ Construye MF exactamente como vino del diálogo de costos (sin pisar método/ids).
    const mf = buildMf();

    // 🔁 Flag minimal de prorrateo: sólo si el MF es COSTO_ASOCIADO y el usuario lo activó
    const aplicarProrrateo =
      Boolean(prorrateoMeta?.aplicar) && mf?.motivo === "COSTO_ASOCIADO";

    // Payload final (top-level = pago/flujo de la recepción; mf = costos asociados)
    const payload: {
      compraId?: number; // el controller lo rellena con :id
      usuarioId: number;
      proveedorId: number;
      observaciones?: string;
      metodoPago: string;
      registroCajaId?: number;
      sucursalId: number;
      cuentaBancariaId?: number;
      lineas?: Array<{
        fechaVencimiento: string;
        compraDetalleId: number;
        loteCodigo: string;
      }>;
      mf?: typeof mf;
      prorrateo?: { aplicar: true };
    } = {
      usuarioId,
      proveedorId: Number(proveedorSelected),
      observaciones,
      metodoPago, // debe matchear enum backend
      sucursalId,
      // Sólo setear si aplica (para el flujo principal)
      ...(isBankMethod(metodoPago) && {
        cuentaBancariaId: Number(cuentaBancariaSelected),
      }),
      ...(isCashMethod(metodoPago) &&
        cajaSelected && { registroCajaId: Number(cajaSelected) }),
      // MF del costo asociado (como lo dejó el diálogo)
      ...(mf ? { mf } : {}),
      // Prorrateo minimal
      ...(aplicarProrrateo ? { prorrateo: { aplicar: true } } : {}),
    };
    console.log("El payload es: ", payload);

    await toast.promise(recepcionarM.mutateAsync(payload), {
      loading: "Recepcionando compra...",
      success: "Compra recepcionada y enviada a stock",
      error: (error) => getApiErrorMessageAxios(error),
    });

    setOpenSendStock(false);
    setOpenFormDialog(false);
    setObservaciones("");
  }, [
    registro,
    recepcionarM,
    proveedorSelected,
    observaciones,
    metodoPago,
    cuentaBancariaSelected,
    cajaSelected,
    cajasDisponibles,
    montoRecepcion,
    sucursalId,
    buildMf,
    prorrateoMeta?.aplicar,
  ]);

  // === UI Utils =============================================================
  const optionsCajas: Option[] = cajasDisponibles.map((c) => ({
    label: `Caja #${c.id} · Inicial ${formattMonedaGT(
      c.saldoInicial
    )} · Disponible ${formattMonedaGT(c.disponibleEnCaja)}`,
    value: c.id.toString(),
  }));

  // === Selección de líneas (parcial) ========================================
  const selectedIds = useMemo(() => {
    return new Set(selectedItems.lineas.map((l) => l.compraDetalleId));
  }, [selectedItems]);

  const updateCantidadDetalle = (
    compraDetalleId: number,
    nuevaCantidad: number
  ) => {
    setSelectedItems((prev) => ({
      ...prev,
      lineas: prev.lineas.map((l) =>
        l.compraDetalleId === compraDetalleId
          ? { ...l, cantidadRecibida: nuevaCantidad }
          : l
      ),
    }));
  };

  const updateFechaVencimiento = (
    compraDetalleId: number,
    nuevaFechaVencimiento: string
  ) => {
    setSelectedItems((previa) => ({
      ...previa,
      lineas: previa.lineas.map((linea) =>
        linea.compraDetalleId === compraDetalleId
          ? { ...linea, fechaExpiracion: nuevaFechaVencimiento }
          : linea
      ),
    }));
  };

  const upsserSelectItems = (
    item: ItemDetallesPayloadParcial,
    checked: boolean
  ) => {
    setSelectedItems((prev) => {
      const exists = prev.lineas.some(
        (l) => l.compraDetalleId === item.compraDetalleId
      );

      if (checked) {
        return exists
          ? {
              ...prev,
              lineas: prev.lineas.map((l) =>
                l.compraDetalleId === item.compraDetalleId
                  ? {
                      ...l,
                      ...item,
                      // si el item trae undefined, conserva la anterior
                      fechaExpiracion:
                        item.fechaExpiracion ?? l.fechaExpiracion,
                      checked: true,
                    }
                  : l
              ),
            }
          : {
              ...prev,
              lineas: [...prev.lineas, { ...item, checked: true }],
            };
      } else {
        return {
          ...prev,
          lineas: prev.lineas.filter(
            (l) => l.compraDetalleId !== item.compraDetalleId
          ),
        };
      }
    });
  };

  // === Recepción parcial =====================================================
  const handleRecepcionarParcial = useApiMutation<
    void,
    PayloadRecepcionParcial
  >("post", "compras/create-recepcion-parcial", undefined, {
    onSuccess: () => {
      reFetchRegistro();
      reFetchDRP();
      setSelectedItems({
        compraId: compraId,
        fecha: dayjs().tz(TZGT).startOf("day").toISOString(),
        observaciones: "",
        usuarioId: userId,
        sucursalId: sucursalId,
        lineas: [],
      });
      setOpenRecibirParcial(false);
      setIsRecibirParcial(false);
    },
    onError: () => {},
  });

  const verifyTransaction = () => {
    if (
      !selectedItems.compraId ||
      !selectedItems.sucursalId ||
      !selectedItems.usuarioId ||
      !selectedItems.lineas ||
      selectedItems.lineas.length <= 0
    ) {
      return false;
    }
    return true;
  };

  const handleCreateRecepcionParcial = async () => {
    try {
      console.log("El log del payload: ", selectedItems);

      const isValid = verifyTransaction();
      if (!isValid) {
        toast.warning("Verifique los datos a enviar");
        return;
      }
      toast.promise(handleRecepcionarParcial.mutateAsync(selectedItems), {
        success: "Compra parcial recepcionada",
        error: (error) => getApiErrorMessageAxios(error),
        loading: "Registrando entrada...",
      });
    } catch (error) {
      console.log("El error: ", error);
    }
  };

  // === Utilidades UI adicionales ============================================
  const loadingHard = isPendingRegistro;
  const errorHard = isErrorRegistro && !registro;

  const onContinueFromPayment = useCallback(() => {
    setOpenFormPaymentDialog(false);
    setCostoStepDone(false); // reset
    setOpenCostoDialog(true); // 👉 abre el diálogo de costos asociados
  }, [setOpenFormPaymentDialog]);

  console.log("El registro de compra: ", registroQ);

  const handleRefresAll = React.useCallback(async () => {
    await Promise.allSettled([
      reFetchDRP(),
      reFetchRegistro(),
      refetchCredito(), // usa el refetch del mismo queryKey
    ]);
  }, [reFetchDRP, reFetchRegistro, refetchCredito]);

  const hasCredit: boolean =
    Boolean(creditoFromCompra?.id) &&
    (creditoFromCompra?.cuotas?.length ?? 0) > 0;

  const normalizados = normalizarDetalles(
    Array.isArray(registro?.detalles) ? registro.detalles : []
  );

  // === Guard Clauses (no hooks debajo de returns) ============================
  if (loadingHard) {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Cargando registro de compra...
          </p>
        </div>
      </div>
    );
  }

  if (errorHard) {
    return (
      <div className="min-h-screen bg-background p-2 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p className="text-sm text-muted-foreground">
            {(errorRegistro as Error)?.message || "Registro no encontrado"}
          </p>
          <Button
            variant="outline"
            onClick={onBack}
            className="mt-4 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  if (!registro) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Cargando o sin datos...</p>
      </div>
    );
  }

  // === Derivados finales para los diálogos ==================================
  const cajaSel = cajasDisponibles.find(
    (c) => String(c.id) === String(cajaSelected)
  );
  const cajaTieneSaldo = isCashMethod(metodoPago)
    ? !!cajaSel && Number(cajaSel.disponibleEnCaja) >= montoRecepcion
    : true;

  const requiereBanco = isBankMethod(metodoPago);
  const requiereCaja = isCashMethod(metodoPago);

  const canContinue =
    !!observaciones.trim() &&
    !!proveedorSelected &&
    !!metodoPago &&
    (!requiereBanco || !!cuentaBancariaSelected) &&
    (!requiereCaja || (!!cajaSelected && cajaTieneSaldo));

  console.log("Los detalles de la compra son: ", registro.detalles);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-background p-2 sm:p-4"
    >
      <Tabs defaultValue="compra" className="">
        <TabsList className="w-full max-h-8">
          <TabsTrigger value="compra" className="flex-1 max-h-6">
            Compra
          </TabsTrigger>
          <TabsTrigger value="recepcionesParciales" className="flex-1 max-h-6">
            Recepciones
          </TabsTrigger>

          <TabsTrigger value="credito" className="flex-1 max-h-6">
            Crédito
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compra">
          <ComprasMain
            //STATES
            openFormPaymentDialog={openFormPaymentDialog}
            setOpenFormPaymentDialog={setOpenFormPaymentDialog}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            isPendingDrp={isPendingDrp}
            reFetchDRP={reFetchDRP}
            isRecibirParcial={isRecibirParcial}
            setIsRecibirParcial={setIsRecibirParcial}
            openFormDialog={openFormDialog}
            setOpenFormDialog={setOpenFormDialog}
            selectedIds={selectedIds}
            openRecibirParcial={openRecibirParcial}
            setOpenRecibirParcial={setOpenRecibirParcial}
            //REGISTRO
            registro={registroQ}
            //HELPERS
            updateCantidadDetalle={updateCantidadDetalle}
            upsserSelectItems={upsserSelectItems}
            recepcionable={recepcionable}
            onOpenPaymentFor={(flow) => {
              setRecepcionFlow(flow);
              setOpenFormPaymentDialog(true);
            }}
            updateFechaVencimiento={updateFechaVencimiento}
            //FLAGS
            hasCredit={hasCredit}
          />
        </TabsContent>
        <TabsContent value="recepcionesParciales">
          <RecepcionesMain compraId={compraId} />
        </TabsContent>

        {/* GENERAR CREDITO DE UNA COMPRA */}
        <TabsContent value="credito">
          <CreditoCompraMainPage
            cuentasBancarias={cuentasBancarias}
            compraTotal={registro.total}
            proveedores={proveedores}
            compraId={compraId}
            proveedorId={registro.proveedor?.id ?? 0}
            cajasDisponibles={cajasDisponibles}
            montoRecepcion={registro.total}
            handleRefresAll={handleRefresAll}
            creditoFromCompra={creditoFromCompra}
            normalizados={normalizados}
          />
        </TabsContent>
      </Tabs>
      {/* Confirmación (segunda pantalla) */}
      <AdvancedDialog
        type="warning"
        onOpenChange={setOpenSendStock}
        open={openSendStock}
        title="Recepción de productos"
        description="Se añadirá el stock de estos productos en la sucursal donde fueron solicitados."
        question="¿Estás seguro de que deseas continuar? Esta acción no se puede deshacer."
        confirmButton={{
          label: "Sí, confirmar entrada de stock",
          disabled: recepcionarM.isPending,
          loading: recepcionarM.isPending,
          loadingText: "Añadiendo productos al stock...",
          onClick: sendtToStock,
        }}
        cancelButton={{
          label: "Cancelar",
          disabled: recepcionarM.isPending,
          loadingText: "Cancelando...",
          onClick: () => setOpenSendStock(false),
        }}
      />
      {/* RECEPCION PARCIAL */}
      <AdvancedDialog
        type="confirmation"
        onOpenChange={setOpenRecibirParcial}
        open={openRecibirParcial}
        title="Recepción parcial de la compra"
        description="Solo se ingresarán al stock los productos seleccionados. El resto quedará pendiente para una entrega posterior. Los montos y totales se recalcularán según tu selección."
        question="¿Confirmas la recepción parcial? Esta acción no se puede deshacer."
        confirmButton={{
          label: "Confirmar recepción parcial",
          disabled: handleRecepcionarParcial.isPending,
          loading: handleRecepcionarParcial.isPending,
          loadingText: "Ingresando productos al stock...",
          onClick: handleCreateRecepcionParcial,
        }}
        cancelButton={{
          label: "Cancelar",
          disabled: handleRecepcionarParcial.isPending,
          loadingText: "Cancelando...",
          onClick: () => setOpenRecibirParcial(false),
        }}
      />
      {/* Form previo a confirmar */}
      <PurchasePaymentFormDialog
        open={openFormDialog}
        onOpenChange={setOpenFormDialog}
        proveedores={proveedores}
        cuentasBancarias={cuentasBancarias}
        cajasDisponibles={cajasDisponibles}
        montoRecepcion={montoRecepcion}
        formatMoney={formattMonedaGT}
        observaciones={observaciones}
        setObservaciones={setObservaciones}
        proveedorSelected={proveedorSelected}
        setProveedorSelected={setProveedorSelected}
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        cuentaBancariaSelected={cuentaBancariaSelected}
        setCuentaBancariaSelected={setCuentaBancariaSelected}
        cajaSelected={cajaSelected}
        setCajaSelected={setCajaSelected}
        onContinue={() => setOpenSendStock(true)}
        layout="two-column"
        flow="OUT"
      />
      {/* FORM PREVIO A RECEPCION PARCIAL */}
      <PaymentMethodCompraDialogConfirm
        isBankMethod={isBankMethod}
        isCashMethod={isCashMethod}
        openFormPaymentDialog={openFormPaymentDialog}
        setOpenFormPaymentDialog={setOpenFormPaymentDialog}
        observaciones={observaciones}
        setObservaciones={setObservaciones}
        proveedorSelected={proveedorSelected}
        setProveedorSelected={setProveedorSelected}
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        optionsCajas={optionsCajas}
        handleSelectCaja={handleSelectCaja}
        cajaSelected={cajaSelected}
        setCajaSelected={setCajaSelected}
        cajaTieneSaldo={cajaTieneSaldo}
        montoRecepcion={montoRecepcion}
        cajasDisponibles={cajasDisponibles}
        cuentaBancariaSelected={cuentaBancariaSelected}
        setCuentaBancariaSelected={setCuentaBancariaSelected}
        cuentasBancarias={cuentasBancarias}
        canContinue={canContinue}
        onContinue={onContinueFromPayment}
        proveedores={proveedores}
      />

      <CostosAsociadosDialog
        open={openCostoDialog}
        onOpenChange={(v) => {
          setOpenCostoDialog(v);
          // Si el usuario cierra sin guardar, continuamos al modal final (omitir costo)
          if (!v && !costoStepDone) {
            if (recepcionFlow === "PARCIAL") setOpenRecibirParcial(true);
            else setOpenSendStock(true);
          }
        }}
        compraId={compraId}
        sucursalId={sucursalId}
        proveedorId={registro.proveedor?.id ?? 1}
        compraSubtotal={montoRecepcion}
        cajasDisponibles={cajasDisponibles.map((c) => ({
          id: c.id,
          label: `Caja #${c.id}`,
          disponibleEnCaja: c.disponibleEnCaja,
        }))}
        cuentasBancarias={cuentasBancarias}
        defaultMetodoPago={""}
        onSubmit={({ mf, prorrateo }: CostosAsociadosDialogResult) => {
          setMfDraft(mf);
          setProrrateoMeta(prorrateo ?? null);
          setCostoStepDone(true);
          setOpenCostoDialog(false);

          // Ahora sí abrimos el modal final de confirmación
          if (recepcionFlow === "PARCIAL") setOpenRecibirParcial(true);
          else setOpenSendStock(true);
        }}
      />
    </motion.div>
  );
}
