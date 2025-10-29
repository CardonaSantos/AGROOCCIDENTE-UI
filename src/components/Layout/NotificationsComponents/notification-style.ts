import {
  NotiCategory,
  NotiSeverity,
  UiNotificacionDTO,
} from "@/Web/realtime/notifications/notifications.type";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  OctagonAlert,
  ShieldAlert,
  Package,
  CreditCard,
  Receipt,
  ShieldCheck,
  Wrench,
  ShoppingCart,
  Truck,
  Settings,
  FileText,
  Coins,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CategoryMeta = {
  label: string;
  Icon: LucideIcon;
  badgeClass: string;
};

const CATEGORY_MAP: Record<NotiCategory, CategoryMeta> = {
  VENTAS: {
    label: "Ventas",
    Icon: Coins,
    badgeClass:
      "bg-emerald-200/70 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-200",
  },
  INVENTARIO: {
    label: "Inventario",
    Icon: Package,
    badgeClass:
      "bg-amber-200/70 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200",
  },
  CREDITO: {
    label: "Crédito",
    Icon: CreditCard,
    badgeClass:
      "bg-indigo-200/70 text-indigo-900 dark:bg-indigo-400/20 dark:text-indigo-200",
  },
  CUENTAS_POR_PAGAR: {
    label: "CxP",
    Icon: Receipt,
    badgeClass:
      "bg-orange-200/70 text-orange-900 dark:bg-orange-400/20 dark:text-orange-200",
  },
  GARANTIA: {
    label: "Garantía",
    Icon: ShieldCheck,
    badgeClass:
      "bg-teal-200/70 text-teal-900 dark:bg-teal-400/20 dark:text-teal-200",
  },
  REPARACIONES: {
    label: "Reparaciones",
    Icon: Wrench,
    badgeClass:
      "bg-yellow-200/70 text-yellow-900 dark:bg-yellow-400/20 dark:text-yellow-200",
  },
  COMPRAS: {
    label: "Compras",
    Icon: ShoppingCart,
    badgeClass:
      "bg-sky-200/70 text-sky-900 dark:bg-sky-400/20 dark:text-sky-200",
  },
  LOGISTICA: {
    label: "Logística",
    Icon: Truck,
    badgeClass:
      "bg-cyan-200/70 text-cyan-900 dark:bg-cyan-400/20 dark:text-cyan-200",
  },
  SISTEMA: {
    label: "Sistema",
    Icon: Settings,
    badgeClass:
      "bg-slate-200/70 text-slate-900 dark:bg-slate-500/20 dark:text-slate-200",
  },
  SEGURIDAD: {
    label: "Seguridad",
    Icon: ShieldAlert,
    badgeClass:
      "bg-rose-200/70 text-rose-900 dark:bg-rose-400/20 dark:text-rose-200",
  },
  FACTURACION: {
    label: "Facturación",
    Icon: FileText,
    badgeClass:
      "bg-fuchsia-200/70 text-fuchsia-900 dark:bg-fuchsia-400/20 dark:text-fuchsia-200",
  },
  OTROS: {
    label: "Otros",
    Icon: Info,
    badgeClass:
      "bg-gray-200/70 text-gray-900 dark:bg-gray-500/20 dark:text-gray-200",
  },
};

export function getCategoryMeta(cat: NotiCategory) {
  return CATEGORY_MAP[cat] ?? CATEGORY_MAP.OTROS;
}

export function getSeverityStyles(sev: NotiSeverity) {
  // todo precompilable por Tailwind: sin `before:${}` ni ring arbitrario
  switch (sev) {
    case NotiSeverity.EXITO:
      return {
        cardBg:
          "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20",
        ring: "ring-emerald-400/60",
        accent: "bg-emerald-500",
        title: "text-emerald-950 dark:text-emerald-100",
        body: "text-emerald-800 dark:text-emerald-200",
        Icon: CheckCircle2,
      };
    case NotiSeverity.ALERTA:
      return {
        cardBg:
          "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20",
        ring: "ring-amber-400/60",
        accent: "bg-amber-500",
        title: "text-amber-950 dark:text-amber-100",
        body: "text-amber-800 dark:text-amber-200",
        Icon: AlertTriangle,
      };
    case NotiSeverity.ERROR:
      return {
        cardBg:
          "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20",
        ring: "ring-rose-400/60",
        accent: "bg-rose-600",
        title: "text-rose-950 dark:text-rose-100",
        body: "text-rose-800 dark:text-rose-200",
        Icon: OctagonAlert,
      };
    case NotiSeverity.CRITICO:
      return {
        cardBg:
          "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/20",
        ring: "ring-red-500/70",
        accent: "bg-red-600",
        title: "text-red-950 dark:text-red-100",
        body: "text-red-800 dark:text-red-200",
        Icon: ShieldAlert,
      };
    case NotiSeverity.INFORMACION:
    default:
      return {
        cardBg:
          "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20",
        ring: "ring-blue-400/60",
        accent: "bg-blue-500",
        title: "text-blue-950 dark:text-blue-100",
        body: "text-blue-800 dark:text-blue-200",
        Icon: Info,
      };
  }
}

export function getActionFor(n: UiNotificacionDTO) {
  const label = n.actionLabel ?? null;
  const to =
    n.route ??
    (n.subtipo === "PRICE_REQUEST_CREATED"
      ? `/solicitudes-precio/${n.meta?.solicitudId ?? ""}`
      : n.subtipo === "PRICE_REQUEST_REJECTED"
      ? "/solicitudes-precio"
      : "#");
  return { label, to };
}

export const formatGTQ = (v?: number | null) =>
  typeof v === "number"
    ? new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "GTQ",
      }).format(v)
    : null;

export function extractMeta(n: UiNotificacionDTO) {
  return {
    producto: n.meta?.producto?.nombre as string | undefined,
    sucursal: n.meta?.sucursal?.nombre as string | undefined,
    solicitante: n.meta?.solicitante?.nombre as string | undefined,
    precio: formatGTQ(n.meta?.precioSolicitado as number | undefined),
  };
}
