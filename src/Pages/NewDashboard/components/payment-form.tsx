"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/components/Context/ContextSucursal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type Cuotas, EstadoPago } from "../types/dashboard";
import { ReusableSelect } from "@/utils/components/ReactSelectComponent/ReusableSelect";
import { CreditCard } from "lucide-react";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";
import { getApiErrorMessageAxios } from "@/Pages/Utils/UtilsErrorApi";
import { axiosClient } from "@/hooks/getClientsSelect/Queries/axiosClient";
import { useMutation } from "@tanstack/react-query";
import { CuentasBancariasSelect } from "@/Types/CuentasBancarias/CuentasBancariasSelect";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export enum MetodoPago {
  EFECTIVO = "EFECTIVO",
  TRANSFERENCIA = "TRANSFERENCIA",
  TARJETA = "TARJETA",
  CHEQUE = "CHEQUE",
}
interface PaymentFormProps {
  cuota: Cuotas | undefined;
  CreditoID: number | undefined;
  setOpenPaymentCuota: (value: boolean) => void;
  getCredits: () => Promise<void>;
  montoPorCuota: number;
}

interface DtoPayment {
  monto: number;
  ventaCuotaId: number;
  estado: EstadoPago;
  comentario: string;
  usuarioId: number;
  CreditoID: number | undefined;
  sucursalId: number;
}

const OptionsMetodoPago: MetodoPago[] = [
  MetodoPago.EFECTIVO,
  MetodoPago.TRANSFERENCIA,
  MetodoPago.TARJETA,
  MetodoPago.CHEQUE,
];

const OptionsMetodoPagoToBanco: MetodoPago[] = [
  MetodoPago.TRANSFERENCIA,
  MetodoPago.TARJETA,
  MetodoPago.CHEQUE,
];

type CloseCreditVars = {
  id: number;
  comentario?: string;
  metodoPago: MetodoPago;
};

export function PaymentForm({
  cuota,
  setOpenPaymentCuota,
  CreditoID,
  getCredits,
  montoPorCuota,
}: PaymentFormProps) {
  const usuarioId = useStore((state) => state.userId) ?? 0;
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;

  const [monto, setMonto] = useState<string>(
    montoPorCuota.toFixed(2).toString()
  );
  const [estado, setEstado] = useState<EstadoPago>(EstadoPago.PAGADA);
  const [error, setError] = useState<string | null>(null);
  const [comentario, setComentario] = useState<string>("");
  const [comentarioCierre, setComentarioCierre] = useState<string>("");
  const [openCloseCredit, setOpenCloseCredit] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [cuentaBancaria, setCuentaBancaria] = useState<string>("");
  const submitPayment = useApiMutation<void, DtoPayment>(
    "post",
    "cuotas/register-new-pay",
    undefined,
    {
      onSuccess: () => {
        toast.success("Pago a credito realizado");
        getCredits();
        setOpenPaymentCuota(false);
        setMonto("");
        setEstado(EstadoPago.PAGADA);
      },
      onError: (error) => {
        toast.error(getApiErrorMessageAxios(error));
      },
    }
  );

  const closeCredit = useMutation({
    mutationFn: async ({ id, comentario }: CloseCreditVars) => {
      return axiosClient.patch<void>(`/cuotas/close-credit-regist/${id}`, {
        comentario,
        metodoPago: metodoPago,
      });
    },
    onSuccess: () => {
      toast.success("Crédito cerrado con éxito");
      setOpenCloseCredit(false);
      getCredits();
    },
    onError: (error) => {
      toast.error(getApiErrorMessageAxios(error));
    },
  });

  const {
    data: cuentas = [],
    // isError,
    // error: errorCuentasBancarias,
  } = useApiQuery<CuentasBancariasSelect[]>(
    ["cuentas-bancarias-select"],
    "/cuentas-bancarias/get-simple-select",
    undefined, // o {}
    {
      initialData: [],
      refetchOnMount: "always",
    }
  );

  const validateForm = (): boolean => {
    if (!monto || Number.parseFloat(monto) <= 0) {
      setError("El monto debe ser un número positivo");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (cuota) {
      const data = {
        monto: parseInt(monto),
        ventaCuotaId: cuota.id,
        estado: estado,
        comentario,
        usuarioId: usuarioId,
        CreditoID: CreditoID,
        sucursalId: sucursalId,
        metodoPago: metodoPago,
        cuentaBancariaId: parseInt(cuentaBancaria),
      };

      console.log("El payload: ", data);

      try {
        await submitPayment.mutateAsync(data);
      } catch (error) {
        console.log("Error en registrar pago cuota");
      }
    }
  };

  const handleCloseCredit = (creditID: number) => {
    if (!creditID) {
      toast.error("El ID del crédito no es válido.");
      return;
    }
    closeCredit.mutate({
      id: creditID,
      comentario: comentarioCierre?.trim(),
      metodoPago,
    });
  };

  const isInMetodoPago = OptionsMetodoPagoToBanco.includes(metodoPago);

  useEffect(() => {
    if (!isInMetodoPago) {
      setCuentaBancaria("");
    }
  }, [isInMetodoPago]);
  console.log("metodo pago: ", metodoPago, "cuenta bancaria: ", cuentaBancaria);

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="space-y-5">
        <div className="">
          <Label htmlFor="monto">Monto</Label>
          <Input
            id="monto"
            type="number"
            step="1"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Ingrese el monto"
            required
            aria-describedby="monto-error"
          />
          {error && (
            <p id="monto-error" className="text-sm text-red-500 mt-1">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" /> Método de pago
          </Label>
          <div className="">
            <ReusableSelect
              items={OptionsMetodoPago}
              getValue={(m) => m}
              getLabel={(m) => m}
              value={metodoPago}
              onChange={(m) => setMetodoPago(m as MetodoPago)}
              placeholder="Método de pago"
            />
          </div>
        </div>

        {isInMetodoPago ? (
          <div className="space-y-2">
            <Label htmlFor="cBancaria" className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" /> Cuenta bancaria
            </Label>
            <div className="">
              <Select onValueChange={setCuentaBancaria} value={cuentaBancaria}>
                <SelectTrigger id="cBancaria" className="w-full">
                  <SelectValue placeholder="Selecciona una cuenta bancaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>CUENTAS BANCARIAS DISPONIBLES</SelectLabel>
                    {Array.isArray(cuentas) ? (
                      cuentas.map((c) => {
                        // algo...
                        return (
                          <SelectItem value={c.id.toString()}>
                            {c.nombre}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="apple">
                        Cargando cuentas....
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        <div className="">
          <Textarea
            placeholder="Comentario (opcional)"
            value={comentario}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setComentario(e.target.value)
            }
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Registrar Pago
      </Button>
      <Button
        className="w-full"
        variant="destructive"
        type="button"
        disabled={closeCredit.isPending}
        onClick={() => setOpenCloseCredit(true)}
      >
        Cerrar Registro
      </Button>
      <Dialog onOpenChange={setOpenCloseCredit} open={openCloseCredit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cierre del Crédito</DialogTitle>
            <DialogDescription>
              Estás a punto de cerrar este registro de crédito. Una vez cerrado:
            </DialogDescription>
            <ul className="list-disc pl-6 text-muted-foreground text-sm">
              <li>No se podrán registrar más pagos.</li>
              <li>El estado del crédito será marcado como finalizado.</li>
              <li>Esta acción no se puede deshacer.</li>
            </ul>
            <DialogDescription className="mt-2">
              ¿Estás seguro de que deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Textarea
              placeholder="Añadir un comentario final (opcional)"
              value={comentarioCierre}
              onChange={(e) => setComentarioCierre(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-end space-x-2">
              <Button
                className="w-full bg-transparent"
                variant="outline"
                onClick={() => setOpenCloseCredit(false)}
              >
                Cancelar
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                disabled={closeCredit.isPending}
                onClick={() => {
                  handleCloseCredit(cuota?.id ?? 0);
                }}
              >
                {closeCredit.isPending ? "Cerrando..." : "Cerrar Crédito"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
