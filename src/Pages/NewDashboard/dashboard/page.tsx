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
import { useSocketCtx, useSocketEvent } from "@/Web/realtime/SocketProvider"; // ✅ nuevo
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
import { AUTH_KEY, CREDIT_QK } from "./query";
import CxpCreditCardList from "../creditos-compras/CxpCreditCardList";
import { useCxpCreditosActivos } from "../creditos-compras/utils/useCxpActivos";

// import { useSocketCtx, useSocketEvent } from "@/Web/realtime/SocketProvider";
// import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL;
// Otras utilidades
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale("es");

// arriba del componente
const AUTH_FILTERS = { estado: "PENDIENTE" } as const;

export default function DashboardPageMain() {
  const { socket } = useSocketCtx(); // ✅

  const formatearFecha = (fecha: string) => {
    const nueva_fecha = dayjs(fecha).format("DD MMMM YYYY, hh:mm A");
    return nueva_fecha;
  };

  const sucursalId = useStore((state) => state.sucursalId);
  const userID = useStore((state) => state.userId) ?? 0;

  const [ventasMes, setVentasMes] = useState(0);
  const [ventasSemana, setVentasSemana] = useState(0);
  const [ventasDia, setVentasDia] = useState<DailyMoney>({
    totalDeHoy: 0,
  });
  const [ventasSemanalChart, setVentasSemanalChart] = useState<
    VentasSemanalChart[]
  >([]);
  const [masVendidos, setMasVendidos] = useState<MasVendidos[]>([]);
  const [transaccionesRecientes, setTransaccionesRecientes] = useState<
    VentaReciente[]
  >([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [solicitudesTransferencia, setSolicitudesTransferencia] = useState<
    SolicitudTransferencia[]
  >([]);
  const [warranties, setWarranties] = useState<GarantiaType[]>([]);
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);

  // Warranty Dialog States
  const [openUpdateWarranty, setOpenUpdateWarranty] = useState(false);
  const [selectWarrantyUpdate, setSelectWarrantyUpdate] =
    useState<GarantiaType | null>(null);
  const [comentario, setComentario] = useState("");
  const [descripcionProblema, setDescripcionProblema] = useState("");
  const [estado, setEstado] = useState<EstadoGarantia | null>(null);
  const [productoIdW, setProductoIdW] = useState<number>(0);
  const [warrantyId, setWarrantyId] = useState<number>(0);
  // Finish Warranty Dialog States
  const [openFinishWarranty, setOpenFinishWarranty] = useState(false);
  const [estadoRegistFinishW, setEstadoFinishW] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [accionesRealizadas, setAccionesRealizadas] = useState("");
  // Update timeline warranty dialog states
  const queryClient = useQueryClient();

  // --- Pago previo a aceptación de crédito ---
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);

  // estado controlado del dialog
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

  // Queries para cargar listas
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

  // Cajas abiertas por sucursal
  const cajasQ = useApiQuery<CajaConSaldo[]>(
    ["cajas-disponibles", sucursalId],
    `/caja/cajas-disponibles/${sucursalId}`,
    undefined,
    { enabled: !!sucursalId, staleTime: 30_000, refetchOnWindowFocus: false }
  );

  // Sanitizados
  const proveedores = proveedoresQ.data ?? [];
  const cuentasBancarias = cuentasQ.data ?? [];
  const cajasDisponibles = cajasQ.data ?? [];

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
        setSolicitudes(response.data);
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
        setSolicitudesTransferencia(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al conseguir solicitudes de transferencia");
    }
  };

  const getWarranties = async () => {
    try {
      //no cerrados
      const response = await axios.get(
        `${API_URL}/warranty/get-regists-warranties`
      );
      if (response.status === 200) {
        setWarranties(response.data);
        console.log("Nuevas garantías:", response.data); // Aquí sí tienes el valor correcto
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

  //credit authorizations
  const { data: authorizations } = useApiQuery<CreditAuthorizationListResponse>(
    AUTH_KEY, // 👈 usa la key con filtros
    "credito-authorization",
    { params: AUTH_FILTERS },
    {
      // asegura refetch inmediato al montar o remount
      refetchOnMount: "always",
      staleTime: 0,
    }
  );

  const { data: creditsRecords } = useApiQuery<SimpleCredit[]>(
    CREDIT_QK,
    "credito/simple-credit-dashboard",
    undefined,
    { refetchOnMount: "always", staleTime: 0 }
  );

  const { mutateAsync: acceptCreditAuth } = useApiMutation<
    any,
    PayloadAcceptCredito
  >("post", "credito-authorization/create-credito-from-auth", undefined, {
    onSuccess: () => {
      handleInvalidateQkRefresh();
    },
  });

  const handleInvalidateQkRefresh = () => {
    queryClient.invalidateQueries({ queryKey: AUTH_KEY });
    queryClient.invalidateQueries({ queryKey: CREDIT_QK });
  };

  useEffect(() => {
    if (sucursalId) {
      getInfo();
    }
  }, [sucursalId]);

  useEffect(() => {
    getSolicitudes();
    getSolicitudesTransferencia();
    getWarranties();
    getReparacionesRegis();
  }, []);

  //reemplazazr esto por lo de abajo
  useEffect(() => {
    if (socket) {
      const handleSolicitud = (solicitudNueva: Solicitud) => {
        setSolicitudes((prevSolicitudes) => [
          ...prevSolicitudes,
          solicitudNueva,
        ]);
      };
      const handleSolicitudTransferencia = (
        solicitudNueva: SolicitudTransferencia
      ) => {
        setSolicitudesTransferencia((prevSolicitudes) => [
          ...prevSolicitudes,
          solicitudNueva,
        ]);
      };

      socket.on("recibirSolicitud", handleSolicitud);
      socket.on("recibirSolicitudTransferencia", handleSolicitudTransferencia);

      return () => {
        socket.off("recibirSolicitud", handleSolicitud);
        socket.off(
          "recibirSolicitudTransferencia",
          handleSolicitudTransferencia
        );
      };
    }
  }, [socket]);

  //   useSocketEvent("recibirSolicitud", (s: Solicitud) => {
  //   setSolicitudes(prev => [s, ...prev]);
  // });

  // useSocketEvent("recibirSolicitudTransferencia", (s: SolicitudTransferencia) => {
  //   setSolicitudesTransferencia(prev => [s, ...prev]);
  // });

  const handleAceptRequest = async (idSolicitud: number) => {
    try {
      const response = await axios.patch(
        `${API_URL}/price-request/acept-request-price/${idSolicitud}/${userID}`
      );
      if (response.status === 200) {
        toast.success("Petición aceptada, precio concedido");
        getSolicitudes();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error");
    }
  };

  const handleRejectRequest = async (idSolicitud: number) => {
    try {
      const response = await axios.patch(
        `${API_URL}/price-request/reject-request-price/${idSolicitud}/${userID}`
      );
      if (response.status === 200) {
        toast.warning("Petición rechazada");
        getSolicitudes();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error");
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
    } catch (error) {
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
      conclusion: conclusion,
      accionesRealizadas: accionesRealizadas,
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

  // DashboardPageMain.tsx
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
    console.log("El payload creado es: ", payload);

    try {
      await toast.promise(acceptCreditAuth(payload), {
        success: "Crédito aceptado y registrado correctamente",
        loading: "Registrando crédito...",
        error: (error) => getApiErrorMessageAxios(error),
      });

      setOpenPaymentDialog(false); // <- cierra el form de pago
      setSelectedAuth(null);
    } catch (error) {
      console.log(error);
    }
  };

  const authorizationsData = Array.isArray(authorizations?.data)
    ? authorizations.data
    : [];

  const credits = Array.isArray(creditsRecords) ? creditsRecords : [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAuth, setSelectedAuth] = useState<NormalizedSolicitud | null>(
    null
  );

  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const toggleCard = (id: number) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

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

  const [openTimeLine, setOpenTimeLine] = useState(false);

  useSocketEvent(
    "credit:authorization.created",
    (payload: NormalizedSolicitud) => {
      console.log("[socket] credit:authorization.created", payload);
      console.log("cache antes:", queryClient.getQueryData(AUTH_KEY));
      queryClient.setQueryData<CreditAuthorizationListResponse>(
        AUTH_KEY,
        (prev) => {
          if (!prev) return prev;

          const exists = prev.data.some((x) => x.id === payload.id);
          const nextData = exists
            ? prev.data.map((x) => (x.id === payload.id ? payload : x))
            : [payload, ...prev.data];
          const total = exists ? prev.meta.total : prev.meta.total + 1;

          return {
            ...prev,
            data: nextData,
            meta: {
              ...prev.meta,
              total,
              pages: Math.ceil(total / prev.meta.limit),
            },
          };
        }
      );
      console.log("cache después:", queryClient.getQueryData(AUTH_KEY));
    }
  );
  // helpers para el copy (opcional arriba del JSX)
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

  // Extrae el monto de enganche (0 si no hay)
  function getMontoEnganche(auth: NormalizedSolicitud | null): number {
    if (!auth) return 0;
    const eng = auth.schedule.cuotas.find((c) => c.etiqueta === "ENGANCHE");
    return Number(eng?.monto ?? 0);
  }

  const handleReview = (auth: NormalizedSolicitud) => {
    setSelectedAuth(auth);

    // reset del form de pago (se usará luego)
    setObservacionesPay("");
    setProveedorSelected(undefined);
    setMetodoPagoSel("");
    setCuentaBancariaSelected("");
    setCajaSelected(null);

    // 1) primero confirmación
    setDialogOpen(true);
  };
  const { items, isLoading } = useCxpCreditosActivos();

  return (
    <motion.div {...DesvanecerHaciaArriba} className="container mx-auto">
      <h1 className="text-2xl font-bold">Dashboard de Administrador</h1>

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
          onClick: () => setDialogOpen(false),
          variant: "destructive",
        }}
        confirmButton={{
          label: "Confirmar y recepcionar crédito", // <- nuevo copy
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
