// /Pedidos/_components/PedidosTable.tsx
import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PedidoListItem } from "../interfaces";
import { formattFechaWithMinutes } from "@/Pages/Utils/Utils";
import { formattMonedaGT } from "@/utils/formattMoneda";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisIcon } from "lucide-react";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { Link } from "react-router-dom";
// import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
// const API_URL = import.meta.env.VITE_API_URL;

export default function PedidosTable({
  data,
  page,
  pageSize,
  totalItems,
  onPageChange,
  loading,

  openDeleteRegist,
  setOpenDeleteRegist,
  handleDelete,

  isDeleting,
  fetchAgain,
}: // setIsDeleting,
{
  data: PedidoListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  setOpenDeleteRegist: React.Dispatch<React.SetStateAction<boolean>>;
  openDeleteRegist: boolean;
  handleDelete: (id: number) => void;
  setIsDeleting: React.Dispatch<React.SetStateAction<boolean>>;
  isDeleting: boolean;
  //refetch
  fetchAgain: () => Promise<void>;
}) {
  const [idSelected, setIdSelected] = React.useState<number>(0);

  const columns = React.useMemo<ColumnDef<PedidoListItem>[]>(
    () => [
      {
        header: "Folio",
        accessorKey: "folio",
        cell: (ctx) => (
          <span className="font-medium">{ctx.getValue() as string}</span>
        ),
      },
      {
        header: "Fecha",
        accessorKey: "fecha",
        cell: (ctx) => formattFechaWithMinutes(ctx.getValue() as string),
      },
      {
        header: "Cliente",
        accessorFn: (r) => r.cliente?.nombre ?? "—",
        id: "cliente",
      },
      {
        header: "Total",
        accessorKey: "totalPedido",
        cell: (ctx) => formattMonedaGT(Number(ctx.getValue() || 0)),
      },
      {
        header: "Items",
        accessorFn: (r) => r._count?.lineas ?? 0,
        id: "items",
      },
      {
        header: "Estado",
        accessorKey: "estado",
        cell: (ctx) => (
          <Badge variant="secondary">{String(ctx.getValue())}</Badge>
        ),
      },

      {
        header: "Prioridad",
        accessorKey: "prioridad",
        cell: (ctx) => (
          <Badge variant="secondary">{String(ctx.getValue())}</Badge>
        ),
      },

      {
        header: "Tipo",
        accessorKey: "tipo",
        cell: (ctx) => (
          <Badge variant="secondary">{String(ctx.getValue())}</Badge>
        ),
      },

      {
        header: "Acciones",
        accessorKey: "opciones",
        cell: (ctx) => (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <EllipsisIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Opciones</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <Link to={`/pedido-detalles/${ctx.row.original.id}`}>
                <DropdownMenuItem>Ver detalles</DropdownMenuItem>
              </Link>

              <Link to={`/pedido-edit/${ctx.row.original.id}`}>
                <DropdownMenuItem>Editar</DropdownMenuItem>
              </Link>

              <DropdownMenuItem
                onClick={() => {
                  setIdSelected(ctx.row.original.id);
                  setOpenDeleteRegist(true);
                }}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <>
      <Card>
        <CardHeader className="grid grid-cols-2">
          <div className="">
            <CardTitle>Pedidos</CardTitle>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => fetchAgain()}>Refrescar</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder
                          ? null
                          : flexRender(
                              h.column.columnDef.header,
                              h.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-6"
                    >
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Sin pedidos…
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {page} de {totalPages} • {totalItems} pedidos
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdvancedDialog
        type="warning"
        open={openDeleteRegist}
        onOpenChange={setOpenDeleteRegist}
        title="Eliminación de registro de pedido"
        description="Se procederá a eliminar por completo este registro en su base de datos"
        confirmButton={{
          label: "Si, continuar y eliminar",
          disabled: isDeleting,
          loading: isDeleting,
          loadingText: "Eliminando registro...",
          onClick: () => handleDelete(idSelected),
        }}
        cancelButton={{
          label: "Cancelar",
          onClick: () => setOpenDeleteRegist(false),
          loadingText: "Cancelando...",
          disabled: isDeleting,
        }}
      />
    </>
  );
}
