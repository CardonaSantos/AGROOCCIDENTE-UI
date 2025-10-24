import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { useApiMutation } from "@/hooks/genericoCall/genericoCallHook";
import { formattFecha, formattMoneda } from "@/Pages/Utils/Utils";
import { NormAbono } from "../interfaces/CreditoResponse";
// Opcional: ajusta rutas si usas estos helpers

function DeleteAbonoButton({
  abono,
}: {
  abono: NormAbono;
  creditoId: number;
  onDone?: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  const delUrl = `credito/abonos/${abono.id}`; // TODO: ajusta a tu ruta real
  const { mutate: doDelete, isPending } = useApiMutation<null, any>(
    "delete",
    delUrl,
    {
      // onSuccess: async () => {
      //   setOpen(false);
      //   await onDone?.();
      // },
    }
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title="Eliminar abono"
        onClick={() => setOpen(true)}
        className="h-8 w-8"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar abono</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el abono{" "}
              <b>{formattMoneda(abono.montoTotal)}</b> del{" "}
              {formattFecha(abono.fechaISO)}.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                Cancelar
              </Button>
            </DialogClose>

            <Button
              variant="destructive"
              onClick={() => doDelete(null)}
              disabled={isPending}
            >
              {isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DeleteAbonoButton;
