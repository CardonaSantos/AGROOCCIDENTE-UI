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
import { Reparacion } from "@/Pages/Reparaciones/RepairRegisType";

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
  reparacion: Reparacion;
}

const ReparacionComprobante: React.FC<ReparacionComprobanteProps> = ({
  reparacion,
}) => {
  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
      padding: 30,
      fontFamily: "Helvetica",
    },
    header: {
      marginBottom: 20,
      borderBottom: "2 solid #23c99a",
      paddingBottom: 10,
    },
    title: {
      fontSize: 15,
      fontWeight: "bold",
      color: "#23c99a",
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 13,
      color: "#666",
    },
    section: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "bold",
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
      fontWeight: "bold",
      color: "#333",
    },
    label2: {
      width: "30%",
      fontSize: 12,
      fontWeight: "bold",
      color: "#333",
      paddingTop: "5px",
      paddingBottom: "5px",
    },
    value: {
      width: "70%",
      fontSize: 11,
      color: "#696868",
    },
    value2: {
      fontSize: 11,
      color: "#696868",
      marginTop: 5,
      marginBottom: 10,
    },
    description: {
      fontSize: 12,
      color: "#666",
      marginTop: 5,
      marginBottom: 10,
    },
    signatureSection: {
      marginTop: 20,
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
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logo} style={{ width: 100, height: 60 }} />
          <Text style={styles.title}>Comprobante de Reparación</Text>
          <Text style={styles.subtitle}>
            No. #{reparacion.id} - Fecha:{" "}
            {formatearFecha(reparacion.fechaRecibido)}
          </Text>
        </View>

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
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>{reparacion.cliente.direccion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DPI:</Text>
            <Text style={styles.value}>{reparacion.cliente.dpi}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Producto</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
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
          <Text style={styles.value2}>
            {reparacion.producto
              ? reparacion.producto.descripcion
              : "Producto externo"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de la Reparación</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Estado:</Text>
            <Text style={styles.value}>{reparacion.estado}</Text>
          </View>

          <Text style={styles.label2}>Problemas reportados:</Text>
          <Text style={styles.value}>{reparacion.problemas}</Text>

          {/* <Text style={styles.description}>
            Problemas reportados: {reparacion.problemas}
          </Text> */}
          <Text style={styles.label2}>Observaciones:</Text>
          <Text style={styles.value}>{reparacion.observaciones}</Text>
          {/* 
          <Text style={styles.description}>
            Observaciones: {reparacion.observaciones}
          </Text> */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recibido por</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{reparacion.usuario.nombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sucursal:</Text>
            <Text style={styles.value}>
              {reparacion.sucursal.nombre} - {reparacion.sucursal.direccion}
            </Text>
          </View>
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.description}>
            Este documento es un comprobante de recepción para reparación.
          </Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Firma del Cliente</Text>
        </View>

        <Text style={styles.footer}>
          NOVA SISTEMAS S.A. - Tecnología a tu alcance
        </Text>
      </Page>
    </Document>
  );
};

export default ReparacionComprobante;

// export default WarrantyTicket;
