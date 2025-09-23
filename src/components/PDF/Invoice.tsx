import { useEffect, useRef, useState } from "react";
import logo from "@/assets/AGROSIL.jpg";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useParams } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { User } from "lucide-react";

import type { VentaHistorialPDF } from "@/Types/PDF/VentaHistorialPDF";
import { formatearMoneda } from "@/Pages/Requisicion/PDF/Pdf";

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale("es");

const API_URL = import.meta.env.VITE_API_URL;

const formatDate = (fecha: string) =>
  dayjs(fecha).format("DD MMMM YYYY, hh:mm:ss A");

const Invoice = () => {
  const { id } = useParams();
  const [venta, setVenta] = useState<VentaHistorialPDF>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const facturaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getSale = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/venta/get-sale/${id}`);
        if (response.status === 200) {
          setVenta(response.data);
        }
      } catch (error) {
        console.error("Error al cargar la venta", error);
      } finally {
        setLoading(false);
      }
    };
    getSale();
  }, [id]);

  useEffect(() => {
    if (!venta || !facturaRef.current) return;

    const generarPDF = async () => {
      try {
        const canvas = await html2canvas(facturaRef.current!, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ unit: "mm", format: "a4" });
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        const blob = pdf.output("blob");
        setPdfUrl(URL.createObjectURL(blob));
      } catch (error) {
        console.error("Error al generar PDF:", error);
      }
    };

    const timer = setTimeout(generarPDF, 500);
    return () => clearTimeout(timer);
  }, [venta]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">
            Cargando comprobante...
          </p>
        </div>
      </div>
    );
  }

  if (!venta) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-600">
          Error: No se pudo cargar la información de la venta
        </p>
      </div>
    );
  }

  const total =
    venta.productos?.reduce(
      (acc, item) => acc + item.precioVenta * item.cantidad,
      0
    ) || 0;

  const nombreCliente =
    [venta.cliente?.nombre, venta.cliente?.apellidos]
      .map((s) => s?.trim())
      .filter(Boolean)
      .join(" ") ||
    venta.nombreClienteFinal ||
    "CF";

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Factura para PDF */}
      <div
        ref={facturaRef}
        className={`shadow-lg rounded-lg ${pdfUrl ? "hidden" : "block"}`}
        style={{
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          color: "#000000",
          padding: "40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Header con logo y título */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center space-x-4">
            <div className="">
              <img className="w-24 h-24" src={logo} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {venta.sucursal.nombre}
              </h1>
              <p className="text-xs text-gray-600">
                Herramientas y Materiales de Construcción
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="">
              <p className="text-xs font-medium text-[#1a3773]">#{venta.id}</p>
            </div>
          </div>
        </div>

        {/* Información de la empresa */}
        <div className="bg-gray-50 p-3 rounded-lg mb-6">
          <div className="grid grid-cols-2 text-xs">
            <div className="flex items-center space-x-2">
              <span>
                <strong>Dirección:</strong>{" "}
                {venta.sucursal?.direccion || "Dirección no disponible"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>
                <strong>Teléfono:</strong>{" "}
                {venta.sucursal?.telefono || "Tel no disponible"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>
                <strong>Fecha:</strong> {formatDate(venta.fechaVenta)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>
                <strong>Pago:</strong>{" "}
                {venta.metodoPago?.metodoPago || "No especificado"}
              </span>
            </div>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="p-3 mb-6">
          {venta.cliente ? (
            <>
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-[#ffd231]" />
                <h3 className="text-xs font-medium text-gray-800">
                  INFORMACIÓN DEL CLIENTE
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p>
                    <strong>Nombre:</strong> {nombreCliente}
                  </p>

                  <p>
                    <strong>Teléfono:</strong>{" "}
                    {venta.cliente?.telefono ||
                      venta.telefonoClienteFinal ||
                      "No proporcionado"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Dirección:</strong>{" "}
                    {venta.cliente?.direccion ||
                      venta.direccionClienteFinal ||
                      "No proporcionada"}
                  </p>
                  {venta.cliente?.dpi && (
                    <p>
                      <strong>DPI:</strong> {venta.cliente.dpi}
                    </p>
                  )}
                  {venta.imei && (
                    <p>
                      <strong>IMEI:</strong> {venta.imei}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div>
              <h3 className="text-xs font-medium text-gray-800">
                Detalles del cliente: Cliente Final
              </h3>
            </div>
          )}
        </div>

        {/* Tabla de productos */}
        <div className="mb-6">
          <div className="overflow-hidden rounded-sm border border-gray-200">
            <table
              className="w-full"
              style={{ fontSize: "10px", borderCollapse: "collapse" }}
            >
              <thead>
                <tr className="bg-[#84adff] text-white">
                  <th className="py-2 px-3 text-left font-medium">PRODUCTO</th>
                  <th className="py-2 px-3 text-center font-medium">CANT.</th>
                  <th className="py-2 px-3 text-right font-medium">
                    PRECIO UNIT.
                  </th>
                  <th className="py-2 px-3 text-right font-medium">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {venta.productos?.map((item, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                  >
                    <td className="py-2 px-3">
                      <div>
                        <p className="font-normal text-gray-800">
                          {item.producto?.nombre || "Producto no disponible"}
                        </p>
                        {item.producto?.descripcion && (
                          <p className="text-[10px] text-gray-600 mt-1">
                            {item.producto.descripcion}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center font-normal">
                      {item.cantidad}
                    </td>
                    <td className="py-2 px-3 text-right font-normal">
                      {formatearMoneda(item.precioVenta)}
                    </td>
                    <td className="py-2 px-3 text-right font-normal">
                      {formatearMoneda(item.precioVenta * item.cantidad)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-end mb-6">
          <p
            className="text-sm font-semibold
            text-[#ffd12c]
            "
          >
            TOTAL: {formatearMoneda(total)}
          </p>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#6d9bf7] pt-3 text-center">
          <div className="text-[10px] text-gray-600 space-y-1">
            <p className="font-normal text-gray-800">¡Gracias por su compra!</p>
            <p>{venta.sucursal.nombre}</p>
            <p>
              Encuentra todo lo que necesitas en un solo lugar: perfilería,
              herramientas, iluminación, pintura y mucho más.
            </p>
          </div>
        </div>
      </div>

      {/* Visor de PDF */}
      {pdfUrl && (
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <iframe
              src={pdfUrl}
              className="w-full h-[80vh] border border-gray-300 rounded"
              title="Vista previa del comprobante"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;
