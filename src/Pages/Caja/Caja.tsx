import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { CajaAbierta, CerrarCaja, IniciarCaja } from "./interfaces";
import { motion } from "framer-motion";
import DesvanecerHaciaArriba from "@/Crm/Motion/DashboardAnimations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  cerrarCaja,
  getMovimientosCajaById,
  getUltimaCajaAbierta,
  getUltimoSaldoSucursal,
  getVentasCajaById,
  iniciarCaja,
} from "./api";
import { useStore } from "@/components/Context/ContextSucursal";
import { MovimientoCajaItem } from "./MovimientosCajaInterface";
import MovimientoCajaPage from "./Movimientos/movimiento-caja-page";
import { VentaLigadaACaja } from "./VentasCaja/interface";
import { Proveedor } from "./Movimientos/types";
import { getProveedores } from "./Movimientos/api";
// import { CuentaBancaria } from "./Movimientos/movimientos-financieros";
import CajaForm from "./caja-form";
import { useApiQuery } from "@/hooks/genericoCall/genericoCallHook";
import { CuentasBancariasSelect } from "@/Types/CuentasBancarias/CuentasBancariasSelect";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";
function Caja() {
  const sucursalID: number = useStore((state) => state.sucursalId) ?? 0;
  const userID: number = useStore((state) => state.userId) ?? 0;
  const [cajaAbierta, setCajaAbierta] = useState<CajaAbierta | null>(null);
  const [isSubmiting, setIsSubmiting] = useState<boolean>(false);

  const [movimientos, setMovimientos] = useState<MovimientoCajaItem[]>([]);

  const [ventas, setVentas] = useState<VentaLigadaACaja[]>([]);
  console.log(
    "los movimientos y ventas, no se usan mas son: ",
    movimientos,
    ventas
  );

  const [cajaMontoAnterior, setCajaMontoAnterior] = useState<number>(1);
  const [nuevaCaja, setNuevaCaja] = useState<IniciarCaja | null>({
    saldoInicial: cajaMontoAnterior,
    sucursalId: sucursalID,
    usuarioInicioId: userID,
    comentario: "",
  });
  const [cerrarCajaDto, setCerrarCajaDto] = useState<CerrarCaja | null>({
    registroCajaId: cajaAbierta?.id ?? 0,
    usuarioCierra: userID,
    comentarioFinal: "",
  });
  console.log("La caja dto es: ", cerrarCajaDto);

  //STATES PARA ABRIR O CERRAR DIALOGS
  const [openConfirmDialog, setOpenConfirDialog] = useState<boolean>(false);
  const [openCloseCaja, setOpenCloseCaja] = useState<boolean>(false);

  let hasOpen: boolean = true;

  hasOpen = !!cajaAbierta && cajaAbierta.estado === "ABIERTO";
  useEffect(() => {
    if (hasOpen) {
      setNuevaCaja(null);
      setCerrarCajaDto((prev) => ({
        ...(prev ?? ({} as CerrarCaja)),
        registroCajaId: cajaAbierta?.id ?? 0,
        usuarioCierra: userID,
        comentarioFinal: "",
      }));
    } else {
      setCerrarCajaDto(null);
      setNuevaCaja({
        saldoInicial: cajaMontoAnterior,
        sucursalId: sucursalID,
        usuarioInicioId: userID,
        comentario: "",
      });
    }
  }, [hasOpen, cajaMontoAnterior, sucursalID, userID]);

  useEffect(() => {
    getCajaAbierta();
    getMontoAnterior();
    handleGetProveedores();
    // getCuentasBancarias();
  }, []);

  const handleChangeGeneric = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!nuevaCaja) return; // solo en modo ABRIR
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === "checkbox") return;
    setNuevaCaja({
      ...nuevaCaja,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    });
  };

  const handleChangeCerrar = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!cerrarCajaDto) return; // solo en modo CERRAR
    const { name, value, type } = e.target as HTMLInputElement;
    setCerrarCajaDto({
      ...cerrarCajaDto,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    });
  };

  const handleSubmitIniciarCaja = async () => {
    if (!nuevaCaja || isSubmiting) return;
    setIsSubmiting(true);

    if (nuevaCaja.saldoInicial <= 0) {
      toast.warning("No se puede iniciar un turno con saldo cero.");
      setIsSubmiting(false);
      setOpenConfirDialog(false);
      await reloadContext();
      return;
    }

    try {
      await toast.promise(iniciarCaja(nuevaCaja), {
        loading: "Iniciando turno en caja...",
        success: "Turno registrado",
        error: "Error al registrar turno en caja",
      });
      await reloadContext();
    } finally {
      setIsSubmiting(false);
      setOpenConfirDialog(false);
      await reloadContext();
    }
  };
  console.log("El obj nueva caja es: ", nuevaCaja);

  const handleCerrarCaja = async () => {
    if (!cerrarCajaDto || isSubmiting) return;
    setIsSubmiting(true);
    try {
      await toast.promise(cerrarCaja(cerrarCajaDto), {
        loading: "Cerrando turno en caja...",
        success: "Caja cerrada correctamente",
        error: "Error al cerrar turno en caja",
      });
      await reloadContext(); // <- esto decide si limpia o trae todo
    } finally {
      setIsSubmiting(false);
      setOpenCloseCaja(false);
      await reloadContext();
    }
  };

  const getCajaAbierta = async () => {
    try {
      const data = await getUltimaCajaAbierta(sucursalID, userID);
      setCajaAbierta(data);
      return data;
    } catch {
      toast.error("Error al conseguir último registro de caja");
      return null;
    }
  };

  const getMontoAnterior = async () => {
    try {
      const data = await getUltimoSaldoSucursal(sucursalID);
      setCajaMontoAnterior(data);
    } catch {
      toast.error("Error al conseguir último monto de caja");
    }
  };

  const getMovimientosCaja = async (cajaId: number) => {
    try {
      const data = await getMovimientosCajaById(cajaId);
      setMovimientos(data);
    } catch {
      toast.error("Error al conseguir registros de movimientos de esta caja");
    }
  };
  const getVentasCaja = async (cajaId: number) => {
    try {
      const data = await getVentasCajaById(cajaId);
      setVentas(data);
    } catch {
      toast.error("Error al conseguir registros de ventas de esta caja");
    }
  };

  useEffect(() => {
    if (!cajaAbierta?.id) {
      setMovimientos([]);
      setVentas([]);
      return;
    }
    getMovimientosCaja(cajaAbierta.id);
    getVentasCaja(cajaAbierta.id);
  }, [cajaAbierta?.id]);

  const refreshMovimientos = useCallback(async () => {
    if (cajaAbierta?.id) {
      await getMovimientosCaja(cajaAbierta.id);
    } else {
      setMovimientos([]);
    }
  }, [cajaAbierta?.id]);

  const reloadContext = useCallback(async () => {
    const caja = await getUltimaCajaAbierta(sucursalID, userID);
    setCajaAbierta(caja);

    if (caja?.id) {
      // Caja abierta → limpiar nuevaCaja, preparar cerrarCajaDto
      setNuevaCaja(null);
      setCerrarCajaDto({
        registroCajaId: caja.id,
        usuarioCierra: userID,
        comentarioFinal: "", // 👈 forzar a vacío
      });

      const [movs, vtas] = await Promise.all([
        getMovimientosCajaById(caja.id),
        getVentasCajaById(caja.id),
      ]);
      setMovimientos(movs);
      setVentas(vtas);
    } else {
      // Caja cerrada → limpiar cerrarCajaDto, preparar nuevaCaja
      setCerrarCajaDto(null);
      setNuevaCaja({
        saldoInicial: cajaMontoAnterior,
        sucursalId: sucursalID,
        usuarioInicioId: userID,
        comentario: "", // 👈 forzar a vacío
      });
      setMovimientos([]);
      setVentas([]);
    }

    const saldo = await getUltimoSaldoSucursal(sucursalID);
    setCajaMontoAnterior(saldo);
  }, [sucursalID, userID, cajaMontoAnterior]);

  useEffect(() => {
    reloadContext();
  }, [reloadContext]);

  console.log("La caja abierta es: ", cajaAbierta);
  console.log(
    "El saldo anterior que en teoria es del parcial es: ",
    cajaMontoAnterior
  );

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const handleGetProveedores = async () => {
    try {
      const dt = await getProveedores();
      setProveedores(dt);
    } catch (error) {
      console.log(error);
    }
  };

  console.log("El monto anterior es: ", cajaMontoAnterior);

  const {
    data: cuentas = [],
    isError,
    error,
  } = useApiQuery<CuentasBancariasSelect[]>(
    ["cuentas-bancarias-select"],
    "/cuentas-bancarias/get-simple-select",
    undefined, // o {}
    {
      initialData: [],
      enabled: true, // 👈 fuerza el fetch
      refetchOnMount: "always", // opcional, asegura que pegue al server al montar
    }
  );

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessageAxios(error));
    }
  }, [isError, error]);
  console.log("cuentas bancarias en caja main page es: ", cuentas);

  return (
    <div className="container mx-auto">
      <motion.div {...DesvanecerHaciaArriba} className="w-full">
        <Tabs className="w-full" defaultValue="registrarcaja">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 h-auto p-1">
            <TabsTrigger
              value="registrarcaja"
              className="w-full text-sm md:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <span className="truncate">Registrar Caja</span>
            </TabsTrigger>
            <TabsTrigger
              value="movimientoscaja"
              className="w-full text-sm md:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <span className="truncate">Registrar Movimientos de Caja</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: Registrar Caja */}
          <TabsContent value="registrarcaja" className="mt-6">
            <motion.div {...DesvanecerHaciaArriba} className="w-full">
              {/* Center wrapper */}
              <div className="w-full flex justify-center">
                {/* El hijo ocupa todo el ancho disponible */}
                <div className="w-full">
                  <CajaForm
                    cuentas={cuentas}
                    hasOpen={hasOpen}
                    nuevaCaja={nuevaCaja}
                    handleChangeGeneric={handleChangeGeneric}
                    handleSubmitIniciarCaja={handleSubmitIniciarCaja}
                    cerrarCajaDto={cerrarCajaDto}
                    handleChangeCerrar={handleChangeCerrar}
                    handleCerrarCaja={handleCerrarCaja}
                    isSubmiting={isSubmiting}
                    cajaMontoAnterior={cajaMontoAnterior}
                    openCloseCaja={openCloseCaja}
                    openConfirmDialog={openConfirmDialog}
                    setOpenCloseCaja={setOpenCloseCaja}
                    /* ojo: nombre consistente */
                    setOpenConfirDialog={setOpenConfirDialog}
                    cajaAbierta={cajaAbierta}
                    reloadContext={reloadContext}
                  />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* TAB: Movimientos de Caja */}
          <TabsContent value="movimientoscaja" className="mt-6">
            {/* Center wrapper */}
            <div className="w-full flex justify-center">
              {/* El hijo ocupa todo el ancho disponible */}
              <div className="w-full">
                <MovimientoCajaPage
                  proveedores={proveedores}
                  reloadContext={reloadContext}
                  userID={userID}
                  getMovimientosCaja={refreshMovimientos}
                  cuentasBancarias={cuentas}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

export default Caja;
