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
import { GarantiaType } from "@/Types/Warranty/Warranty";

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

interface TicketProps {
  garantia: GarantiaType[];
}

const WarrantyTicket: React.FC<TicketProps> = ({ garantia }) => {
  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
      padding: 30,
      fontFamily: "Roboto",
    },
    header: {
      marginBottom: 20,
      borderBottom: "2 solid #23c99a",
      paddingBottom: 10,
    },
    title: {
      fontSize: 20,
      fontWeight: 700,
      color: "#23c99a",
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 14,
      color: "#666",
    },
    section: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 500,
      color: "#0e1110",
      marginBottom: 3,
    },
    row: {
      flexDirection: "row",
      marginBottom: 3,
    },
    label: {
      width: "30%",
      fontSize: 12,
      fontWeight: 500,
      color: "#333",
    },
    value: {
      width: "70%",
      fontSize: 11,
      color: "#666",
    },
    description: {
      fontSize: 12,
      color: "#666",
      marginTop: 5,
      marginBottom: 10,
    },
    signatureSection: {
      marginTop: 5,
      borderTop: "1 solid #23c99a",
      paddingTop: 10,
    },
    signatureLine: {
      width: "60%",
      borderBottom: "1 dashed #666",
      marginTop: 50,
      marginBottom: 5,
    },
    signatureLabel: {
      fontSize: 10,
      color: "#666",
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 30,
      right: 30,
      textAlign: "center",
      color: "#666",
      fontSize: 10,
    },
  });

  return (
    <>
      {garantia &&
        garantia.map(() => (
          <Document>
            {garantia &&
              garantia.map((garantiaItem, index) => (
                <Page size="A4" style={styles.page} key={index}>
                  <View style={styles.header}>
                    <Image src={logo} style={{ width: 100, height: 60 }} />
                    <Text style={styles.title}>Ticket de Garantía</Text>
                    <Text style={styles.subtitle}>
                      No. #{garantiaItem.id || "N/A"} - Fecha:{" "}
                      {formatearFecha(garantiaItem.fechaRecepcion)}
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Información del Cliente
                    </Text>
                    <View style={styles.row}>
                      <Text style={styles.label}>Nombre:</Text>
                      <Text style={styles.value}>
                        {garantiaItem.cliente.nombre || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Teléfono:</Text>
                      <Text style={styles.value}>
                        {garantiaItem.cliente.telefono || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Dirección:</Text>
                      <Text style={styles.value}>
                        {garantiaItem.cliente.direccion || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>DPI:</Text>
                      <Text style={styles.value}>
                        {garantiaItem.cliente.dpi || "N/A"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Detalles del Producto
                    </Text>
                    <View style={styles.row}>
                      <Text style={styles.label}>Nombre:</Text>
                      <Text style={styles.value}>
                        {garantiaItem.producto.nombre || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Código:</Text>
                      <Text style={styles.value}>
                        {garantiaItem.producto.codigoProducto || "N/A"}
                      </Text>
                    </View>
                    <Text style={styles.description}>
                      {garantiaItem.producto.descripcion || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      Detalles de la Garantía
                    </Text>
                    <View style={styles.row}>
                      <Text style={styles.label}>Estado:</Text>
                      <Text style={styles.value}>
                        {garantiaItem.estado || "N/A"}
                      </Text>
                    </View>
                    <Text style={styles.description}>
                      Comentario sobre el fallo:{" "}
                      {garantiaItem.comentario || "N/A"}
                    </Text>
                    <Text style={styles.description}>
                      Detalles del Problema:{" "}
                      {garantiaItem.descripcionProblema || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recibido por</Text>
                    <View style={styles.row}>
                      <Text style={styles.label}>Nombre:</Text>
                      <Text style={styles.value}>
                        {garantiaItem.usuarioRecibe.nombre || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>Sucursal:</Text>
                      <Text style={styles.value}>
                        {garantiaItem.usuarioRecibe.sucursal.nombre || "N/A"} -{" "}
                        {garantiaItem.usuarioRecibe.sucursal.direccion || "N/A"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.signatureSection}>
                    <Text style={styles.description}>
                      Este documento es un comprobante de recepción para
                      garantía.
                    </Text>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>Firma del Cliente</Text>
                  </View>
                </Page>
              ))}
          </Document>
        ))}
    </>
  );
};

export default WarrantyTicket;

// export default WarrantyTicket;
