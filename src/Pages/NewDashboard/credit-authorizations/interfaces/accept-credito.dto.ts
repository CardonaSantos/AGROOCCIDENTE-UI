import { MetodoPagoMainPOS } from "@/Pages/POS/interfaces/methodPayment";

export interface PayloadAcceptCredito {
  adminId: number;

  metodoPago?: MetodoPagoMainPOS;

  cuentaBancariaId?: number;

  cajaId?: number;

  comentario?: string;
  authCreditoId: number;
}
