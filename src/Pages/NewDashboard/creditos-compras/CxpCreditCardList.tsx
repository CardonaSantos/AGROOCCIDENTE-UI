// src/features/cxp/components/CxpCreditCardList.tsx
// -------------------------------------------------
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import CxpCreditCardSimple from "./CxpCreditCardSimple";
import { UICxpCard } from "./interfaces/credito-cuota";

interface Props {
  credits: UICxpCard[];
  loading?: boolean;
  onRegistrarPago?: (documentoId: number) => void;
}

export default function CxpCreditCardList({
  credits,
  loading,
  onRegistrarPago,
}: Props) {
  const total = Array.isArray(credits) ? credits.length : 0;

  if (loading) {
    return (
      <Card className="my-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ListChecks className="size-4" />
            Registros de créditos activos
          </CardTitle>
          <CardDescription>Cargando…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted/50 rounded-md animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!Array.isArray(credits) || total === 0) {
    return (
      <Card className="my-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ListChecks className="size-4" />
            Registros de créditos activos
          </CardTitle>
          <CardDescription>No hay registros activos.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Cuando existan créditos activos aparecerán aquí.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-4 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="size-4" />
              Registros de créditos compras activos
            </CardTitle>
            <CardDescription>
              {total} registro{total > 1 ? "s" : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="max-h-80 overflow-y-auto pr-1">
        <ul className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {credits.map((c) => (
            <li key={c.id}>
              <CxpCreditCardSimple cxp={c} onRegistrarPago={onRegistrarPago} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
