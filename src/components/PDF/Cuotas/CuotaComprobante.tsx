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
import { CuotaType2 } from "./CuotaType2";

dayjs.extend(localizedFormat);
dayjs.locale("es");

// Registrar fuentes personalizadas
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const formatearFecha = (fecha: string) => {
  return dayjs(fecha).format("DD/MM/YYYY hh:mm A");
};

interface CuotaComprobanteProps {
  venta: CuotaType2;
}

function formatearMoneda(cantidad: number) {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  }).format(Number(cantidad));
}

const CuotaComprobante: React.FC<CuotaComprobanteProps> = ({ venta }) => {
  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 11,
      padding: 15,
      backgroundColor: "#FFFFFF",
      lineHeight: 1.2,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    logo: {
      width: 100,
      height: 60,
    },
    title: {
      fontSize: 15,
      fontWeight: "bold",
      color: "#fcb100",
    },
    section: {
      marginBottom: 5,
      padding: 5,
      backgroundColor: "#f7f7f7",
      borderRadius: 5,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 5,
      color: "#333",
    },
    row: {
      flexDirection: "row",
      marginBottom: 5,
    },
    label: {
      fontWeight: "medium",
      width: "35%",
    },
    value: {
      width: "65%",
    },
    productRow: {
      flexDirection: "row",
      marginBottom: 5,
      borderBottom: "1 solid #ddd",
      paddingBottom: 5,
    },
    productLabel: {
      width: "25%",
      fontWeight: "medium",
    },
    productValue: {
      width: "25%",
    },
    terms: {
      marginTop: 20,
      fontSize: 10,
    },
    termItem: {
      marginBottom: 5,
    },
    signatureSection: {
      marginTop: 30,
      alignItems: "center",
    },
    signatureLine: {
      marginTop: 40,
      borderTop: "1 solid #000000",
      width: "60%",
    },
    footer: {
      marginTop: 30,
      fontSize: 10,
      textAlign: "center",
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src={logo} />
          <Text style={styles.title}>Comprobante de Pago de Cuota</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{venta.cliente.nombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DPI:</Text>
            <Text style={styles.value}>{venta.cliente.dpi}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Pago</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Monto:</Text>
            <Text style={styles.value}>{formatearMoneda(venta.monto)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Pago:</Text>
            <Text style={styles.value}>{formatearFecha(venta.fechaPago)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estado:</Text>
            <Text style={styles.value}>{venta.estado}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Comentario:</Text>
            <Text style={styles.value}>{venta.comentario}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          <View style={styles.productRow}>
            <Text style={styles.productLabel}>Nombre</Text>
            <Text style={styles.productLabel}>Código</Text>
            <Text style={styles.productLabel}>Descripción</Text>
          </View>
          {venta.productos.map((producto) => (
            <View key={producto.id} style={styles.productRow}>
              <Text style={styles.productValue}>{producto.nombre}</Text>
              <Text style={styles.productValue}>{producto.codigoProducto}</Text>
              <Text style={styles.productValue}>{producto.descripcion}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atendido por</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{venta.usuario.nombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rol:</Text>
            <Text style={styles.value}>{venta.usuario.rol}</Text>
          </View>
        </View>

        <View style={styles.terms}>
          <Text style={styles.termItem}>
            1. Este comprobante es válido como prueba de pago de la cuota
            correspondiente.
          </Text>
          <Text style={styles.termItem}>
            2. Conserve este documento para futuras referencias.
          </Text>
          <Text style={styles.termItem}>
            3. Para cualquier consulta, por favor comuníquese con nuestro
            servicio al cliente.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <Text>Firma del Cliente</Text>
          <View style={styles.signatureLine} />
        </View>

        <Text style={styles.footer}>
          Documento generado el {formatearFecha(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  );
};

export default CuotaComprobante;
