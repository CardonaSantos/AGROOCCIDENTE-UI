import {
  Home,
  ShieldCheck,
  // Ticket,
  Wallet,

  // FileText,
  CreditCard,
  ChevronDown,
  // FileSpreadsheet,
  Target,
  Goal,
  // PackageSearch,
  NotebookPen,
  ListOrdered,
  // Trash2,
  Boxes,
  Truck,
  ArrowLeftRight,
  Send,
  UserCheck,
  Factory,
  Building2,
  Shield,
  BarChart3,
  Calendar,
  Wrench,
  Settings,
  ChartPie,
  ReceiptText,
  ClipboardList,
  Banknote,
  ChartArea,
  ChartScatter,
  SquareChartGantt,
  HandCoins,
  Landmark,
  PiggyBank,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  ShoppingCart,
  Package,
  Users,
  AlertCircle,
  Clock,
  Building,
  History,
} from "lucide-react";
import { useStore } from "../Context/ContextSucursal";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { useMemo } from "react";

const menuVendedor = [
  { icon: Home, label: "Inicio", href: "/" },
  { icon: ShoppingCart, label: "Punto de Venta", href: "/punto-venta" },
  { icon: Clock, label: "Historial de Ventas", href: "/historial/ventas" },

  {
    icon: Package,
    label: "Inventario y Stock",
    submenu: [
      { icon: Boxes, label: "Inventario General", href: "/inventario-stock" },
    ],
  },
  { icon: Users, label: "Clientes", href: "/clientes-manage" },
  { icon: CreditCard, label: "Créditos", href: "/creditos" },

  { icon: Wallet, label: "Caja", href: "/registro-caja" },
];

const menuItemsAdmin = [
  // === Inicio ===
  { icon: Home, label: "Inicio", href: "/" },

  // === Ventas ===
  { icon: ShoppingCart, label: "Punto de Venta", href: "/punto-venta" },
  { icon: Clock, label: "Historial de Ventas", href: "/historial/ventas" },
  // {
  //   icon: ClipboardPen,
  //   label: "Gestión de Ventas",
  //   submenu: [
  //     {
  //       icon: Trash2,
  //       label: "Ventas Eliminadas",
  //       href: "/historial/ventas-eliminaciones",
  //     },
  //     {
  //       icon: FileText,
  //       label: "Plantillas de Créditos",
  //       href: "/plantillas-venta-cuotas",
  //     },
  //   ],
  // },

  // === Créditos ===
  { icon: CreditCard, label: "Créditos", href: "/creditos" },

  // === Inventario y Stock ===
  {
    icon: Package,
    label: "Inventario y Stock",
    submenu: [
      { icon: Boxes, label: "Inventario General", href: "/inventario-stock" },

      { icon: Boxes, label: "Crear Producto", href: "/crear-producto" },

      // {
      //   icon: NotepadText,
      //   label: "Historial de Precios",
      //   href: "/historial-cambios-precio",
      // },
      // {
      //   icon: FileStack,
      //   label: "Stock Eliminado",
      //   href: "/stock-eliminaciones",
      // },
      {
        icon: Truck,
        label: "Entregas de Stock",
        href: "/entregas-stock",
      },
    ],
  },

  // === Transferencias ===
  {
    icon: ArrowLeftRight,
    label: "Transferencias",
    submenu: [
      {
        icon: Send,
        label: "Transferir Productos",
        href: "/transferencia",
      },
      {
        icon: History,
        label: "Historial de Transferencias",
        href: "/transferencia-historial",
      },
    ],
  },

  // === Clientes y Proveedores ===
  {
    icon: Users,
    label: "Clientes y Proveedores",
    submenu: [
      { icon: UserCheck, label: "Clientes", href: "/clientes-manage" },
      { icon: Factory, label: "Proveedores", href: "/agregar-proveedor" },
    ],
  },

  // === Sucursales ===
  {
    icon: Building,
    label: "Sucursales",
    submenu: [{ icon: Building2, label: "Mis Sucursales", href: "/sucursal" }],
  },

  // === Garantías y Tickets ===
  {
    icon: ShieldCheck,
    label: "Garantías",
    submenu: [
      { icon: Shield, label: "Gestión Garantías", href: "/garantia/manage" },
      // { icon: Ticket, label: "Gestión Tickets", href: "/ticket/manage" },
    ],
  },

  // === Caja ===
  {
    icon: Wallet,
    label: "Caja",
    submenu: [
      { icon: NotebookPen, label: "Registrar Caja", href: "/registro-caja" },
      {
        icon: ListOrdered,
        label: "Registros de Cajas",
        href: "/registros-cajas",
      },
    ],
  },

  // === Administración ===
  {
    icon: BarChart3,
    label: "Resumen Admin",
    submenu: [
      { icon: ChartPie, label: "Resumen Diario", href: "/admin/caja/diario" },
      { icon: Calendar, label: "Históricos", href: "/admin/historicos" },
    ],
  },

  {
    icon: ChartArea,
    label: "Caja Administrativo",
    submenu: [
      {
        icon: Banknote,
        label: "Flujo de Caja Histórico",
        href: "/caja-administrativo/efectivo-banco",
      },

      {
        icon: ChartScatter,
        label: "Costo Ventas Historicos",
        href: "/caja-administrativo/costos-ventas-historicos",
      },

      {
        icon: SquareChartGantt,
        label: "Gastos Operativos Historicos",
        href: "/caja-administrativo/gastos-operativos-historicos",
      },

      {
        icon: HandCoins,
        label: "Flujo Efectivo",
        href: "/caja-administrativo/flujo-efectivo",
      },
    ],
  },

  {
    icon: PiggyBank,
    label: "Cuentas Bancarias",
    submenu: [
      {
        icon: Landmark,
        label: "Cuentas Bancarias",
        href: "/cuentas-bancarias",
      },
    ],
  },

  // === Compras ===
  {
    icon: ShoppingCart,
    label: "Compras",
    submenu: [
      { icon: ClipboardList, label: "Requisiciones", href: "/requisiciones" },
      { icon: ReceiptText, label: "Ver Compras", href: "/compras" },
      { icon: Package, label: "Pedidos", href: "/pedidos" },
    ],
  },

  // === Operaciones ===
  { icon: AlertCircle, label: "Vencimientos", href: "/vencimientos" },
  { icon: Wrench, label: "Reparaciones", href: "/reparaciones" },

  // === Metas ===
  { icon: Target, label: "Metas", href: "/metas" },
  { icon: Goal, label: "Mis Metas", href: "/mis-metas" },

  // === Reportes ===
  // { icon: FileSpreadsheet, label: "Reportes", href: "/reportes" },

  // === Configuración ===
  { icon: Settings, label: "Configuración", href: "/config/user" },
];

export function AppSidebar() {
  const rolUser = useStore((state) => state.userRol);

  const allRoutes = useMemo(() => {
    if (rolUser === "ADMIN" || rolUser === "SUPER_ADMIN") return menuItemsAdmin;
    return menuVendedor;
  }, [rolUser]);

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarContent>
        <div className="overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupLabel>Secciones</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {allRoutes.map((item) => {
                  // Si el item tiene submenú, lo mostramos como un SidebarMenuSub dentro de un Collapsible
                  if (item.submenu) {
                    return (
                      <SidebarMenuItem key={item.label}>
                        <Collapsible defaultOpen className="group/collapsible">
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span>{item.label}</span>
                              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.submenu.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.label}>
                                  <SidebarMenuSubButton className="py-5">
                                    <Link
                                      to={subItem.href}
                                      className="flex items-center gap-2"
                                    >
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <subItem.icon className="h-4 w-4 shrink-0" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{subItem.label}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <span>{subItem.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    );
                  } else {
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton asChild>
                          <Link
                            to={item.href}
                            className="flex items-center gap-2"
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <item.icon className="h-4 w-4 shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{item.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
