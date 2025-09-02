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
import { RegistroGarantiaFINALPDFType } from "./WarrantyFinalPDFType";

dayjs.extend(localizedFormat);
dayjs.locale("es");
const formatearFecha = (fecha: string) => {
  return dayjs(fecha).format("DD/MM/YYYY hh:mm A");
};
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

// const formatearFecha = (fecha: string) => {
//   return dayjs(fecha).format("DD/MM/YYYY");
// };

interface WarrantyFinalPDFProps {
  registro: RegistroGarantiaFINALPDFType;
}

// Register fonts
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
    borderTop: "1 solid #23c99a", //COLOR NOVA
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

interface WarrantyFinalPDFProps {
  registro: RegistroGarantiaFINALPDFType;
}

const WarrantyFinalPDF: React.FC<WarrantyFinalPDFProps> = ({ registro }) => {
  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString("es-ES", {
  //     year: "numeric",
  //     month: "long",
  //     day: "numeric",
  //   });
  // };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logo} style={{ width: 100, height: 60 }} />
          <Text style={styles.title}>Comprobante de Garantía</Text>
          <Text style={styles.subtitle}>
            No. #{registro.id} - Fecha: {formatearFecha(registro.fechaRegistro)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Estado:</Text>
            <Text style={styles.value}>{registro.estado}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Atendido por:</Text>
            <Text style={styles.value}>{registro.usuario.nombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sucursal:</Text>
            <Text style={styles.value}>
              {registro.usuario.sucursal.nombre
                ? registro.usuario.sucursal.nombre
                : "N/A"}{" "}
              -{" "}
              {registro.usuario.sucursal.direccion
                ? registro.usuario.sucursal.direccion
                : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Producto</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{registro.producto.nombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Código:</Text>
            <Text style={styles.value}>{registro.producto.codigoProducto}</Text>
          </View>
          <Text style={styles.description}>
            {registro.producto.descripcion}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de la Garantía</Text>
          <Text style={styles.description}>
            Conclusión: {registro.conclusion}
          </Text>
          <Text style={styles.description}>
            Acciones Realizadas: {registro.accionesRealizadas}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{registro.garantia.cliente.nombre}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DPI:</Text>
            <Text style={styles.value}>{registro.garantia.cliente.dpi}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value}>
              {registro.garantia.cliente.telefono}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>
              {registro.garantia.cliente.direccion}
            </Text>
          </View>
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Firma del Cliente</Text>
          <Text style={styles.description}>
            Declaro haber recibido el producto en condiciones satisfactorias y
            acepto los términos de la garantía.
          </Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Firma del Cliente</Text>
        </View>

        <Text style={styles.footer}>
          Este documento es un comprobante oficial de garantía. Por favor,
          consérvelo para futuras referencias.
        </Text>
      </Page>
    </Document>
  );
};

export default WarrantyFinalPDF;
