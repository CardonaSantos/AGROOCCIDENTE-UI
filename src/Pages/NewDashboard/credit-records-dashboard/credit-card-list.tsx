import { SimpleCreditResponse } from "../credit-authorizations/interfaces/credit-records";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CreditCardSimple from "./credit-card-simple";
import { ListChecks } from "lucide-react";

interface ListCreditsProps {
  // OJO: SimpleCreditResponse ya es SimpleCredit[]
  credits: SimpleCreditResponse;
}

function CreditCardList({ credits }: ListCreditsProps) {
  const total = Array.isArray(credits) ? credits.length : 0;

  if (!Array.isArray(credits) || total === 0) {
    return (
      <Card>
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
            <CardTitle className="text-sm flex items-center gap-2">
              <ListChecks className="size-4" />
              Registros de créditos activos
            </CardTitle>
            <CardDescription>
              {total} registro{total > 1 ? "s" : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Contenedor scrollable, responsivo */}
      <CardContent className="max-h-80 overflow-y-auto pr-1">
        <ul className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {credits.map((c) => (
            <li key={c.id}>
              <CreditCardSimple credit={c} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default CreditCardList;
