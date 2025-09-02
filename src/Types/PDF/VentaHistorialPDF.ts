interface MetodoPago {
  id: number;
  ventaId: number;
  monto: number;
  metodoPago: string;
  fechaPago: string; // Formato ISO string
}

interface Sucursal {
  nombre: string;
  direccion: string;
  id: number;
  pbx: number;
  telefono: number;
}

interface Cliente {
  nombre: string;
  apellidos: string;

  correo: string;
  telefono: string;
  direccion: string;
  dpi: string;
}

interface ProductoInfo {
  id: number;
  nombre: string;
  descripcion: string;
  // precioVenta: number;
  codigoProducto: string;
  creadoEn: string; // Formato ISO string
  actualizadoEn: string; // Formato ISO string
}

interface ProductoVenta {
  id: number;
  ventaId: number;
  productoId: number;
  cantidad: number;
  creadoEn: string; // Formato ISO string
  precioVenta: number; // Precio de venta al momento de la transacción
  producto: ProductoInfo;
  descripcion: string;
}

interface Venta {
  id: number;
  clienteId: number | null;
  fechaVenta: string; // Formato ISO string
  horaVenta: string; // Formato ISO string
  totalVenta: number;
  cliente: Cliente | null; // Ajusta según los datos reales del cliente si existe
  metodoPago: MetodoPago;
  productos: ProductoVenta[];
  sucursal: Sucursal;
  //NUEVOS CAMPOS
  nombreClienteFinal: string;
  telefonoClienteFinal: string;
  direccionClienteFinal: string;
  imei: string;
}

export type VentaHistorialPDF = Venta;
