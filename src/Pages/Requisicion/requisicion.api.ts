import axios from "axios";
import { CreateRequisitionDto, StockAlertItem } from "./utils";
import {
  CreateRequisicionRecepcion,
  RequisitionPrintable,
  RequisitionResponse,
} from "./requisicion.interfaces";
const API_URL = import.meta.env.VITE_API_URL;
interface UpdateRequisitionDto {
  requisicionId: number;
  sucursalId: number;
  usuarioId: number;
  lineas: {
    productoId: number;
    cantidadSugerida: number;
  }[];
}

export const fetchStockAlerts = (sucursalId: number) =>
  axios
    .get<StockAlertItem[]>(`${API_URL}/requisicion/preview`, {
      params: { sucursalId },
    })
    .then((r) => r.data);

export const createRequisition = (dto: CreateRequisitionDto) =>
  axios
    .post<RequisitionResponse>(`${API_URL}/requisicion`, dto)
    .then((r) => r.data);

//get de registros de requisiciones
export const getRequisicionesRegist = async (): Promise<
  RequisitionResponse[]
> => {
  const { data } = await axios.get<RequisitionResponse[]>(
    `${API_URL}/requisicion`
  );
  return data;
};

export const deleteRequisicionRegis = async (id: number): Promise<void> => {
  return axios.delete(`${API_URL}/requisicion/${id}`).then(() => {});
};

export const getOneRequisicion = async (
  id: number
): Promise<RequisitionPrintable> => {
  return axios
    .get<RequisitionPrintable>(`${API_URL}/requisicion/one-requisicion/${id}`)
    .then((data) => data.data);
};

export const makeRequisicionesStock = (id: number) => {
  return axios.post(`${API_URL}/requisicion/one-requisicion/${id}`);
};

//HACER LA REQUISICION DE STOCKS
export const makeReEnterRequisicion = (data: CreateRequisicionRecepcion) => {
  return axios.post(
    `${API_URL}/recepcion-requisiciones/make-re-enter-producto`,
    data
  );
};

//HACER UN GET DEL REGISTRO DE REQUISICION PARA EDICION
export const getRequisicionToEdit = async (requisicionID: number) => {
  return await axios.get(
    `${API_URL}/requisicion/requisicion-to-edit/${requisicionID}`
  );
};

//ACTUALIZAR REGISTRO DE REQUISICION
export const updateRequisicion = async (data: UpdateRequisitionDto) => {
  return await axios.put(`${API_URL}/requisicion/update`, data);
};
