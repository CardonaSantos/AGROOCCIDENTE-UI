import type { JSX } from "react";
import { TipoMovimientoCaja, CategoriaMovimiento } from "../Interfaces/types";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  ShoppingCart,
  CreditCard,
  ArrowUpDown,
  RefreshCw,
  Undo2,
  HelpCircle,
} from "lucide-react";

// Si tus enums son string enums, usa el enum directamente:
export const getTipoStyles = (tipo: TipoMovimientoCaja | undefined) => {
  switch (tipo) {
    case TipoMovimientoCaja.INGRESO:
      return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
    case TipoMovimientoCaja.EGRESO:
      return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
    case TipoMovimientoCaja.DEPOSITO_BANCO:
      return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
    case TipoMovimientoCaja.VENTA:
      return "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400";
    case TipoMovimientoCaja.TRANSFERENCIA:
      return "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400";
    default:
      return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

export const getTipoIcon = (
  tipo: TipoMovimientoCaja | undefined
): JSX.Element => {
  switch (tipo) {
    case TipoMovimientoCaja.INGRESO:
      return <TrendingUp className="h-3 w-3" />;
    case TipoMovimientoCaja.EGRESO:
      return <TrendingDown className="h-3 w-3" />;
    case TipoMovimientoCaja.DEPOSITO_BANCO:
      return <Building2 className="h-3 w-3" />;
    case TipoMovimientoCaja.VENTA:
      return <ShoppingCart className="h-3 w-3" />;
    case TipoMovimientoCaja.TRANSFERENCIA:
      return <ArrowUpDown className="h-3 w-3" />;
    case TipoMovimientoCaja.CHEQUE:
      return <CreditCard className="h-3 w-3" />;
    case TipoMovimientoCaja.AJUSTE:
      return <RefreshCw className="h-3 w-3" />;
    case TipoMovimientoCaja.DEVOLUCION:
      return <Undo2 className="h-3 w-3" />;
    default:
      return <HelpCircle className="h-3 w-3" />;
  }
};

export const getCategoriaStyles = (
  categoria: CategoriaMovimiento | undefined
) => {
  switch (categoria) {
    case CategoriaMovimiento.DEPOSITO_CIERRE:
      return "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300";
    case CategoriaMovimiento.GASTO_OPERATIVO:
      return "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300";
    case CategoriaMovimiento.COSTO_VENTA:
      return "text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300";
    case CategoriaMovimiento.DEPOSITO_PROVEEDOR:
      return "text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300";
    case CategoriaMovimiento.INGRESO:
      return "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
  }
};
