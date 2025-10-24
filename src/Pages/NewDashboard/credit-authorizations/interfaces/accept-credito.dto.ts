import { MetodoPagoMainPOS } from "@/Pages/POS/interfaces/methodPayment";

export interface PayloadAcceptCredito {
  adminId: number;

  metodoPago?: MetodoPagoMainPOS;

  cuentaBancariaId: number | null;

  cajaId: number | null;

  comentario?: string;
  authCreditoId: number;

  referenciaPago?: string | null; // opcional
}
