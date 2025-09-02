"use client";

import { DialogTrigger } from "@/components/ui/dialog";

import { Dialog } from "@/components/ui/dialog";

import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Trash, Search, Package, User, Calendar } from "lucide-react";
import { type GarantiaDto, EstadoGarantia } from "./../interfacesTable";
import { WarrantyDetailDialog } from "./warranty-detail-dialog";
import { PaginationControls } from "./pagination-controls";

import { formattFecha } from "@/Pages/Utils/Utils";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";
import { UseMutationResult } from "@tanstack/react-query";

interface WarrantyListProps {
  garantias: GarantiaDto[];
  handleDelete: () => void;
  setGarantiaSelected: React.Dispatch<React.SetStateAction<number | null>>;
  setIsOpenDelete: React.Dispatch<React.SetStateAction<boolean>>;
  isOpenDelete: boolean;
  eliminarGarantia: UseMutationResult<void, unknown, void, unknown>;
}

const ITEMS_PER_PAGE = 5;

const getEstadoGarantiaDisplayName = (estado: EstadoGarantia) => {
  if (estado === EstadoGarantia.RECIBIDO) {
    return "Recibido";
  }
  return estado.replace(/_/g, " "); // Replace underscores with spaces for better readability
};

export function WarrantyList({
  garantias,
  handleDelete,
  setGarantiaSelected,
  isOpenDelete,

  setIsOpenDelete,
  eliminarGarantia,
}: WarrantyListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarranty, setSelectedWarranty] = useState<GarantiaDto | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const filteredGarantias = useMemo(() => {
    if (!searchTerm) {
      return garantias;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return garantias.filter(
      (garantia) =>
        garantia.id.toString().includes(lowerCaseSearchTerm) ||
        garantia.cliente.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
        garantia.producto.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
        garantia.producto.codigo.toLowerCase().includes(lowerCaseSearchTerm) ||
        getEstadoGarantiaDisplayName(garantia.estado)
          .toLowerCase()
          .includes(lowerCaseSearchTerm)
    );
  }, [garantias, searchTerm]);

  const totalPages = Math.ceil(filteredGarantias.length / ITEMS_PER_PAGE);
  const paginatedGarantias = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredGarantias.slice(startIndex, endIndex);
  }, [currentPage, filteredGarantias]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (warranty: GarantiaDto) => {
    setSelectedWarranty(warranty);
    setIsDetailDialogOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <div className="container mx-auto py-8 px-4 md:px-6">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Gestión de Garantías
          </h1>

          <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
            <div className="relative flex-grow max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar garantías..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="pl-8 w-full"
                aria-label="Buscar garantías"
              />
            </div>
            {/* Add other actions like "Add New Warranty" button here if needed */}
          </div>

          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="min-w-[180px]">Producto</TableHead>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="min-w-[150px]">
                      Fecha Recepción
                    </TableHead>
                    <TableHead className="min-w-[120px]">Estado</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-center w-[150px]">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedGarantias.length > 0 ? (
                    paginatedGarantias.map((garantia) => (
                      <TableRow key={garantia.id}>
                        <TableCell className="font-medium">
                          {garantia.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-semibold">
                                {garantia.producto.nombre}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {garantia.producto.codigo}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {garantia.cliente.nombre}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formattFecha(garantia.fechaRecepcion)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getEstadoGarantiaDisplayName(garantia.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {garantia.cantidadDevuelta}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Dialog
                              open={
                                isDetailDialogOpen &&
                                selectedWarranty?.id === garantia.id
                              }
                              onOpenChange={setIsDetailDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleViewDetails(garantia)
                                      }
                                      aria-label={`Ver detalles de garantía ${garantia.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver Detalles</TooltipContent>
                                </Tooltip>
                              </DialogTrigger>
                              {selectedWarranty &&
                                isDetailDialogOpen &&
                                selectedWarranty.id === garantia.id && (
                                  <WarrantyDetailDialog
                                    warranty={selectedWarranty}
                                    isOpen={isDetailDialogOpen}
                                    onOpenChange={setIsDetailDialogOpen}
                                  />
                                )}
                            </Dialog>
                            {/* <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(garantia.id)}
                                  aria-label={`Editar garantía ${garantia.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip> */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setGarantiaSelected(garantia.id);
                                    setIsOpenDelete(true);
                                  }}
                                  aria-label={`Eliminar garantía ${garantia.id}`}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Eliminar</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No se encontraron garantías.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </TooltipProvider>

      <AdvancedDialog
        type="warning"
        onOpenChange={setIsOpenDelete}
        open={isOpenDelete}
        title="Eliminación de registro de garantía"
        description="¿Estás seguro de eliminar este registro?"
        confirmButton={{
          label: "Si, continuar y eliminar",
          loading: eliminarGarantia.isPending,
          disabled: eliminarGarantia.isPending,
          loadingText: "Eliminando...",
          onClick: () => handleDelete(),
        }}
        cancelButton={{
          label: "Cancelar",
          disabled: eliminarGarantia.isPending,
          loadingText: "Cancelando..",
          onClick: () => {
            setIsOpenDelete(false);
            setGarantiaSelected(0);
          },
        }}
      />
    </>
  );
}
