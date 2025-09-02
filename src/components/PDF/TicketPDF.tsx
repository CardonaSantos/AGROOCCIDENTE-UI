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

import { VentaHistorialPDF } from "@/Types/PDF/VentaHistorialPDF";
import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";

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

interface Sorteo {
  id: number;
  descripcionSorteo: string;
  creadoEn: string;
  actualizadoEn: string;
  estado: string;
}

interface TicketProps {
  venta: VentaHistorialPDF;
  sorteo: Sorteo;
}

const TicketPDF: React.FC<TicketProps> = ({ venta, sorteo }) => {
  console.log("El sorteo es: ", sorteo);

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 5,
      padding: 8,
      flexDirection: "column",
      backgroundColor: "#FFFFFF",
    },
    header: {
      flexDirection: "row",
      marginBottom: 5,
      borderBottomWidth: 0.5,
      borderBottomColor: "#00ffae",
      paddingBottom: 3,
    },
    logo: {
      width: 30,
      height: 15,
    },
    headerText: {
      flex: 1,
      textAlign: "right",
    },
    title: {
      fontSize: 7,
      fontWeight: "bold",
      color: "#333333",
    },
    subtitle: {
      fontSize: 5,
      fontWeight: "medium",
      marginBottom: 2,
      color: "#666666",
    },
    text: {
      fontSize: 5,
      marginBottom: 1,
      color: "#333333",
    },
    section: {
      marginBottom: 5,
      padding: 3,
      backgroundColor: "#f8f8f8",
      borderRadius: 2,
    },
    sectionTitle: {
      fontSize: 5,
      fontWeight: "extrabold",
      marginBottom: 2,
      color: "#303030",
    },
    sorteoSection: {
      marginTop: 3,
      padding: 3,
      backgroundColor: "#ffffff",
      // borderRadius: 2,
      // borderWidth: 0.5,
      // borderColor: "#ed093b",
    },
    footer: {
      marginTop: 5,
      borderTopWidth: 0.5,
      borderTopColor: "#FCB100",
      paddingTop: 3,
      fontSize: 4,
      textAlign: "center",
      color: "#666666",
    },
    line: {
      borderBottomWidth: 0.5,
      borderBottomColor: "#CCCCCC",
      marginVertical: 2,
    },
  });

  return (
    <Document>
      <Page size="A7" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src={logo} />
          <View style={styles.headerText}>
            <Text style={styles.title}>TICKET #{venta.id}</Text>
            <Text style={styles.text}>{formatearFecha(venta.fechaVenta)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text style={styles.text}>
            {venta.cliente?.nombre || venta.nombreClienteFinal}
          </Text>
        </View>

        <View style={styles.line} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Producto(s)</Text>
          {venta.productos.map((producto, index) => (
            <Text key={index} style={styles.text}>
              • {producto.producto.nombre}
            </Text>
          ))}
        </View>

        <View style={styles.line} />

        {sorteo && (
          <View style={styles.sorteoSection}>
            <Text style={styles.sectionTitle}>Sorteo</Text>
            <Text style={styles.text}>{sorteo.descripcionSorteo}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>¡Gracias por su compra y buena suerte!</Text>
          <Text style={{ marginTop: 2 }}>
            NOVA SISTEMAS S.A. - Tecnología a tu alcance
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default TicketPDF;
