"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useStore } from "@/components/Context/ContextSucursal";
import type {
  DailyMoney,
  MasVendidos,
  Reparacion,
  Solicitud,
  SolicitudTransferencia,
  VentasSemanalChart,
  VentaReciente,
} from "../types/dashboard";

// Motion y tarjetas generales
import DesvanecerHaciaArriba from "../components/dashboard/motion/desvanecer-hacia-arriba";
import { OverviewCards } from "../components/overview-cards";

// Dashboard cards / tablas
import { SalesChartCard } from "../components/sales-chart-card";
import { TopSellingProductsTable } from "../components/top-selling-products-table";
import { RecentTransactionsTable } from "../components/recent-transactions-table";
import { RepairCardList } from "../components/repair-card-list";
import { WarrantyCardList } from "../components/warranty-card-list";
import { PriceRequestList } from "../components/price-request-list";
import { TransferRequestList } from "../components/transfer-request-list";

// Diálogos de garantía
import { UpdateWarrantyDialog } from "../components/update-warranty-dialog";
import { FinishWarrantyDialog } from "../components/finish-warranty-dialog";
import TableAlertStocks from "@/Pages/Dashboard/TableAlertStocks";
import { TimeLineDto } from "../components/API/interfaces.interfaces";
import { createNewTimeLine } from "../components/API/api";
import { EstadoGarantia, GarantiaType } from "../types/newGarantyTypes";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { useSocketEvent } from "@/Web/realtime/SocketProvider"; // ✅ nuevo
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import {
  CreditAuthorizationListResponse,
  NormalizedSolicitud,
} from "../credit-authorizations/interfaces/Interfaces.interfaces";
import { useQueryClient } from "@tanstack/react-query";
import Authorizations from "../credit-authorizations/credit-autorizations-main-page";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { Button } from "@/components/ui/button";
import { PayloadAcceptCredito } from "../credit-authorizations/interfaces/accept-credito.dto";
import { getApiErrorMessageAxios } from "@/Pages/Utils/UtilsErrorApi";
import { MetodoPagoMainPOS } from "@/Pages/POS/interfaces/methodPayment";
import PurchasePaymentFormDialog, {
  CajaConSaldo,
} from "@/utils/components/SelectMethodPayment/PurchasePaymentFormDialog";
import { SimpleCredit } from "../credit-authorizations/interfaces/credit-records";
import CreditCardList from "../credit-records-dashboard/credit-card-list";
import {
  AUTH_BASE_KEY,
  AUTH_FILTERS,
  AUTH_KEY,
  AUTH_QK,
  CREDIT_QK,
  PRICE_REQUESTS_QK,
  TRANSFER_REQUESTS_QK,
} from "./query";
import CxpCreditCardList from "../creditos-compras/CxpCreditCardList";
import { useCxpCreditosActivos } from "../creditos-compras/utils/useCxpActivos";
import { Textarea } from "@/components/ui/textarea";
import { ListResp, upsertIntoList } from "../helpers/UpserSocketEvent";

const API_URL = import.meta.env.VITE_API_URL;
// Otras utilidades
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale("es");
interface RejectDto {
  authId: number | undefined;
  adminId: number;
  sucursalId: number | null;
  motivoRechazo: string;
}
// arriba del componente

export default function DashboardPageMain() {
  //  Store / Params / Utiles
  const sucursalId = useStore((s) => s.sucursalId) ?? 0;
  const userID = useStore((s) => s.userId) ?? 0;

  const formatearFecha = (fecha: string) =>
    dayjs(fecha).format("DD MMMM YYYY, hh:mm A");

  //  Query Client
  const queryClient = useQueryClient();

  // Estado local (UI / datos)

  // Métricas / listas dashboard
  const [ventasMes, setVentasMes] = useState(0);
  const [ventasSemana, setVentasSemana] = useState(0);
  const [ventasDia, setVentasDia] = useState<DailyMoney>({ totalDeHoy: 0 });
  const [ventasSemanalChart, setVentasSemanalChart] = useState<
    VentasSemanalChart[]
  >([]);
  const [masVendidos, setMasVendidos] = useState<MasVendidos[]>([]);
  const [transaccionesRecientes, setTransaccionesRecientes] = useState<
    VentaReciente[]
  >([]);
  const [warranties, setWarranties] = useState<GarantiaType[]>([]);
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);

  // Dialogs / selection states
  const [openUpdateWarranty, setOpenUpdateWarranty] = useState(false);
  const [selectWarrantyUpdate, setSelectWarrantyUpdate] =
    useState<GarantiaType | null>(null);
  const [comentario, setComentario] = useState("");
  const [descripcionProblema, setDescripcionProblema] = useState("");
  const [estado, setEstado] = useState<EstadoGarantia | null>(null);
  const [productoIdW, setProductoIdW] = useState<number>(0);
  const [warrantyId, setWarrantyId] = useState<number>(0);

  const [openFinishWarranty, setOpenFinishWarranty] = useState(false);
  const [estadoRegistFinishW, setEstadoFinishW] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [accionesRealizadas, setAccionesRealizadas] = useState("");

  // Pago previo a aceptación de crédito
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [observacionesPay, setObservacionesPay] = useState("");
  const [proveedorSelected, setProveedorSelected] = useState<
    string | undefined
  >(undefined);
  const [metodoPagoSel, setMetodoPagoSel] = useState<MetodoPagoMainPOS | "">(
    ""
  );
  const [cuentaBancariaSelected, setCuentaBancariaSelected] =
    useState<string>("");
  const [cajaSelected, setCajaSelected] = useState<string | null>(null);

  // Rechazo de crédito
  const [openReject, setOpenReject] = useState<boolean>(false);
  const [motivoRechazo, setMotivoRechazo] = useState<string>("");

  // Autorizaciones (UI)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAuth, setSelectedAuth] = useState<NormalizedSolicitud | null>(
    null
  );

  // Expansión en tarjetas
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const toggleCard = (id: number) =>
    setExpandedCard(expandedCard === id ? null : id);

  // Timeline dialog
  const [openTimeLine, setOpenTimeLine] = useState(false);

  // ---------------------------------------------
  // 4) Colores y helpers puros
  // ---------------------------------------------
  const estadoColor: Record<EstadoGarantia, string> = {
    [EstadoGarantia.RECIBIDO]: "bg-blue-500",
    [EstadoGarantia.DIAGNOSTICO]: "bg-yellow-500",
    [EstadoGarantia.EN_REPARACION]: "bg-orange-500",
    [EstadoGarantia.ESPERANDO_PIEZAS]: "bg-indigo-500",
    [EstadoGarantia.REPARADO]: "bg-green-500",
    [EstadoGarantia.REEMPLAZADO]: "bg-teal-500",
    [EstadoGarantia.RECHAZADO_CLIENTE]: "bg-red-500",
    [EstadoGarantia.CANCELADO]: "bg-gray-700",
    [EstadoGarantia.CERRADO]: "bg-gray-500",
  };

  function mapMetodoToPOS(m: MetodoPagoMainPOS | ""): MetodoPagoMainPOS {
    switch (m) {
      case "EFECTIVO":
      case "CONTADO":
        return MetodoPagoMainPOS.EFECTIVO;
      case "TRANSFERENCIA":
        return MetodoPagoMainPOS.TRANSFERENCIA;
      case "TARJETA":
        return MetodoPagoMainPOS.TARJETA;
      case "CHEQUE":
        return MetodoPagoMainPOS.CHEQUE;
      default:
        return MetodoPagoMainPOS.EFECTIVO;
    }
  }

  function getMontoEnganche(auth: NormalizedSolicitud | null): number {
    if (!auth) return 0;
    const eng = auth.schedule.cuotas.find((c) => c.etiqueta === "ENGANCHE");
    return Number(eng?.monto ?? 0);
  }

  // Queries remotas (useApiQuery)
  const proveedoresQ = useApiQuery<Array<{ id: number; nombre: string }>>(
    ["proveedores"],
    "/proveedor",
    undefined,
    { staleTime: 5 * 60_000, refetchOnWindowFocus: false }
  );

  const cuentasQ = useApiQuery<Array<{ id: number; nombre: string }>>(
    ["cuentas-bancarias", "simple-select"],
    "cuentas-bancarias/get-simple-select",
    undefined,
    { staleTime: 5 * 60_000, refetchOnWindowFocus: false }
  );

  const cajasQ = useApiQuery<CajaConSaldo[]>(
    ["cajas-disponibles", sucursalId],
    `/caja/cajas-disponibles/${sucursalId}`,
    undefined,
    { enabled: !!sucursalId, staleTime: 30_000, refetchOnWindowFocus: false }
  );

  const { data: authorizations } = useApiQuery<CreditAuthorizationListResponse>(
    AUTH_QK(AUTH_FILTERS),
    "credito-authorization",
    { params: AUTH_FILTERS },
    { refetchOnMount: "always", staleTime: 0 }
  );

  const { data: creditsRecords } = useApiQuery<SimpleCredit[]>(
    CREDIT_QK,
    "credito/simple-credit-dashboard",
    undefined,
    { refetchOnMount: "always", staleTime: 0 }
  );

  const { data: priceRequests } = useApiQuery<Solicitud[]>(
    PRICE_REQUESTS_QK(sucursalId),
    "price-request",
    undefined,
    { enabled: !!sucursalId, staleTime: 15_000, refetchOnWindowFocus: false }
  );

  const { data: transferRequests } = useApiQuery<SolicitudTransferencia[]>(
    TRANSFER_REQUESTS_QK(sucursalId),
    "solicitud-transferencia-producto",
    undefined,
    { enabled: !!sucursalId, staleTime: 15_000, refetchOnWindowFocus: false }
  );

  // Mutations (useApiMutation)
  const { mutateAsync: acceptCreditAuth } = useApiMutation<
    any,
    PayloadAcceptCredito
  >("post", "credito-authorization/create-credito-from-auth", undefined, {
    onSuccess: () => handleInvalidateQkRefresh(),
  });

  const { mutateAsync: rejectCredito, isPending: isPendingReject } =
    useApiMutation<any, RejectDto>(
      "patch",
      "credito-authorization/reject-credito-from-auth",
      undefined,
      {
        onSuccess: () => {
          handleInvalidateQkRefresh();
          setOpenReject(false);
          setMotivoRechazo("");
        },
      }
    );

  // Data sanitizada / derivada
  const proveedores = proveedoresQ.data ?? [];
  const cuentasBancarias = cuentasQ.data ?? [];
  const cajasDisponibles = cajasQ.data ?? [];

  const solicitudes = Array.isArray(priceRequests) ? priceRequests : [];
  const solicitudesTransferencia = Array.isArray(transferRequests)
    ? transferRequests
    : [];

  const authorizationsData = Array.isArray(authorizations?.data)
    ? authorizations.data
    : [];
  const credits = Array.isArray(creditsRecords) ? creditsRecords : [];

  // Copys derivados para UI
  const nombreClienteSel = selectedAuth
    ? `${selectedAuth.cliente.nombre}${
        selectedAuth.cliente.apellidos
          ? " " + selectedAuth.cliente.apellidos
          : ""
      }`
    : "…";

  const montoSel = selectedAuth
    ? formattMonedaGT(selectedAuth.economico.totalPropuesto)
    : "…";

  const resumenPlan = selectedAuth
    ? `Plan: ${selectedAuth.economico.cuotasTotalesPropuestas} cuota${
        selectedAuth.economico.cuotasTotalesPropuestas === 1 ? "" : "s"
      } • Interés: ${selectedAuth.economico.interesTipo} ${
        selectedAuth.economico.interesPorcentaje
      }% • Primera cuota: ${
        selectedAuth.fechas.primeraCuotaISO
          ? new Date(selectedAuth.fechas.primeraCuotaISO).toLocaleDateString(
              "es-GT",
              {
                year: "numeric",
                month: "short",
                day: "2-digit",
              }
            )
          : "N/A"
      }`
    : "";

  // Helpers de API (axios) usados por efectos
  const getInfo = async () => {
    try {
      const [
        ventasMesRes,
        ventasSemanaRes,
        ventasDiaRes,
        ventasSemanalChartRes,
        productoMasVendidosRes,
        transaccionesRecientesR,
      ] = await Promise.all([
        axios.get(`${API_URL}/analytics/get-ventas/mes/${sucursalId}`),
        axios.get(`${API_URL}/analytics/get-ventas/semana/${sucursalId}`),
        axios.get(`${API_URL}/analytics/venta-dia/${sucursalId}`),
        axios.get(
          `${API_URL}/analytics/get-ventas/semanal-chart/${sucursalId}`
        ),
        axios.get(`${API_URL}/analytics/get-productos-mas-vendidos/`),
        axios.get(`${API_URL}/analytics/get-ventas-recientes/`),
      ]);

      setVentasMes(ventasMesRes.data);
      setVentasSemana(ventasSemanaRes.data);
      setVentasDia(ventasDiaRes.data);
      setVentasSemanalChart(ventasSemanalChartRes.data);
      setMasVendidos(productoMasVendidosRes.data);
      setTransaccionesRecientes(transaccionesRecientesR.data);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      toast.error("Error al recuperar informacion de ventas del servidor");
    }
  };

  const getSolicitudes = async () => {
    try {
      const response = await axios.get(`${API_URL}/price-request`);
      if (response.status === 200) {
        // manejar si es necesario
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al conseguir solicitudes");
    }
  };

  const getSolicitudesTransferencia = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/solicitud-transferencia-producto`
      );
      if (response.status === 200) {
        // manejar si es necesario
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al conseguir solicitudes de transferencia");
    }
  };

  const getWarranties = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/warranty/get-regists-warranties`
      );
      if (response.status === 200) {
        setWarranties(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al conseguir las garantías");
    }
  };

  const getReparacionesRegis = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/repair/get-regist-open-repair`
      );
      if (response.status === 200) {
        setReparaciones(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al conseguir datos");
    }
  };

  // Efectos (useEffect)
  useEffect(() => {
    if (sucursalId) getInfo();
  }, [sucursalId]);

  useEffect(() => {
    getSolicitudes();
    getSolicitudesTransferencia();
    getWarranties();
    getReparacionesRegis();
  }, []);

  // Eventos socket
  useSocketEvent("recibirSolicitud", (s: Solicitud) => {
    // if (s) invalidatePriceReqDebounced();
    console.log("La data del recibir solicitud precio es: ", s);

    queryClient.invalidateQueries({ queryKey: PRICE_REQUESTS_QK(sucursalId) });
  });

  useSocketEvent("recibirSolicitudTransferencia", (s: any) => {
    console.log("La solicitud de transferencia es: ", s);

    // if (s) invalidatePriceReqDebounced();
    queryClient.invalidateQueries({
      queryKey: TRANSFER_REQUESTS_QK(sucursalId),
    });
  });

  // Autorización de crédito creada (actualiza listas si matchea)
  useSocketEvent(
    "credit:authorization.created",
    (payload: NormalizedSolicitud) => {
      queryClient.setQueriesData<ListResp<NormalizedSolicitud>>(
        { queryKey: [AUTH_BASE_KEY] },
        (prev?: ListResp<NormalizedSolicitud>) =>
          upsertIntoList(prev, payload, { prepend: true })
      );
    }
  );

  // Handlers (acciones de UI)
  const handleInvalidateQkRefresh = () => {
    queryClient.invalidateQueries({ queryKey: AUTH_KEY });
    queryClient.invalidateQueries({ queryKey: CREDIT_QK });
  };

  const handleRejectCredit = async () => {
    const dto = {
      authId: selectedAuth?.id,
      adminId: userID,
      sucursalId,
      motivoRechazo,
    };

    if (!dto.adminId || !dto.authId || !dto.sucursalId) {
      toast.info("Propiedades insuficientes, recargue la pagina");
      return;
    }

    toast.promise(rejectCredito(dto), {
      loading: "Rechazando crédito",
      success: "Registro denegado",
      error: (error) => getApiErrorMessageAxios(error),
    });
  };

  const handleAceptRequest = async (idSolicitud: number) => {
    try {
      await axios.patch(
        `${API_URL}/price-request/acept-request-price/${idSolicitud}/${userID}`
      );
      toast.success("Petición aceptada, precio concedido");
    } catch (error) {
      console.error(error);
      toast.error("Error");
    } finally {
      queryClient.invalidateQueries({
        queryKey: PRICE_REQUESTS_QK(sucursalId),
      });
    }
  };

  const handleRejectRequest = async (idSolicitud: number) => {
    try {
      await axios.patch(
        `${API_URL}/price-request/reject-request-price/${idSolicitud}/${userID}`
      );
      toast.warning("Petición rechazada");
    } catch (error) {
      console.error(error);
      toast.error("Error");
    } finally {
      queryClient.invalidateQueries({
        queryKey: PRICE_REQUESTS_QK(sucursalId),
      });
    }
  };

  const handleAceptarTransferencia = async (
    idSolicitudTransferencia: number
  ) => {
    try {
      await axios.post(`${API_URL}/solicitud-transferencia-producto/aceptar`, {
        idSolicitudTransferencia,
        userID,
      });
      toast.success("Tranferencia completada");
      getSolicitudesTransferencia();
      queryClient.invalidateQueries({ queryKey: TRANSFER_REQUESTS_QK() });
    } catch (error) {
      console.error("Error al aceptar la transferencia:", error);
      toast.error("Error");
    }
  };

  const handleRejectTransferencia = async (
    idSolicitudTransferencia: number
  ) => {
    try {
      const response = await axios.delete(
        `${API_URL}/solicitud-transferencia-producto/rechazar/${idSolicitudTransferencia}/${userID}`
      );
      if (response.status === 200) {
        toast.warning("Solicitud de transferencia rechazada");
        getSolicitudesTransferencia();
        queryClient.invalidateQueries({ queryKey: TRANSFER_REQUESTS_QK() });
      }
    } catch (error) {
      console.error("Error al aceptar la transferencia:", error);
      toast.error("Error");
    }
  };

  const handleUpdateRegistW = async () => {
    if (!selectWarrantyUpdate) return;
    try {
      const response = await axios.patch(
        `${API_URL}/warranty/${selectWarrantyUpdate.id}`,
        {
          comentario,
          descripcionProblema,
          estado,
        }
      );
      if (response.status === 200) {
        toast.success("Registro actualizado correctamente");
        setOpenUpdateWarranty(false);
        getWarranties();
      }
    } catch {
      toast.error("Error al actualizar el registro");
    }
  };

  const handleSubmitFinishRegistW = async () => {
    if (!estadoRegistFinishW) {
      toast.warning("Debe seleccionar un estado");
      return;
    }
    if (!conclusion || !accionesRealizadas) {
      toast.warning("Debe llenar todos los campos");
      return;
    }
    const dtoFinishW = {
      garantiaId: warrantyId,
      usuarioId: userID,
      estado: estadoRegistFinishW,
      productoId: productoIdW,
      conclusion,
      accionesRealizadas,
    };
    try {
      const response = await axios.post(
        `${API_URL}/warranty/create-regist-warranty`,
        dtoFinishW
      );
      if (response.status === 201) {
        toast.success("Registro Finalizado");
        getWarranties();
        setOpenFinishWarranty(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al crear registro final");
    }
  };

  const handleCreateNewTimeLine = async (dto: TimeLineDto) => {
    try {
      await toast.promise(createNewTimeLine(dto), {
        loading: "Creando nuevo registro de timeline...",
        success: "Registro al historial agregado",
        error: "Error al insertar registro",
      });
      await getWarranties();
    } catch (error) {
      console.error("El error al crear timeline es:", error);
    }
  };

  const handleReview = (auth: NormalizedSolicitud) => {
    setSelectedAuth(auth);
    setObservacionesPay("");
    setProveedorSelected(undefined);
    setMetodoPagoSel("");
    setCuentaBancariaSelected("");
    setCajaSelected(null);
    setDialogOpen(true);
  };

  const handleAcceptCredit = async () => {
    if (!selectedAuth) return;

    const metodoPOS = mapMetodoToPOS(metodoPagoSel);
    const payload: PayloadAcceptCredito = {
      adminId: userID,
      comentario: observacionesPay || "Aprobación desde dashboard",
      metodoPago: metodoPOS,
      authCreditoId: selectedAuth.id,
      cuentaBancariaId:
        metodoPOS === MetodoPagoMainPOS.TRANSFERENCIA ||
        metodoPOS === MetodoPagoMainPOS.TARJETA ||
        metodoPOS === MetodoPagoMainPOS.CHEQUE
          ? cuentaBancariaSelected
            ? Number(cuentaBancariaSelected)
            : null
          : null,
      cajaId:
        metodoPOS === MetodoPagoMainPOS.EFECTIVO
          ? cajaSelected
            ? Number(cajaSelected)
            : null
          : null,
    };

    try {
      await toast.promise(acceptCreditAuth(payload), {
        success: "Crédito aceptado y registrado correctamente",
        loading: "Registrando crédito...",
        error: (error) => getApiErrorMessageAxios(error),
      });
      setOpenPaymentDialog(false);
      setSelectedAuth(null);
    } catch (error) {
      console.log(error);
    }
  };

  // Hook de CXPs (queda al final para mantener jerarquía de dependencias)
  const { items, isLoading } = useCxpCreditosActivos();

  return (
    <motion.div {...DesvanecerHaciaArriba} className="container mx-auto">
      <h1 className="text-2xl font-semibold">Dashboard Administrador</h1>

      {/* Resumen de ventas */}
      <OverviewCards
        ventasMes={ventasMes}
        ventasSemana={ventasSemana}
        ventasDia={ventasDia}
        formattMonedaGT={formattMonedaGT}
      />

      <Authorizations
        authorizationsData={authorizationsData}
        onReview={handleReview}
      />

      <TableAlertStocks />

      <CxpCreditCardList
        credits={items}
        loading={isLoading}
        onRegistrarPago={() => {
          // TODO: abre modal/route para registrar pago a proveedor
          // e.g. navigate(`/cxp/registrar-pago/${docId}`)
        }}
      />

      {/* DIALOG DE PAGO PARA RECEPCION DE CRÉDITO */}
      {/* 1) Diálogo de método de pago (siempre previo) */}
      <PurchasePaymentFormDialog
        open={openPaymentDialog}
        onOpenChange={setOpenPaymentDialog}
        title={
          getMontoEnganche(selectedAuth) > 0
            ? "Recepcionar enganche y asignar canal"
            : "Asignar canal de cobro para la venta a crédito"
        }
        description={
          getMontoEnganche(selectedAuth) > 0
            ? "Selecciona el método y canal donde se recibirá el enganche."
            : "Aunque no haya enganche, asigna el canal (caja o banco) que se ligará a la venta generada."
        }
        proveedores={proveedores}
        cuentasBancarias={cuentasBancarias}
        cajasDisponibles={cajasDisponibles}
        montoRecepcion={getMontoEnganche(selectedAuth)}
        formatMoney={formattMonedaGT}
        // controlados
        observaciones={observacionesPay}
        setObservaciones={setObservacionesPay}
        proveedorSelected={proveedorSelected}
        setProveedorSelected={setProveedorSelected}
        metodoPago={metodoPagoSel}
        setMetodoPago={(v) =>
          setMetodoPagoSel(v as unknown as MetodoPagoMainPOS)
        }
        cuentaBancariaSelected={cuentaBancariaSelected}
        setCuentaBancariaSelected={setCuentaBancariaSelected}
        cajaSelected={cajaSelected}
        setCajaSelected={setCajaSelected}
        // proveedor no aplica en este flujo
        requireProveedor={false}
        showProveedor={false}
        // AHORA FINALIZA AQUÍ:
        onContinue={handleAcceptCredit}
        continueLabel="Recepcionar y crear crédito" // <- nuevo copy
      />

      {/* ÚNICO diálogo global */}
      <AdvancedDialog
        type="warning"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Aprobación de crédito"
        question="¿Deseas aprobar y registrar este crédito?"
        description={
          selectedAuth
            ? `Al aprobar el crédito para ${nombreClienteSel} por ${montoSel}, se creará el registro de crédito y su seguimiento con la información proporcionada por el solicitante. Podrás editar los datos posteriormente si es necesario. ${
                resumenPlan ? "\n" + resumenPlan : ""
              }`
            : "…"
        }
        cancelButton={{
          label: "No aprobar",
          onClick: () => {
            setDialogOpen(false);
            setOpenReject(true);
          },
          variant: "destructive",
        }}
        confirmButton={{
          label: "Confirmar crédito", // <- nuevo copy
          onClick: () => {
            // cerrar confirmación y abrir el form de pago
            setDialogOpen(false);
            setOpenPaymentDialog(true);
          },
        }}
      >
        <Button
          className="w-full sm:w-full"
          onClick={() => setDialogOpen(false)}
        >
          Cerrar diálogo
        </Button>
      </AdvancedDialog>

      <AdvancedDialog
        type="warning"
        onOpenChange={setOpenReject}
        open={openReject}
        title="Rechazar autorización de crédito"
        description="Se rechazará este crédito y no se generará un registro del mismo."
        confirmButton={{
          label: "Si, rechazar",
          loading: isPendingReject,
          loadingText: "Rechazando...",
          onClick: handleRejectCredit,
          disabled: isPendingReject,
        }}
        cancelButton={{
          disabled: isPendingReject,
          label: "Cancelar",
          onClick: () => {
            setDialogOpen(true);
            setOpenReject(false);
          },
        }}
        children={
          <div className="">
            <Textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Motivo del rechazo"
            />
          </div>
        }
      />

      {/* MOSTRAR LOS CRÉDITOS ACTIVOS */}
      <CreditCardList credits={credits} />
      {/* MOSTRAR LAS REPARACIONES ACTIVAS */}
      <RepairCardList
        reparaciones={reparaciones}
        getReparacionesRegis={getReparacionesRegis}
        userID={userID ?? 0}
        sucursalId={sucursalId}
      />
      {/* MOSTRAR GARANTÍAS ACTIVAS */}
      <WarrantyCardList
        warranties={warranties}
        formatearFecha={formatearFecha}
        estadoColor={estadoColor}
        toggleCard={toggleCard}
        expandedCard={expandedCard}
        setOpenUpdateWarranty={setOpenUpdateWarranty}
        setSelectWarrantyUpdate={setSelectWarrantyUpdate}
        setComentario={setComentario}
        setDescripcionProblema={setDescripcionProblema}
        setEstado={setEstado}
        setProductoIdW={setProductoIdW}
        setWarrantyId={setWarrantyId}
        setOpenFinishWarranty={setOpenFinishWarranty}
        //ABRIR dialog create timeline
        openTimeLine={openTimeLine}
        setOpenTimeLine={setOpenTimeLine}
        warrantyId={warrantyId}
        handleCreateNewTimeLine={handleCreateNewTimeLine}
      />
      {/* MOSTRAR LAS SOLICITUDES DE PRECIO */}
      <PriceRequestList
        solicitudes={solicitudes}
        handleAceptRequest={handleAceptRequest}
        handleRejectRequest={handleRejectRequest}
        formatearFecha={formatearFecha}
      />
      {/* MOSTRAS LAS SOLICITUDES DE TRANSFERENCIA */}
      <TransferRequestList
        solicitudesTransferencia={solicitudesTransferencia}
        handleAceptarTransferencia={handleAceptarTransferencia}
        handleRejectTransferencia={handleRejectTransferencia}
        formatearFecha={formatearFecha}
      />
      {/* MOSTRAR DIALOG DE ACTUALIZAR REGISTRO DE GARANTÍA */}
      <UpdateWarrantyDialog
        open={openUpdateWarranty}
        onOpenChange={setOpenUpdateWarranty}
        selectWarrantyUpdate={selectWarrantyUpdate}
        comentario={comentario}
        setComentario={setComentario}
        descripcionProblema={descripcionProblema}
        setDescripcionProblema={setDescripcionProblema}
        estado={estado}
        setEstado={setEstado}
        handleUpdateRegistW={handleUpdateRegistW}
        setOpenFinishWarranty={setOpenFinishWarranty}
      />
      {/* MOSTRAR DIALOG DE FINALIZACION DE REGISTRO DE GARANTIA */}
      <FinishWarrantyDialog
        open={openFinishWarranty}
        onOpenChange={setOpenFinishWarranty}
        estadoRegistFinishW={estadoRegistFinishW}
        setEstadoFinishW={setEstadoFinishW}
        conclusion={conclusion}
        setConclusion={setConclusion}
        accionesRealizadas={accionesRealizadas}
        setAccionesRealizadas={setAccionesRealizadas}
        handleSubmitFinishRegistW={handleSubmitFinishRegistW}
      />
      {/* Gráfico de ventas */}
      <SalesChartCard ventasSemanalChart={ventasSemanalChart} />
      {/* Productos e inventario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopSellingProductsTable masVendidos={masVendidos} />
        <RecentTransactionsTable
          transaccionesRecientes={transaccionesRecientes}
          formatearFecha={formatearFecha}
        />
      </div>
    </motion.div>
  );
}
