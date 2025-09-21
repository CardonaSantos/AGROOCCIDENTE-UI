import axios from "axios";
import { CajaAbierta, CerrarCaja, IniciarCaja } from "./interfaces";
import { MovimientoCajaItem } from "./MovimientosCajaInterface";
import { VentaLigadaACaja } from "./VentasCaja/interface";
import { getApiErrorMessageAxios } from "../Utils/UtilsErrorApi";

const API_URL = import.meta.env.VITE_API_URL;

export const iniciarCaja = async (dto: IniciarCaja) => {
  const response = await axios.post<IniciarCaja>(
    `${API_URL}/caja/iniciar-caja`,
    dto
  );
  return response.data;
};

export const cerrarCaja = async (dto: CerrarCaja) => {
  const response = await axios.patch<CerrarCaja>(
    `${API_URL}/caja/cerrar-caja`,
    dto
  );
  return response.data;
};

export const getUltimoSaldoSucursal = async (
  sucursalID: number,
  userID: number
) => {
  const response = await axios.get<number>(
    `${API_URL}/caja/get-ultimo-saldo-usuario/${sucursalID}/${userID}/`
  );
  return response.data;
};

export const getUltimaCajaAbierta = async (
  sucursalID: number,
  userID: number
) => {
  const response = await axios.get<CajaAbierta>(
    `${API_URL}/caja/find-cash-regist-open/${sucursalID}/${userID}`
  );
  return response.data;
};

export const getCajasRegistros = async () => {
  const response = await axios.get<CajaAbierta>(
    `${API_URL}/caja/get-cajas-registros`
  );
  return response.data;
};

//MOVIMIENTOS
export const getMovimientosCajaById = async (cajaID: number) => {
  const response = await axios.get<MovimientoCajaItem[]>(
    `${API_URL}/movimiento-caja/movimientos-caja/${cajaID}`
  );
  return response.data;
};

export const deleteMovimiento = async (movimientoID: number) => {
  try {
    const response = await axios.delete(
      `${API_URL}/movimiento-caja/delete-movimiento/${movimientoID}`
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessageAxios(error));
  }
};

// VENTAS EN CAJA
export const getVentasCajaById = async (cajaID: number) => {
  const response = await axios.get<VentaLigadaACaja[]>(
    `${API_URL}/caja/get-cajas-registros-ventas/${cajaID}`
  );
  return response.data;
};
