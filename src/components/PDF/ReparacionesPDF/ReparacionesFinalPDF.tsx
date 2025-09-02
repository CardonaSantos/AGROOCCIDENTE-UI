import React from "react";
import {
  Image,
  Text,
  View,
  Page,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import logo from "@/assets/Agroservicio.png";
import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { ReparacionRegistroFinal } from "./ReparacionesFinal";

dayjs.extend(localizedFormat);
dayjs.locale("es");

// Register custom font (optional, but recommended for better styling)

// Register custom font (optional, but recommended for better styling)
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
});

const formatearFecha = (fecha: string) => {
  return dayjs(fecha).format("DD/MM/YYYY hh:mm A");
};

interface ReparacionComprobanteProps {
  reparacion: ReparacionRegistroFinal;
}
const ReparacionesFinalPDF: React.FC<ReparacionComprobanteProps> = ({
  reparacion,
}) => {
  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 11,
    },
    header: {
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#D1D5DB",
      paddingBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    logo: {
      width: 100,
      height: 60,
    },
    headerText: {
      flexDirection: "column",
      alignItems: "flex-end",
    },
    title: {
      fontSize: 15,
      fontWeight: "bold",
      color: "#23c99a",
    },
    subtitle: {
      fontSize: 12,
      color: "#4B5563",
    },
    section: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: "#0e1110",
      marginBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
      paddingBottom: 5,
    },
    row: {
      flexDirection: "row",
      marginBottom: 5,
    },
    label: {
      width: "30%",
      fontWeight: "bold",
      color: "#374151",
    },
    value: {
      width: "70%",
      color: "#6B7280",
    },
    description: {
      color: "#4B5563",
      marginTop: 5,
      lineHeight: 1.5,
    },

    comentarioFinal: {
      color: "#4B5563",
      marginTop: 7,
      marginBottom: 7,
      lineHeight: 1.5,
    },
    badge: {
      padding: "3 10",
      borderRadius: 4,
      fontSize: 10,
      fontWeight: "bold",
      color: "white",
      textAlign: "center",
    },
    footer: {
      marginTop: 20,
      borderTopWidth: 1,
      borderTopColor: "#D1D5DB",
      paddingTop: 10,
      textAlign: "center",
      fontSize: 10,
      color: "#6B7280",
    },
    signatureSection: {
      marginTop: 20,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    signatureBox: {
      //   borderTopWidth: 1,
      //   borderTopColor: "#D1D5DB",
      width: "45%",
      textAlign: "center",
      paddingTop: 8,
    },
    signatureText: {
      color: "#4B5563",
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={logo} style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Comprobante de Reparación Finalizada
            </Text>
            <Text style={styles.subtitle}>ID Reparación: #{reparacion.id}</Text>
          </View>
        </View>

        {/* Información del Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{reparacion.cliente.nombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value}>{reparacion.cliente.telefono}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DPI:</Text>
            <Text style={styles.value}>{reparacion.cliente.dpi}</Text>
          </View>
        </View>

        {/* Detalles del Producto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Producto</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Producto:</Text>
            <Text style={styles.value}>
              {reparacion.producto
                ? reparacion.producto.nombre
                : reparacion.productoExterno}
            </Text>
          </View>
          {reparacion.producto && (
            <View style={styles.row}>
              <Text style={styles.label}>Código:</Text>
              <Text style={styles.value}>
                {reparacion.producto.codigoProducto}
              </Text>
            </View>
          )}
        </View>

        {/* Resumen de la Reparación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de la Reparación</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Estado Final:</Text>
            <Text style={styles.value}>{reparacion.estado}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha Recibido:</Text>
            <Text style={styles.value}>
              {formatearFecha(reparacion.fechaRecibido)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Entrega:</Text>
            <Text style={styles.value}>
              {reparacion.fechaEntregado
                ? formatearFecha(reparacion.fechaEntregado)
                : "Pendiente"}
            </Text>
          </View>
          <Text style={styles.description}>
            Problemas Reportados: {reparacion.problemas}
          </Text>
          <Text style={styles.description}>
            Observaciones: {reparacion.observaciones || "N/A"}
          </Text>
        </View>

        {/* Acciones Realizadas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Realizadas</Text>
          {reparacion.registros.map((registro, index) => (
            <View key={index} style={{ marginBottom: 5 }}>
              <Text style={styles.description}>
                {formatearFecha(registro.fechaRegistro)} -{" "}
                {registro.usuario.nombre}:
              </Text>
              <Text style={styles.description}>
                {registro.accionesRealizadas}
              </Text>

              <Text style={styles.comentarioFinal}>
                Comentario Final: {registro.comentarioFinal}
              </Text>
            </View>
          ))}
        </View>

        {/* Firma */}
        {/* <View style={styles.signatureSection}> */}
        <Text style={styles.signatureBox}>
          <Text style={styles.signatureText}>Firma del Cliente</Text>
        </Text>
        {/* <Text style={styles.signatureBox}>
            <Text style={styles.signatureText}>Firma del Técnico</Text>
          </Text> */}
        {/* </View> */}

        {/* Footer */}
        <Text style={styles.footer}>
          Este documento certifica que el cliente recibió el producto y acepta
          las condiciones. NOVA SISTEMAS S.A.
        </Text>
      </Page>
    </Document>
  );
};

export default ReparacionesFinalPDF;
