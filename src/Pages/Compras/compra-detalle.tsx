"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ReactSelectComponent from "react-select";
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

const METODO_PAGO_OPTIONS: Array<{
  value: MetodoPago;
  label: string;
  canal: "CAJA" | "BANCO" | "NINGUNO";
}> = [
  { value: "EFECTIVO", label: "Efectivo", canal: "CAJA" },
  { value: "TRANSFERENCIA", label: "Transferencia/Depósito", canal: "BANCO" },
  { value: "TARJETA", label: "Tarjeta", canal: "BANCO" },
  { value: "CHEQUE", label: "Cheque", canal: "BANCO" },
];

export interface CajaConSaldo {
  id: number;
  fechaApertura: string;
  estado: string;
  actualizadoEn: string;
  saldoInicial: number;
  usuarioInicioId: number;
  disponibleEnCaja: number;
}
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
    {
      compraId: number;
      usuarioId: number;
      proveedorId: number;
      observaciones?: string;
      metodoPago: string;
      cuentaBancariaId?: number;
      registroCajaId?: number;
    }
  >("post", `/compra-requisicion/${compraId}/recepcionar`, undefined, {
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["compra", compraId] }),
        queryClient.invalidateQueries({ queryKey: ["compras"] }), // comodín por si hay listados cacheados
      ]);
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

    const payload: {
      compraId: number;
      usuarioId: number;
      proveedorId: number;
      observaciones?: string;
      metodoPago: string;
      cuentaBancariaId?: number;
      registroCajaId?: number;
    } = {
      compraId,
      usuarioId,
      proveedorId: Number(proveedorSelected),
      observaciones,
      metodoPago,
    };

    if (isBankMethod(metodoPago)) {
      payload.cuentaBancariaId = parseInt(cuentaBancariaSelected);
    }
    if (isCashMethod(metodoPago) && cajaSelected) {
      payload.registroCajaId = parseInt(cajaSelected);
    }

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
                  ? { ...l, ...item, checked: true }
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
    if (recepcionFlow === "PARCIAL") {
      setOpenRecibirParcial(true);
    } else {
      setOpenSendStock(true);
    }
  }, [
    recepcionFlow,
    setOpenFormPaymentDialog,
    setOpenRecibirParcial,
    setOpenSendStock,
  ]);

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
        </TabsList>

        <TabsContent value="compra">
          <ComprasMain
            //STATES
            openFormPaymentDialog={openFormPaymentDialog} // ✅ correcto
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
          />
        </TabsContent>
        <TabsContent value="recepcionesParciales">
          <RecepcionesMain compraId={compraId} />
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
      <Dialog open={openFormDialog} onOpenChange={setOpenFormDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Preparar envío a stock</DialogTitle>
            <DialogDescription>
              Complete la información necesaria antes de confirmar el envío a
              stock.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                placeholder="Observaciones acerca de la recepción de esta compra"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proveedor">Seleccionar Proveedor</Label>
              <Select
                value={proveedorSelected}
                onValueChange={setProveedorSelected}
              >
                <SelectTrigger id="proveedor">
                  <SelectValue placeholder="Seleccione un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {(proveedores ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metodPago">Método de pago</Label>
              <Select
                value={metodoPago}
                onValueChange={(v) => setMetodoPago(v as MetodoPago)}
              >
                <SelectTrigger id="metodPago">
                  <SelectValue placeholder="Seleccione un método de pago compra" />
                </SelectTrigger>
                <SelectContent>
                  {METODO_PAGO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!metodoPago && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Requerido para continuar.
                </p>
              )}
            </div>

            {/* Caja */}
            {isCashMethod(metodoPago) && (
              <div className="space-y-2">
                <Label>Seleccionar caja (saldo disponible)</Label>
                <ReactSelectComponent
                  options={optionsCajas}
                  onChange={handleSelectCaja}
                  value={
                    cajaSelected
                      ? optionsCajas.find((o) => o.value === cajaSelected) ??
                        null
                      : null
                  }
                  isClearable
                  isSearchable
                  className="text-black"
                  placeholder="Seleccione una caja a asignar"
                />
                {!cajaSelected && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Seleccione una caja para pagos en efectivo.
                  </p>
                )}
                {cajaSelected && !cajaTieneSaldo && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    La caja seleccionada no tiene saldo suficiente para{" "}
                    {formattMonedaGT(montoRecepcion)}.
                  </p>
                )}
                {!cajasDisponibles.some(
                  (c) => Number(c.disponibleEnCaja) >= montoRecepcion
                ) && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Ninguna caja abierta tiene saldo suficiente. Cambie a método
                    bancario o abra un turno.
                  </p>
                )}
              </div>
            )}

            {/* Banco */}
            {isBankMethod(metodoPago) && (
              <div className="space-y-2">
                <Label htmlFor="cuentaBancaria">
                  Cuenta Bancaria (requerida por método)
                </Label>
                <Select
                  value={cuentaBancariaSelected}
                  onValueChange={setCuentaBancariaSelected}
                >
                  <SelectTrigger id="cuentaBancaria">
                    <SelectValue placeholder="Seleccione una cuenta bancaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {(cuentasBancarias ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!cuentaBancariaSelected && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Requerida para {metodoPago?.toLowerCase()}.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenFormDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setOpenSendStock(true)}
                disabled={!canContinue}
              >
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </motion.div>
  );
}
