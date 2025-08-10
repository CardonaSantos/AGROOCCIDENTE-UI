"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Building2,
  User,
  Calendar,
  FileText,
  CreditCard,
  Banknote,
  TrendingUp,
  Receipt,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Interfaces
export type TipoMovimiento =
  | "INGRESO"
  | "EGRESO"
  | "VENTA"
  | "ABONO"
  | "RETIRO"
  | "DEPOSITO_BANCO"
  | "CHEQUE"
  | "TRANSFERENCIA"
  | "AJUSTE"
  | "DEVOLUCION"
  | "OTRO";

export type CategoriaMovimiento =
  | "COSTO_VENTA"
  | "DEPOSITO_CIERRE"
  | "DEPOSITO_PROVEEDOR"
  | "GASTO_OPERATIVO";

export interface MovimientoCajaItem {
  id: number;
  fecha: string; // ISO
  tipo: TipoMovimiento;
  categoria: CategoriaMovimiento;
  monto: number;
  descripcion: string | null;
  referencia: string | null;
  banco: string | null;
  numeroBoleta: string | null;
  usadoParaCierre: boolean;
  proveedor: { id: number; nombre: string } | null;
  usuario: { id: number; nombre: string };
}

interface MovimientosCajaProps {
  movimientos: MovimientoCajaItem[];
}

interface PropsCardRegistroMovimiento {
  movimiento: MovimientoCajaItem;
}

// Utilidades
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-GT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "Fecha inválida";
  }
};

// Configuración de iconos y colores por tipo
const getTipoConfig = (tipo: TipoMovimiento) => {
  const configs = {
    INGRESO: {
      icon: ArrowUpRight,
      color: "text-green-600",
      bg: "bg-green-50",
      variant: "default" as const,
    },
    EGRESO: {
      icon: ArrowDownRight,
      color: "text-red-600",
      bg: "bg-red-50",
      variant: "destructive" as const,
    },
    VENTA: {
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
      variant: "default" as const,
    },
    ABONO: {
      icon: Banknote,
      color: "text-green-600",
      bg: "bg-green-50",
      variant: "default" as const,
    },
    RETIRO: {
      icon: ArrowDownRight,
      color: "text-orange-600",
      bg: "bg-orange-50",
      variant: "secondary" as const,
    },
    DEPOSITO_BANCO: {
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      variant: "default" as const,
    },
    CHEQUE: {
      icon: Receipt,
      color: "text-purple-600",
      bg: "bg-purple-50",
      variant: "secondary" as const,
    },
    TRANSFERENCIA: {
      icon: CreditCard,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      variant: "secondary" as const,
    },
    AJUSTE: {
      icon: AlertCircle,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      variant: "outline" as const,
    },
    DEVOLUCION: {
      icon: ArrowUpRight,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      variant: "secondary" as const,
    },
    OTRO: {
      icon: FileText,
      color: "text-gray-600",
      bg: "bg-gray-50",
      variant: "outline" as const,
    },
  };
  return configs[tipo] || configs.OTRO;
};

const getCategoriaLabel = (categoria: CategoriaMovimiento) => {
  const labels = {
    COSTO_VENTA: "Costo de Venta",
    DEPOSITO_CIERRE: "Depósito de Cierre",
    DEPOSITO_PROVEEDOR: "Depósito Proveedor",
    GASTO_OPERATIVO: "Gasto Operativo",
  };
  return labels[categoria] || categoria;
};

function RegistrosCaja({ movimientos = [] }: MovimientosCajaProps) {
  console.log("Los movimientos de esta caja son: ", movimientos);

  if (!movimientos || movimientos.length === 0) {
    return (
      <div className="h-full">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay movimientos</h3>
            <p className="text-muted-foreground text-center">
              Aún no se han registrado movimientos en esta caja.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <span className="font-medium">Movimientos de Caja</span>
          <Badge variant="secondary">{movimientos.length}</Badge>
        </div>
      </div>

      <ScrollArea className="max-h-[70vh] pr-2 overflow-y-auto">
        <div className="space-y-3">
          {movimientos.map((movimiento) => (
            <CardMovimientoRegistro
              key={movimiento.id}
              movimiento={movimiento}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

const CardMovimientoRegistro = ({
  movimiento,
}: PropsCardRegistroMovimiento) => {
  const tipoConfig = getTipoConfig(movimiento.tipo);
  const IconComponent = tipoConfig.icon;
  const isEgreso = ["EGRESO", "RETIRO"].includes(movimiento.tipo);

  return (
    <Card className="border-muted hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${tipoConfig.bg}`}>
              <IconComponent className={`w-4 h-4 ${tipoConfig.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-base flex items-center gap-2 mb-1">
                <span className="truncate">
                  {getCategoriaLabel(movimiento.categoria)}
                </span>
                {movimiento.usadoParaCierre && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </CardTitle>

              <CardDescription className="text-xs line-clamp-2">
                {movimiento.descripcion || "Sin descripción disponible"}
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge variant={tipoConfig.variant} className="text-xs">
              {movimiento.tipo.replace("_", " ")}
            </Badge>
            <span className={`font-semibold text-sm ${tipoConfig.color}`}>
              {isEgreso ? "-" : "+"}
              {formatCurrency(movimiento.monto)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="detalle" className="border-none">
            <AccordionTrigger className="py-2 text-sm hover:no-underline">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Ver detalles completos
              </span>
            </AccordionTrigger>

            <AccordionContent className="pt-4">
              <div className="space-y-4">
                {/* Información básica */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">Fecha:</span>
                      <span className="text-muted-foreground">
                        {formatDate(movimiento.fecha)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">Usuario:</span>
                      <span className="text-muted-foreground">
                        {movimiento.usuario?.nombre || "N/A"}
                      </span>
                    </div>

                    {movimiento.proveedor && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">Proveedor:</span>
                        <span className="text-muted-foreground">
                          {movimiento.proveedor.nombre}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {movimiento.referencia && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">Referencia:</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {movimiento.referencia}
                        </span>
                      </div>
                    )}

                    {movimiento.banco && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">Banco:</span>
                        <span className="text-muted-foreground">
                          {movimiento.banco}
                        </span>
                      </div>
                    )}

                    {movimiento.numeroBoleta && (
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">No. Boleta:</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {movimiento.numeroBoleta}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Estados y flags */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    ID: {movimiento.id}
                  </Badge>

                  {movimiento.usadoParaCierre && (
                    <Badge
                      variant="default"
                      className="text-xs bg-green-100 text-green-800"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Usado para cierre
                    </Badge>
                  )}

                  <Badge variant="secondary" className="text-xs">
                    {getCategoriaLabel(movimiento.categoria)}
                  </Badge>
                </div>

                {/* Descripción completa si existe */}
                {movimiento.descripcion && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium text-sm mb-2">Descripción:</p>
                      <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-md">
                        {movimiento.descripcion}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default RegistrosCaja;
