import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingCart, History, Package, Users, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
export default function DashboardEmpleado() {
  const menuItems = [
    {
      title: "Punto de Venta",
      description: "Hacer y registrar ventas",
      icon: ShoppingCart,
      route: "/punto-venta",
    },
    {
      title: "Historial de Ventas",
      description: "Ver registro de ventas pasadas",
      icon: History,
      route: "/historial/ventas",
    },
    {
      title: "Inventario",
      description: "Gestionar productos en stock",
      icon: Package,
      route: "/inventario-stock",
    },

    {
      title: "Clientes",
      description: "Gestionar información de clientes",
      icon: Users,
      route: "/clientes-manage",
    },
    {
      title: "Vencimientos",
      description: "Ver productos próximos a vencer",
      icon: Calendar,
      route: "/vencimientos",
    },
  ];

  return (
    <div className="container mx-auto p-1">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            <h1 className="text-3xl font-bold">Dashboard </h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <Link to={item.route} key={index} className="no-underline">
                <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <item.icon className="w-12 h-12 mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <CardDescription className="text-center">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
