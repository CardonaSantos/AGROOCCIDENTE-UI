"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { RequisitionPrintable } from "../newMap/requisicion.interfaces";
import { getOneRequisicion } from "../requisicion.api";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import currency from "currency.js";
import { formattFecha } from "@/Pages/Utils/Utils";
import { formateDateWithMinutes } from "@/Crm/Utils/FormateDate";

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatearMoneda = (
  value: string | number,
  decimales = 2
): string => {
  return currency(value, {
    precision: decimales,
    symbol: "Q ",
    separator: ",",
    decimal: ".",
    pattern: "!#", // símbolo antes del número ("Q 1,234.50")
  }).format(); // ← ahora devuelve string
};

const RequisicionPDF = () => {
  const { id } = useParams();
  const [requisicion, setRequisicion] = useState<RequisitionPrintable | null>(
    null
  );
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requisicionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRequisicion = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await getOneRequisicion(Number(id));
        setRequisicion(data);
      } catch (error) {
        console.error("Error al cargar la requisición:", error);
        setError("Error al cargar la requisición");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequisicion();
  }, [id]);

  useEffect(() => {
    if (!requisicion || !requisicionRef.current) return;
    const generarPDF = async () => {
      try {
        const canvas = await html2canvas(requisicionRef.current!, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
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
    generarPDF();
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [requisicion]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-center">Cargando requisición...</p>
      </div>
    );
  }

  if (error || !requisicion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-center text-red-600">
          {error || "Requisición no encontrada"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div
        ref={requisicionRef}
        className={`shadow-lg rounded-lg ${pdfUrl ? "hidden" : "block"}`}
        style={{
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          color: "#000000",
          padding: "20px 24px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header con número de documento destacado */}
        {/* Header compacto */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium uppercase text-gray-700">
            Requisición de productos
          </span>

          <div className="flex flex-col items-end   rounded px-2 py-0.5">
            <span className="text-[8px] uppercase text-gray-500 leading-none">
              Folio
            </span>
            <span className="text-xs font-semibold text-gray-800 leading-tight">
              {requisicion.folio}
            </span>
          </div>
        </div>

        {/* Info principal en grid compacto */}
        <div
          className="grid grid-cols-2 gap-2 mb-4 p-2 rounded-sm shadow-sm"
          style={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <table className="w-full text-[12px]">
            <tbody>
              <tr>
                <td className="py-0.5 text-gray-600 font-medium">Fecha:</td>
                <td className="py-0.5 pl-1 text-gray-700">
                  {formateDateWithMinutes(requisicion.fecha)}
                </td>
              </tr>

              <tr>
                <td className="py-0.5 text-gray-600 font-medium">
                  Actualizado:
                </td>
                <td className="py-0.5 pl-1 text-gray-700">
                  {formateDateWithMinutes(requisicion.updatedAt)}
                </td>
              </tr>

              <tr>
                <td className="py-0.5 text-gray-600 font-medium">Sucursal:</td>
                <td className="py-0.5 pl-1 text-gray-700">
                  {requisicion.sucursal.nombre}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 text-gray-600 font-medium">
                  Solicitante:
                </td>
                <td className="py-0.5 pl-1 text-gray-700">
                  {requisicion.usuario.nombre}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full text-[12px]">
            <tbody>
              <tr>
                <td className="py-0.5 text-gray-600 font-medium">
                  Total líneas:
                </td>
                <td className="py-0.5 pl-1 text-gray-700">
                  {requisicion.totalLineas}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 text-gray-600 font-medium">
                  Total est.:
                </td>
                <td className="py-0.5 pl-1 font-semibold text-gray-800">
                  {formatearMoneda(requisicion.totalRequisicion)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Observaciones */}
        {requisicion.observaciones && (
          <div className="mb-6">
            {" "}
            {/* Increased margin-bottom */}
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {" "}
              {/* Larger and bolder title */}
              Observaciones
            </h3>
            <div
              className="p-3 rounded-md shadow-sm text-sm" /* Increased padding, rounded-md, shadow-sm */
              style={{
                backgroundColor: "#f3f4f6",
                border: "1px solid #e5e7eb",
              }}
            >
              <p className="text-gray-600">{requisicion.observaciones}</p>{" "}
              {/* Slightly darker text */}
            </div>
          </div>
        )}
        {/* Título de sección */}
        <div className="mb-6">
          {" "}
          {/* Increased margin-bottom */}
          <h3 className="text-sm font-medium text-gray-700">
            {" "}
            {/* Larger and bolder title */}
            Detalle de productos solicitados
          </h3>
        </div>
        {/* Tabla de productos */}
        <div
          className="mb-6 rounded-md shadow-sm" /* Increased margin-bottom, rounded-md, shadow-sm */
          style={{
            border: "1px solid #d1d5db" /* Slightly darker border */,
            overflow: "hidden",
          }}
        >
          <table
            className="w-full"
            style={{
              fontSize: "10px" /* Slightly larger font size */,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#e5e7eb" }}>
                {" "}
                {/* Darker header background */}
                <th className="py-2 px-2 text-left text-gray-700 font-medium border-b border-gray-300">
                  {" "}
                  {/* Bolder text, darker border */}
                  Código
                </th>
                <th className="py-2 px-2 text-left text-gray-700 font-medium border-b border-gray-300">
                  {" "}
                  {/* Bolder text, darker border */}
                  Producto
                </th>
                <th className="py-2 px-2 text-center text-gray-700 font-medium border-b border-gray-300">
                  {" "}
                  {/* Bolder text, darker border */}
                  Stock Actual
                </th>
                <th className="py-2 px-2 text-center text-gray-700 font-medium border-b border-gray-300">
                  {" "}
                  {/* Bolder text, darker border */}
                  Stock Mín.
                </th>
                <th className="py-2 px-2 text-center text-gray-700 font-medium border-b border-gray-300">
                  {" "}
                  {/* Bolder text, darker border */}
                  Cant. Sugerida
                </th>
                <th className="py-2 px-2 text-center text-gray-700 font-medium border-b border-gray-300">
                  {" "}
                  {/* Bolder text, darker border */}
                  Cant. Recibida
                </th>
                <th className="py-2 px-2 text-right text-gray-700 font-medium border-b border-gray-300">
                  {" "}
                  {/* Bolder text, darker border */}
                  F. Exp
                </th>
                <th className="py-2 px-2 text-right text-gray-700 font-medium border-b border-gray-300">
                  {" "}
                  {/* Bolder text, darker border */}
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {requisicion.lineas.map((linea, index) => (
                <tr
                  key={linea.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                  }}
                >
                  <td className="py-2 px-2 border-b border-gray-200 font-mono text-xs text-gray-700">
                    {" "}
                    {/* Darker border, darker text */}
                    {linea.producto.codigoProducto}
                  </td>
                  <td className="py-2 px-2 border-b border-gray-200 text-gray-700">
                    {" "}
                    {/* Darker border, darker text */}
                    {linea.producto.nombre}
                  </td>
                  <td className="py-2 px-2 text-center border-b border-gray-200 text-gray-700">
                    {" "}
                    {/* Darker border, darker text */}
                    {linea.cantidadActual}
                  </td>
                  <td className="py-2 px-2 text-center border-b border-gray-200 text-gray-700">
                    {" "}
                    {/* Darker border, darker text */}
                    {linea.stockMinimo}
                  </td>
                  <td className="py-2 px-2 text-center border-b border-gray-200 font-medium text-gray-700">
                    {" "}
                    {/* Darker border, bolder text */}
                    {linea.cantidadSugerida}
                  </td>
                  <td className="py-2 px-2 text-center border-b border-gray-200 font-medium text-gray-700">
                    {" "}
                    {/* Darker border, bolder text */}
                    {linea.cantidadRecibida ? linea?.cantidadRecibida : "N/A"}
                  </td>
                  <td className="py-2 px-2 text-right border-b border-gray-200 text-gray-700">
                    {" "}
                    {/* Darker border, darker text */}
                    {linea.fechaExpiracion
                      ? formattFecha(linea?.fechaExpiracion)
                      : "N/A"}
                  </td>
                  <td className="py-2 px-2 text-right border-b border-gray-200 font-medium text-gray-700">
                    {" "}
                    {/* Darker border, bolder text */}
                    {formatearMoneda(
                      linea.precioUnitario * linea.cantidadSugerida
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Resumen totales */}
        <div className="flex justify-end mb-8">
          <div
            className="w-64 rounded-md shadow-sm" /* Increased width, rounded-md, shadow-sm */
            style={{
              border: "1px solid #d1d5db" /* Slightly darker border */,
            }}
          >
            <table className="w-full text-xs">
              {" "}
              {/* Slightly larger font size */}
              <tbody>
                <tr>
                  <td className="py-2 px-3 border-b border-gray-200 text-gray-600">
                    {" "}
                    {/* Increased padding, darker border, darker text */}
                    Total de productos:
                  </td>
                  <td className="py-2 px-3 border-b border-gray-200 text-right font-medium">
                    {" "}
                    {/* Increased padding, darker border, darker text */}
                    {requisicion.totalLineas}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border-b border-gray-200 text-gray-600">
                    {" "}
                    {/* Increased padding, darker border, darker text */}
                    Total de unidades:
                  </td>
                  <td className="py-2 px-3 border-b border-gray-200 text-right font-medium">
                    {" "}
                    {/* Increased padding, darker border, darker text */}
                    {requisicion.lineas.reduce(
                      (acc, linea) => acc + linea.cantidadSugerida,
                      0
                    )}
                  </td>
                </tr>
                <tr style={{ backgroundColor: "#e5e7eb" }}>
                  {" "}
                  {/* Darker background for total row */}
                  <td className="py-2 px-3 text-gray-800 font-medium">
                    {" "}
                    {/* Increased padding, bolder and larger text */}
                    TOTAL ESTIMADO:
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-gray-800 text-base">
                    {" "}
                    {/* Increased padding, bolder and larger text */}
                    {formatearMoneda(requisicion.totalRequisicion)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Vista previa del PDF */}
      {pdfUrl && (
        <div className="mt-6">
          <iframe
            src={pdfUrl}
            className="w-full h-[80vh] border rounded-lg"
            title="Vista previa PDF de requisición"
          />
        </div>
      )}
    </div>
  );
};

export default RequisicionPDF;
