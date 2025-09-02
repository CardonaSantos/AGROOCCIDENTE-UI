import { Calendar, Building2, RefreshCw } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { Button } from "@/components/ui/button"; // shadcn
import { Card, CardContent } from "@/components/ui/card"; // shadcn
import { SucursalOption } from "../interfaces/FlujoCajaHsitoricoTypes";
import { es } from "date-fns/locale";

export type FiltersBarProps = {
  from: Date | null;
  to: Date | null;
  onChangeRange: (from: Date | null, to: Date | null) => void;
  sucursal: SucursalOption | null;
  sucursalesOptions: SucursalOption[];
  onChangeSucursal: (opt: SucursalOption | null) => void;
  onRefresh: () => void;
};

export function FiltersBar({
  from,
  to,
  onChangeRange,
  sucursal,
  sucursalesOptions,
  onChangeSucursal,
  onRefresh,
}: FiltersBarProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <DatePicker
              locale={es}
              selectsRange
              startDate={from ?? undefined}
              endDate={to ?? undefined}
              onChange={(dates) => {
                const [start, end] = dates as [Date | null, Date | null];
                onChangeRange(start, end);
              }}
              isClearable
              className="w-full rounded-md border px-3 py-2 text-sm text-black"
              placeholderText="Rango de fechas"
              dateFormat="dd/MM/yyyy"
            />
          </div>

          {/* Sucursal */}
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <div className="w-full">
              <Select
                options={sucursalesOptions}
                value={sucursal}
                onChange={(opt) => onChangeSucursal(opt as SucursalOption)}
                placeholder="Seleccione una sucursal"
                classNamePrefix="react-select"
                noOptionsMessage={() => "Sin resultados"}
              />
            </div>
          </div>

          {/* Refresh */}
          <div className="flex md:justify-end">
            <Button onClick={onRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refrescar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
