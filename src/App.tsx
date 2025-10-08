import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { Toaster } from "sonner";
// import Reportes from "./Pages/Reports/Reportes";
import EntregasStock from "./Pages/EntregasStock";
import Vencimientos from "./Pages/Vencimientos";
import HistorialVentas from "./Pages/HistorialVentas/HistorialVentas";
import Invoice from "./components/PDF/Invoice";
import Login from "./Pages/Auth/Login";
import RegisterView from "./Pages/Auth/Register";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import NotFoundPage from "./Pages/NotFount/NotFoundPage";
import AgregarProveedor from "./Pages/Provider/AgregarProveedor";
import CreateSucursal from "./Pages/Sucursal/CreateSucursal";
import ProductEditForm from "./Pages/Edit/EditProduct";
import Sucursales from "./Pages/Sucursal/Sucursales";
import TransferenciaProductos from "./Pages/Transferencia/TransferenciaProductos";
import TransferenciaProductosHistorial from "./Pages/Transferencia/TransferenciaHistorial";
import HistorialCambiosPrecio from "./Pages/HistorialPrecios/HistorialCambiosPrecio";
import StockEdicion from "./Pages/StockEdicion/StockEdicion";
import StockEliminaciones from "./Pages/Eliminaciones/StockEliminaciones";
import GarantiaPage from "./components/PDF/GarantiaPage";
import CreateCustomer from "./Pages/Customers/CreateCustomer";
import Layout2 from "./components/Layout/Layout";
import TicketPage from "./components/PDF/TicketPage";
import TicketManage from "./Pages/TicketManage/TicketManage";
import ReceiveWarrantyPage from "./Pages/Warranty/ReceiveWarrantyPage";
import WarrantyPage from "./components/PDF/PDF-Warranty/WarrantyPage";
import WarrantyFinalPage from "./components/PDF/WarrantyFinal/WarrantyFinalPDFPage";
import RegistroDeposito from "./Pages/CashRegister/RegistroDeposito";
import UserConfig from "./Pages/Config/UserConfig";
import SalesDeleted from "./Pages/SalesDeleted/SalesDeleted";
import ClientHistorialPurchase from "./Pages/Client/ClientHistorialPurchase";
import CreatePlaceholder from "./Pages/VentaCuotas/CreatePlaceholder";
import ContratoCredito from "./Pages/VentaCuotas/ContratoCredito";
import EditPlaceHolder from "./Pages/VentaCuotas/EditPlaceHolder";
import CuotasPage from "./components/PDF/Cuotas/CuotasPage";
// import { ProtectRSuperAdmin } from "./components/Auth/ProtectedRSuperAdmin";
import { ProtectRouteAdmin } from "./components/Auth/ProtectRouteAdmin";
import DashboardEmpleado from "./Pages/Dashboard/DashboardEmpleado";
import RepairOrderForm from "./Pages/Reparaciones/RepairOrder";
import ReparacionPage1 from "./components/PDF/ReparacionesPDF/ReparacionPage1";
import ReparacionPdfPageFinal from "./components/PDF/ReparacionesPDF/ReparacionPdfPageFinal";
import SucursalesSumary from "./Pages/Sumary/SucursalesSumary";
// import VentasReport from "./Pages/Reports/Ventas/VentasReport";
import Metas from "./Pages/Metas/Metas";
import MyGoals from "./Pages/Metas/MyGoals";
import ReportesExcel from "./Pages/Reports/Ventas/ReportesExcel";

import { useAuthStore } from "./components/Auth/AuthState";
import { useEffect } from "react";

import { useAuthStoreCRM } from "./Crm/CrmAuthRoutes/AuthStateCRM";
import CrmRegist from "./Crm/CrmAuth/CrmRegist";
import CrmLogin from "./Crm/CrmAuth/CrmLogin";
import { SummarySales } from "./Pages/SummarySales/SummarySales";
import RequisitionBuilder from "./Pages/Requisicion/Requisicion";
import RequisicionPDF from "./Pages/Requisicion/PDF/Pdf";
import { RequisitionEditor } from "./Pages/Requisicion/RequisitionEditor";
import PuntoVenta from "./Pages/POS/PuntoVenta";
import MovimientosStock from "./Pages/HistorialCambiosStock/HistorialCambiosStock";
import InventarioStockPage from "./Pages/InventarioYStock/InventarioStockPage";
import DashboardPageMain from "./Pages/NewDashboard/dashboard/page";
import Caja from "./Pages/Caja/Caja";
import CajaRegistros from "./Pages/CajaRegistros/CajaRegistros";
import CajaDetalle from "./Pages/CajaDetalle/caja-detalle";
import MovimientoCajaDetalle from "./Pages/movimientoCajaDetalle/movimientoCajaDetalle";
import { ComprasMainPage } from "./Pages/Compras/ComprasMainPage";
import CompraDetalle from "./Pages/Compras/compra-detalle";
import ResumenDiarioPage from "./Pages/resumenes-admin/page";
import HistoricoSucursal from "./Pages/resumenes-admin/_historico_sucursal/page";
import PedidosMainPage from "./Pages/Pedidos/_components/RegistPedido";
import EditPedido from "./Pages/Pedidos/_componentsEdit/EditPedido";
import PedidoDetails from "./Pages/Pedidos/_componentsPedidoDetails/PedidoDetails";
import FlujoCajaHistoricoMain from "./Pages/CajaAdministrativo/flujo-caja-historico";
import CostosVentaHistoricoPage from "./Pages/CajaAdministrativo/_costo-ventas-historicos/CostosVentaHistoricoPage";
import GastoOperativoHistoricoPage from "./Pages/CajaAdministrativo/_gastos-operativos-historicos/GastoOperativoHistoricoPage";
import FlujoEfectivoPage from "./Pages/CajaAdministrativo/_flujoEfectivo/FlujoEfectivoPage";
import CuentasBancariasPage from "./Pages/cuentas-bancarias/CuentasBancariasPage";
import CreateProductPage from "./Pages/producto/createProductoMain";
import CreateVentaCuotaForm from "./Pages/VentaCuotas/_components/CreateVentaCuotaForm";
import CategoriasMainPage from "./Pages/Categorias/CategoriasMainPage";

function App() {
  const { checkAuth } = useAuthStore();
  const { checkAuthCRM } = useAuthStoreCRM();

  useEffect(() => {
    checkAuth(); // Carga el estado de autenticación al iniciar
    checkAuthCRM();
  }, []);

  return (
    <>
      <Router>
        {/* Notificaciones */}
        <Toaster
          richColors
          expand={true}
          closeButton={true}
          position="top-right"
          duration={3000}
        />

        <Routes>
          {/* Redirecciona a dashboard */}
          <Route
            path="/"
            element={
              <ProtectRouteAdmin>
                <Navigate to="/dashboard" />
              </ProtectRouteAdmin>
            }
          />

          {/* <Route path="/" element={<RedirectToDashboard />} /> */}

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/crm/regist" element={<CrmRegist />} />
          <Route path="/crm/login" element={<CrmLogin />} />

          <Route path="*" element={<NotFoundPage />} />

          {/* Rutas protegidas con Layout */}
          <Route element={<Layout2 />}>
            <Route
              path="/dashboard"
              element={
                <ProtectRouteAdmin>
                  <DashboardPageMain />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/dashboard-empleado"
              element={
                <ProtectedRoute>
                  <DashboardEmpleado />
                </ProtectedRoute>
              }
            />

            <Route
              path="/punto-venta"
              element={
                <ProtectedRoute>
                  <PuntoVenta />
                </ProtectedRoute>
              }
            />

            <Route
              path="/venta/generar-factura/:id"
              element={
                <ProtectedRoute>
                  <Invoice />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-sucursal"
              element={
                <ProtectedRoute>
                  <CreateSucursal />
                </ProtectedRoute>
              }
            />

            <Route
              path="/agregar-proveedor"
              element={
                <ProtectRouteAdmin>
                  <AgregarProveedor />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/inventario-stock"
              element={
                <ProtectedRoute>
                  <InventarioStockPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/categorias"
              element={
                <ProtectRouteAdmin>
                  <CategoriasMainPage />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/reportes"
              element={
                <ProtectRouteAdmin>
                  <ReportesExcel />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/entregas-stock"
              element={
                <ProtectRouteAdmin>
                  <EntregasStock />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/vencimientos"
              element={
                <ProtectedRoute>
                  <Vencimientos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/historial/ventas"
              element={
                <ProtectedRoute>
                  <HistorialVentas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/editar-producto/:id"
              element={
                <ProtectRouteAdmin>
                  <ProductEditForm />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/crear-producto"
              element={
                <ProtectRouteAdmin>
                  <CreateProductPage />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/sucursal"
              element={
                <ProtectRouteAdmin>
                  <Sucursales />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/transferencia"
              element={
                <ProtectRouteAdmin>
                  <TransferenciaProductos />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/transferencia-historial"
              element={
                <ProtectRouteAdmin>
                  <TransferenciaProductosHistorial />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/historial-cambios-precio"
              element={
                <ProtectedRoute>
                  <HistorialCambiosPrecio />
                </ProtectedRoute>
              }
            />

            <Route
              path="/stock-edicion/:id"
              element={
                <ProtectRouteAdmin>
                  <StockEdicion />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/stock-eliminaciones"
              element={
                <ProtectedRoute>
                  <StockEliminaciones />
                </ProtectedRoute>
              }
            />

            <Route
              path="/garantía/generar-garantía/:id"
              element={
                <ProtectedRoute>
                  <GarantiaPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/clientes-manage"
              element={
                <ProtectedRoute>
                  <CreateCustomer />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ticket/generar-ticket/:id"
              element={
                <ProtectedRoute>
                  <TicketPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ticket/manage"
              element={
                <ProtectRouteAdmin>
                  <TicketManage />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/garantia/manage"
              element={
                <ProtectedRoute>
                  <ReceiveWarrantyPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ticket-garantia/:id"
              element={
                <ProtectedRoute>
                  <WarrantyPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/garantia/comprobante-uso/:id"
              element={
                <ProtectedRoute>
                  <WarrantyFinalPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/depositos-egresos/"
              element={
                <ProtectedRoute>
                  <RegistroDeposito />
                </ProtectedRoute>
              }
            />

            <Route
              path="/registro-caja"
              element={
                <ProtectedRoute>
                  <Caja />
                </ProtectedRoute>
              }
            />

            <Route
              path="/registros-cajas"
              element={
                <ProtectRouteAdmin>
                  <CajaRegistros />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/caja/:id"
              element={
                <ProtectRouteAdmin>
                  <CajaDetalle />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/movimiento-caja/:id"
              element={
                <ProtectRouteAdmin>
                  <MovimientoCajaDetalle />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/admin/caja/diario"
              element={
                <ProtectRouteAdmin>
                  <ResumenDiarioPage />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/admin/historicos"
              element={
                <ProtectRouteAdmin>
                  <HistoricoSucursal />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/cuentas-bancarias"
              element={
                <ProtectRouteAdmin>
                  <CuentasBancariasPage />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/caja-administrativo/efectivo-banco"
              element={
                <ProtectRouteAdmin>
                  <FlujoCajaHistoricoMain />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/caja-administrativo/costos-ventas-historicos"
              element={
                <ProtectRouteAdmin>
                  <CostosVentaHistoricoPage />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/caja-administrativo/gastos-operativos-historicos"
              element={
                <ProtectRouteAdmin>
                  <GastoOperativoHistoricoPage />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/caja-administrativo/flujo-efectivo"
              element={
                <ProtectRouteAdmin>
                  <FlujoEfectivoPage />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/config/user"
              element={
                <ProtectRouteAdmin>
                  <UserConfig />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/historial/ventas-eliminaciones"
              element={
                <ProtectedRoute>
                  <SalesDeleted />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cliente-historial-compras/:id"
              element={
                <ProtectedRoute>
                  <ClientHistorialPurchase />
                </ProtectedRoute>
              }
            />

            <Route
              path="/plantillas-venta-cuotas"
              element={
                <ProtectRouteAdmin>
                  <CreatePlaceholder />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/creditos"
              element={
                <ProtectedRoute>
                  <CreateVentaCuotaForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/imprimir/contrato/:recordId/:plantillaId"
              element={
                <ProtectedRoute>
                  <ContratoCredito />
                </ProtectedRoute>
              }
            />

            <Route
              path="/edit/plantilla/:id"
              element={
                <ProtectRouteAdmin>
                  <EditPlaceHolder />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/cuota/comprobante/:id"
              element={
                <ProtectedRoute>
                  <CuotasPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reparaciones"
              element={
                <ProtectedRoute>
                  <RepairOrderForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reparacion-comprobante/:id"
              element={
                <ProtectedRoute>
                  <ReparacionPage1 />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reparacion-comprobante-final/:id"
              element={
                <ProtectedRoute>
                  <ReparacionPdfPageFinal />
                </ProtectedRoute>
              }
            />

            <Route
              path="/sumary"
              element={
                <ProtectRouteAdmin>
                  <SucursalesSumary />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/metas"
              element={
                <ProtectRouteAdmin>
                  <Metas />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/mis-metas"
              element={
                <ProtectRouteAdmin>
                  <MyGoals />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/resumen-ventas"
              element={
                <ProtectRouteAdmin>
                  <SummarySales />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/requisiciones"
              element={
                <ProtectRouteAdmin>
                  <RequisitionBuilder />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/requisicion-edit/:requisicionID"
              element={
                <ProtectRouteAdmin>
                  <RequisitionEditor />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/compras"
              element={
                <ProtectRouteAdmin>
                  <ComprasMainPage />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/compra/:id"
              element={
                <ProtectRouteAdmin>
                  <CompraDetalle />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/pedidos"
              element={
                <ProtectRouteAdmin>
                  <PedidosMainPage />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/pedido-edit/:id"
              element={
                <ProtectRouteAdmin>
                  <EditPedido />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/pedido-detalles/:id"
              element={
                <ProtectRouteAdmin>
                  <PedidoDetails />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/pdf-requisicion/:id"
              element={
                <ProtectRouteAdmin>
                  <RequisicionPDF />
                </ProtectRouteAdmin>
              }
            />

            <Route
              path="/movimientos-stock"
              element={
                <ProtectRouteAdmin>
                  <MovimientosStock />
                </ProtectRouteAdmin>
              }
            />

            {/* RUTAS PARA EL CRM */}
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
