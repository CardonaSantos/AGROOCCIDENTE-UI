import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type {
  RequisitionResponseDTO,
  RequisitionEstado,
  RequisitionLineDTO,
} from "./requisicion.interfaces";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Printer,
  Eye,
  Calendar,
  Package,
  DollarSign,
  Loader2,
  TriangleAlert,
  Layers3,
  Hash,
  Barcode,
} from "lucide-react";
import { toast } from "sonner";
import ReactSelect from "react-select";

import { useStore } from "@/components/Context/ContextSucursal";
import { useProveedoresSelect } from "@/hooks/getProveedoresSelect/proveedores";
import {
  useApiMutation,
  useApiQuery,
} from "@/hooks/genericoCall/genericoCallHook";

import { formattMonedaGT as formatearMoneda } from "@/utils/formattMoneda";
import { formattFechaWithMinutes as formatearFecha } from "@/Pages/Utils/Utils";
import { getApiErrorMessageAxios } from "@/Pages/Utils/UtilsErrorApi";
import { AdvancedDialog } from "@/utils/components/AdvancedDialog";

// ---------- UI helpers ----------
const CLOSED_STATES = new Set<RequisitionEstado>([
  "COMPLETADA",
  "RECIBIDA",
  "ENVIADA_COMPRAS",
]);

function getEstadoBadgeVariant(estado: RequisitionEstado) {
  switch (estado) {
    case "BORRADOR":
      return "secondary";
    case "PENDIENTE":
      return "outline";
    case "APROBADA":
      return "default";
    case "ENVIADA":
      return "secondary";
    case "RECIBIDA":
      return "outline";
    case "COMPLETADA":
      return "default";
    case "CANCELADA":
      return "destructive";
    case "ENVIADA_COMPRAS":
      return "secondary";
    default:
      return "secondary";
  }
}

type Option = { value: string; label: string };

const InfoRow = ({
  label,
  children,
  bold = false,
}: {
  label: string;
  children: React.ReactNode;
  bold?: boolean;
}) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={bold ? "font-bold" : "font-medium"}>{children}</span>
  </div>
);

// ---------- Props opcionales para usar datos del padre ----------
type ExternalQueryProps = Partial<{
  data: RequisitionResponseDTO[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown> | void;
}>;

// ---------- Componente ----------
export default function RequisicionesList(props: ExternalQueryProps) {
  const userId = useStore((s) => s.userId) ?? 0;

  // Si el padre no nos pasó data, hacemos la query interna (compatibilidad drop-in)
  const useInternalQuery = props.data === undefined;

  const {
    data: requisiciones = [],
    isFetching: isLoadingRequisiciones,
    isError: isErrorRequisiciones,
    error: errorRequisiciones,
    refetch: reFetchRequisiciones,
  } = useInternalQuery
    ? useApiQuery<RequisitionResponseDTO[]>(
        ["requisiciones-registros"],
        "requisicion",
        undefined,
        {
          initialData: [],
          // ayuda a que cargue siempre que entras a la pestaña
          refetchOnMount: "always",
          refetchOnReconnect: true,
          refetchOnWindowFocus: false,
          staleTime: 10_000,
        }
      )
    : {
        data: props.data ?? [],
        isFetching: !!props.isLoading,
        isError: !!props.isError,
        error: props.error,
        refetch: props.refetch ?? (() => {}),
      };

  // Proveedores -> options para react-select
  const { data: proveedores = [] } = useProveedoresSelect();
  const proveedorOptions: Option[] = useMemo(
    () =>
      (proveedores ?? []).map((p) => ({
        value: String(p.id),
        label: `${p.nombre} (${p.telefonoContacto ?? "Sin contacto"})`,
      })),
    [proveedores]
  );

  // ---------- UI state ----------
  const [selectedRequisicion, setSelectedRequisicion] =
    useState<RequisitionResponseDTO | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openConfirmDel, setOpenConfirmDel] = useState(false);
  const [openSendCompras, setOpenSendCompras] = useState(false);
  const [proveedorSelected, setProveedorSelected] = useState<string>("");

  // Paginación simple (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(requisiciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequis = requisiciones.slice(startIndex, endIndex);

  useEffect(() => {
    if (!isDialogOpen) setSelectedRequisicion(null);
  }, [isDialogOpen]);

  // Flags/acciones por requisición
  function getReqFlags(req?: RequisitionResponseDTO | null) {
    const estado = req?.estado as RequisitionEstado | undefined;
    const isClosed = !!estado && CLOSED_STATES.has(estado);
    const isEnviadaCompras = estado === "ENVIADA_COMPRAS";
    const canSendToCompras = !!req && !isClosed;
    const canEdit = !!req && !req.ingresadaAStock && !isClosed;

    return {
      isClosed,
      isEnviadaCompras,
      canSendToCompras,
      canEdit,
      sendLabel: isEnviadaCompras
        ? "Enviado a compras"
        : "Enviar lista a módulo compras",
    };
  }

  const handleVerDetalles = (req: RequisitionResponseDTO) => {
    setSelectedRequisicion(req);
    setIsDialogOpen(true);
  };

  const handleImprimir = (req: RequisitionResponseDTO) => {
    window.open(`/pdf-requisicion/${req.id}`, "_blank");
  };

  // ---------- Mutaciones ----------
  // OJO: el path usa el id actual (cada render actualiza el hook)
  const deleteRequisicion = useApiMutation<void, void>(
    "delete",
    `requisicion/${selectedRequisicion?.id}`,
    {}
  );

  interface DtoToSendCompras {
    requisicionID: number | undefined;
    userID: number;
    proveedorId: number;
  }
  const sentToCompras = useApiMutation<void, DtoToSendCompras>(
    "post",
    `compra-requisicion/generar-compra`,
    undefined,
    {
      onSuccess: () => {
        reFetchRequisiciones();
      },
    }
  );

  const handleDeleteRequisicion = async () => {
    if (!selectedRequisicion?.id) {
      toast.warning("Seleccione una requisición válida primero");
      return;
    }

    await toast.promise(deleteRequisicion.mutateAsync(), {
      success: "Requisición eliminada correctamente",
      error: (err) => getApiErrorMessageAxios(err),
      loading: "Eliminando requisición...",
    });

    await reFetchRequisiciones();
    setOpenConfirmDel(false);
    setSelectedRequisicion(null);
    setCurrentPage(1);
    setIsDialogOpen(false);
  };

  const handleSentToCompras = async () => {
    const dto: DtoToSendCompras = {
      requisicionID: selectedRequisicion?.id,
      userID: userId,
      proveedorId: parseInt(proveedorSelected || "0", 10),
    };

    if (!dto.proveedorId || !dto.requisicionID || !dto.userID) {
      toast.warning("Faltan datos para el envío");
      return;
    }

    await toast.promise(sentToCompras.mutateAsync(dto), {
      loading: "Enviando a módulo de compras...",
      success: "Registro en compras insertado",
      error: (err) => getApiErrorMessageAxios(err),
    });

    await reFetchRequisiciones();
    setIsDialogOpen(false);
    setOpenSendCompras(false);
    setSelectedRequisicion(null);
    setProveedorSelected("");
  };

  // ---------- Render: estados de carga/empty/error ----------
  if (isLoadingRequisiciones) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Cargando requisiciones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isErrorRequisiciones) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error al cargar requisiciones</CardTitle>
          <CardDescription className="text-destructive">
            {(errorRequisiciones as any)?.message ?? "Error desconocido"}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => reFetchRequisiciones()}>Reintentar</Button>
        </CardFooter>
      </Card>
    );
  }

  if (requisiciones.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay requisiciones</h3>
          <p className="text-muted-foreground text-center">
            No se encontraron requisiciones en el sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  console.log("los registros de requisiciones son: ", requisiciones);

  // ---------- Render principal ----------
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="grid grid-cols-2 ">
          <div className="">
            {" "}
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Requisiciones</span>
            </CardTitle>
            <CardDescription>
              Gestión de requisiciones. Total: {requisiciones.length}
            </CardDescription>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => reFetchRequisiciones()}>Refrescar</Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Folio</TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Fecha</span>
                    </div>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Package className="h-4 w-4" />
                      <span>Líneas</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Total</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentRequis.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{req.folio}</TableCell>
                    <TableCell>{formatearFecha(req.fecha)}</TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadgeVariant(req.estado)}>
                        {req.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{req.totalLineas}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatearMoneda(req.totalRequisicion)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerDetalles(req)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver detalles</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImprimir(req)}
                          className="h-8 w-8 p-0"
                        >
                          <Printer className="h-4 w-4" />
                          <span className="sr-only">Imprimir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage((p) => p - 1);
                      }}
                      className={
                        currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage((p) => p + 1);
                      }}
                      className={
                        currentPage >= totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2 text-sm text-muted-foreground">
                <p>
                  Mostrando {startIndex + 1} a{" "}
                  {Math.min(endIndex, requisiciones.length)} de{" "}
                  {requisiciones.length}
                </p>
                <p>
                  Página {currentPage} de {totalPages}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Detalles */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>
                Detalles de Requisición{" "}
                {selectedRequisicion?.folio
                  ? `- ${selectedRequisicion.folio}`
                  : ""}
              </span>
            </DialogTitle>
            <DialogDescription>
              Información completa de la requisición y sus líneas
            </DialogDescription>
          </DialogHeader>

          {selectedRequisicion ? (
            <ScrollArea className="max-h-[70vh]">
              {(() => {
                const f = getReqFlags(selectedRequisicion);
                return (
                  <div className="space-y-6">
                    {/* Header info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">
                            Información General
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <InfoRow label="Folio:">
                            {selectedRequisicion.folio}
                          </InfoRow>
                          <InfoRow label="Fecha:">
                            {formatearFecha(selectedRequisicion.fecha)}
                          </InfoRow>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Estado:
                            </span>
                            <Badge
                              variant={getEstadoBadgeVariant(
                                selectedRequisicion.estado
                              )}
                            >
                              {selectedRequisicion.estado}
                            </Badge>
                          </div>
                          <InfoRow label="Total Líneas:">
                            <Badge variant="outline">
                              {selectedRequisicion.totalLineas}
                            </Badge>
                          </InfoRow>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">
                            Detalles Adicionales
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <InfoRow label="Sucursal:">
                            {selectedRequisicion.sucursal.nombre}
                          </InfoRow>
                          <InfoRow label="Usuario:">
                            {selectedRequisicion.usuario.nombre}
                          </InfoRow>
                          <InfoRow label="Rol:">
                            {selectedRequisicion.usuario.rol}
                          </InfoRow>
                          <InfoRow label="Total:" bold>
                            {formatearMoneda(
                              selectedRequisicion.totalRequisicion
                            )}
                          </InfoRow>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="destructive"
                        disabled={!f.canSendToCompras}
                        onClick={() => setOpenSendCompras(true)}
                      >
                        {f.sendLabel}
                      </Button>

                      {f.canEdit ? (
                        <Link
                          to={`/requisicion-edit/${selectedRequisicion.id}`}
                        >
                          <Button variant="outline">Editar Registro</Button>
                        </Link>
                      ) : (
                        <Button
                          variant="outline"
                          disabled
                          title={
                            selectedRequisicion.ingresadaAStock
                              ? "Ya fue ingresada a stock"
                              : f.isClosed
                              ? "No editable en este estado"
                              : undefined
                          }
                        >
                          Editar Registro
                        </Button>
                      )}
                    </div>

                    {/* Observaciones */}
                    {selectedRequisicion.observaciones && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">
                            Observaciones
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {selectedRequisicion.observaciones}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    <Separator />

                    {/* Líneas */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Package className="h-5" />
                        <span>
                          Líneas de Productos (
                          {selectedRequisicion.lineas.length})
                        </span>
                      </h3>

                      <div className="space-y-3">
                        {selectedRequisicion.lineas.map(
                          (l: RequisitionLineDTO) => (
                            <Card
                              key={l.id}
                              className="border-l-4 border-l-primary/60"
                            >
                              <CardContent className="pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Col 1 - Identidad */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-sm">
                                        {l.producto.nombre}
                                      </h4>
                                      {l.esPresentacion ? (
                                        <Badge
                                          variant="default"
                                          className="text-[10px]"
                                        >
                                          <Layers3 className="h-3 w-3 mr-1" />
                                          Presentación
                                        </Badge>
                                      ) : null}
                                    </div>

                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Hash className="h-3 w-3" />
                                      Código: {l.producto.codigoProducto}
                                    </p>

                                    {l.esPresentacion && l.presentacion ? (
                                      <div className="text-xs text-muted-foreground space-y-1">
                                        <div className="flex items-center gap-1">
                                          <Package className="h-3 w-3" />
                                          <span>
                                            {l.presentacion.nombre} (x
                                            {l.presentacion.factorUnidadBase})
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Barcode className="h-3 w-3" />
                                          <span>
                                            SKU: {l.presentacion.sku ?? "—"}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Barcode className="h-3 w-3" />
                                          <span>
                                            CB:{" "}
                                            {l.presentacion.codigoBarras ?? "—"}
                                          </span>
                                        </div>
                                      </div>
                                    ) : null}

                                    <p className="text-xs text-muted-foreground">
                                      Línea ID: {l.id}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Fecha Expiración:{" "}
                                      {l.fechaExpiracion ? (
                                        <span className="font-semibold">
                                          {formatearFecha(l.fechaExpiracion)}
                                        </span>
                                      ) : (
                                        "No especificado"
                                      )}
                                    </p>
                                  </div>

                                  {/* Col 2 - Cantidades */}
                                  <div className="space-y-2">
                                    <InfoRow label="Stock Actual:">
                                      {l.cantidadActual}
                                    </InfoRow>
                                    <InfoRow label="Stock Mínimo:">
                                      {l.stockMinimo}
                                    </InfoRow>
                                    <InfoRow label="Cantidad Sugerida:">
                                      <span className="text-primary dark:text-white">
                                        {l.cantidadSugerida}
                                      </span>
                                    </InfoRow>
                                  </div>

                                  {/* Col 3 - Precios */}
                                  <div className="space-y-2">
                                    <InfoRow label="Precio Unitario:">
                                      {formatearMoneda(l.precioUnitario)}
                                    </InfoRow>
                                    <InfoRow label="Subtotal:" bold>
                                      {formatearMoneda(l.subtotal)}
                                    </InfoRow>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    </div>

                    {/* Auditoría */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                          Información de Auditoría
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoRow label="Creado:">
                          {formatearFecha(selectedRequisicion.createdAt)}
                        </InfoRow>
                        <InfoRow label="Actualizado:">
                          {formatearFecha(selectedRequisicion.updatedAt)}
                        </InfoRow>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => setOpenConfirmDel(true)}
                        >
                          Eliminar registro
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                );
              })()}
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Confirmación eliminar */}
      <Dialog open={openConfirmDel} onOpenChange={setOpenConfirmDel}>
        <DialogContent className="sm:max-w-[430px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-rose-500" />
              Eliminación de requisición
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará el registro de forma permanente.
            </DialogDescription>
          </DialogHeader>
          <CardFooter className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpenConfirmDel(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteRequisicion.isPending}
              onClick={handleDeleteRequisicion}
            >
              Sí, eliminar
            </Button>
          </CardFooter>
        </DialogContent>
      </Dialog>

      {/* Enviar a compras */}

      <AdvancedDialog
        type="confirmation"
        title="Enviar a módulo de compras"
        description="Este pedido será transferido al módulo de Compras y ya no podrá editarse ni eliminarse."
        open={openSendCompras}
        onOpenChange={setOpenSendCompras}
        confirmButton={{
          label: "Si, continuar a Compras",
          disabled: sentToCompras.isPending,
          loading: sentToCompras.isPending,
          loadingText: "Enviando a compras...",
          onClick: () => handleSentToCompras(),
        }}
        cancelButton={{
          label: "Cancelar",
          disabled: sentToCompras.isPending,
          loadingText: "Cancelando...",
        }}
        children={
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Seleccione el proveedor
            </p>
            <ReactSelect<Option, false>
              options={proveedorOptions}
              value={
                proveedorOptions.find((o) => o.value === proveedorSelected) ??
                null
              }
              onChange={(opt) => setProveedorSelected(opt?.value ?? "")}
            />
          </div>
        }
      />
    </div>
  );
}
