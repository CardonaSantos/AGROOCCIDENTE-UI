import axios from "axios";
import {
  CreateRequisitionDto,
  RequisitionResponse,
  StockAlertItem,
} from "./utils";

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

export const getOneRequisicion = async (id: number) => {
  return axios
    .get(`${API_URL}/requisicion/one-requisicion/${id}`)
    .then((data) => data.data);
};

export const makeRequisicionesStock = (id: number) => {
  return axios.post(`${API_URL}/requisicion/one-requisicion/${id}`);
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

export interface dataCreateCompra {
  requisicionID: number | undefined;
  userID: number;
  proveedorId: number;
}

//GENERAR COMPRA
export const generarCompra = (data: dataCreateCompra) => {
  return axios.post(`${API_URL}/compra-requisicion/generar-compra`, data);
};
