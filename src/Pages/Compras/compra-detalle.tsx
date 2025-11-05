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
import CostosAsociadosDialog, {
  CostosAsociadosDialogResult,
  MovimientoFinancieroDraft,
  ProrrateoMeta,
} from "./components/Costos Asociados Dialog";

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
  // === Helpers ===
  const isBankMethod = (m?: MetodoPago | "") =>
    m === "TRANSFERENCIA" || m === "TARJETA" || m === "CHEQUE";
  const isCashMethod = (m?: MetodoPago | "") =>
    m === "EFECTIVO" || m === "CONTADO";

  // === Router / Store ===
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;
  const compraId = Number.isFinite(Number(id)) ? Number(id) : 0;
  const [recepcionFlow, setRecepcionFlow] = useState<RecepcionFlow>("NORMAL");

  // === Dialog/UI states ===
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
  const [costoStepDone, setCostoStepDone] = useState(false); // para saber si lo completaron

  // === QUERIES ===============================================================
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
        // refetchOnMount: "always",
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

  //Cajas abiertas por sucursal
  const cajasQ = useApiQuery<CajaConSaldo[]>(
    ["cajas-disponibles", sucursalId],
    `/caja/cajas-disponibles/${sucursalId}`,
    undefined,
    {
      enabled: !!sucursalId,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // onError: () => toast.error("Error al cargar cajas disponibles"),
    }
  );

  // === MUTATION: recepcionar compra =========================================
  const recepcionarM = useApiMutation<
    any, // respuesta del server
    any //algo a enviar
  >("post", `/compra-requisicion/${compraId}/recepcionar`, undefined, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compra", compraId] });
      queryClient.invalidateQueries({ queryKey: ["compras"] });
    },
  });

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

  // === DERIVED ===============================================================
  const registro = registroQ ?? null;
  const proveedores = proveedoresQ.data ?? [];
  const cuentasBancarias = cuentasQ.data ?? [];
  const cajasDisponibles = cajasQ.data ?? [];

  const montoRecepcion = useMemo(() => {
    if (recepcionFlow === "PARCIAL") {
      return selectedItems.lineas.reduce(
        (acc: number, item: ItemDetallesPayloadParcial) => {
          return acc + item.cantidadRecibida * item.precioCosto;
        },
        0
      );
    }
    return Number(registro?.resumen?.subtotal ?? registro?.total ?? 0);
  }, [registro, recepcionFlow, selectedItems]);

  useEffect(() => {
    if (!isBankMethod(metodoPago) && cuentaBancariaSelected) {
      setCuentaBancariaSelected("");
    }
  }, [metodoPago, cuentaBancariaSelected]);

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

  useEffect(() => {
    const idProv = registro?.proveedor?.id;
    setProveedorSelected(idProv ? String(idProv) : undefined);
  }, [registro?.proveedor?.id]);

  // === Handlers ==============================================================
  const onBack = () => navigate(-1);

  const handleSelectCaja = (option: Option | null) => {
    setCajaSelected(option ? option.value : null);
  };

  const sendtToStock = useCallback(async () => {
    if (!registro || recepcionarM.isPending) return;

    const usuarioId = registro.usuario.id ?? 1;

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

    // 🔴 Si el usuario saltó el paso de costos asociados, podemos seguir sin mf/prorrateo
    // pero lo ideal es aprovecharlos si existen.
    const mf = mfDraft
      ? {
          ...mfDraft,
          // blindajes de tipos/ids:
          sucursalId,
          proveedorId: Number(proveedorSelected),
          metodoPago: mfDraft.metodoPago as any,
          costoVentaTipo: mfDraft.costoVentaTipo as any,
          clasificacionAdmin: (mfDraft.clasificacionAdmin ??
            "COSTO_VENTA") as any,
          cuentaBancariaId: isBankMethod(metodoPago)
            ? Number(cuentaBancariaSelected)
            : undefined,
          registroCajaId:
            isCashMethod(metodoPago) && cajaSelected
              ? Number(cajaSelected)
              : undefined,
        }
      : undefined;

    // Meta de prorrateo (opcional)
    const prorrateo =
      prorrateoMeta && mf?.motivo === "COSTO_ASOCIADO"
        ? {
            aplicar: prorrateoMeta.aplicar,
            base: prorrateoMeta.base,
            incluirAntiguos: prorrateoMeta.incluirAntiguos ?? false, // <= NUEVO
          }
        : undefined;

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
      prorrateo?: typeof prorrateo;
    } = {
      usuarioId,
      proveedorId: Number(proveedorSelected),
      observaciones,
      metodoPago, // debe matchear enum backend
      sucursalId, // 🔵 REQUERIDO POR DTO
      // Sólo setear si aplica:
      ...(isBankMethod(metodoPago) && {
        cuentaBancariaId: Number(cuentaBancariaSelected),
      }),
      ...(isCashMethod(metodoPago) &&
        cajaSelected && { registroCajaId: Number(cajaSelected) }),
      // Overrides de líneas (para total no lo necesitas; para parcial ya tienes otra ruta)
      // lineas: ...
      ...(mf ? { mf } : {}),
      ...(prorrateo ? { prorrateo } : {}),
    };

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
    compraId,
    proveedorSelected,
    observaciones,
    metodoPago,
    cuentaBancariaSelected,
    cajaSelected,
    cajasDisponibles,
    montoRecepcion,
    sucursalId,
    mfDraft,
    prorrateoMeta,
  ]);

  // === UI Utils ==============================================================
  const optionsCajas: Option[] = cajasDisponibles.map((c) => ({
    label: `Caja #${c.id} · Inicial ${formattMonedaGT(
      c.saldoInicial
    )} · Disponible ${formattMonedaGT(c.disponibleEnCaja)}`,
    value: c.id.toString(),
  }));

  //derivado del state principal
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
      <Button variant="secondary" onClick={() => setOpenCostoDialog(true)}>
        Añadir costo asociado
      </Button>
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
        // Defaults (opcional): hereda método de pago elegido para la compra
        defaultMetodoPago={""}
        defaultMotivo={"COSTO_ASOCIADO"}
        defaultCostoVentaTipo={"FLETE"}
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
