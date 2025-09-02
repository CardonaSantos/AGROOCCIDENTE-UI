// src/Pages/CuentasBancarias/_components/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { CuentaBancariaResumen } from "../Interfaces/CuentaBancariaResumen";

export const buildColumns = (actions: {
  onView: (row: CuentaBancariaResumen) => void;
  onEdit: (row: CuentaBancariaResumen) => void;
  onToggle: (row: CuentaBancariaResumen) => void;
  onDelete: (row: CuentaBancariaResumen) => void;
}): ColumnDef<CuentaBancariaResumen>[] => [
  {
    accessorKey: "banco",
    header: "Banco",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.banco}</p>
        <p className="text-xs text-muted-foreground">{row.original.numero}</p>
      </div>
    ),
  },
  {
    accessorKey: "alias",
    header: "Alias",
    cell: ({ row }) => row.original.alias ?? "-",
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => <Badge>{row.original.tipo}</Badge>,
  },
  // {
  //   accessorKey: "saldoActual",
  //   header: "Saldo",
  //   cell: ({ row }) =>
  //     new Intl.NumberFormat("es-GT", {
  //       style: "currency",
  //       currency: "GTQ",
  //     }).format(row.original.saldoActual),
  // },
  {
    accessorKey: "ultimoMovimiento",
    header: "Último mov.",
    cell: ({ row }) =>
      row.original.ultimoMovimiento
        ? format(new Date(row.original.ultimoMovimiento), "dd/MM/yyyy")
        : "-",
  },
  {
    accessorKey: "activa",
    header: "Estado",
    cell: ({ row }) =>
      row.original.activa ? (
        <Badge className="bg-green-600">Activa</Badge>
      ) : (
        <Badge className="bg-gray-500">Inactiva</Badge>
      ),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => actions.onEdit(row.original)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => actions.onToggle(row.original)}
        >
          {row.original.activa ? (
            <ToggleLeft className="h-4 w-4 text-red-500" />
          ) : (
            <ToggleRight className="h-4 w-4 text-green-500" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => actions.onDelete(row.original)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    ),
  },
];
