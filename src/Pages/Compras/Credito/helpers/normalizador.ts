import { CompraDetalleUI } from "../../Interfaces/RegistroCompraInterface";
import { DetalleNormalizado } from "../../table-select-recepcion/detalleNormalizado";

export function normalizarDetalles(
  detalles: CompraDetalleUI[]
): DetalleNormalizado[] {
  return detalles.map((d) => {
    const usarPresentacion = d.presentacion != null;

    return {
      id: d.id,
      cantidad: d.cantidad,
      costoUnitario: d.costoUnitario,
      subtotal: d.subtotal,
      creadoEn: d.creadoEn,
      actualizadoEn: d.actualizadoEn,
      producto: {
        id: usarPresentacion ? d.presentacion!.id : d.producto.id!,
        nombre: usarPresentacion ? d.presentacion!.nombre : d.producto.nombre,
        codigo: usarPresentacion
          ? d.presentacion!.codigoBarras
          : d.producto.codigo,
        sku: usarPresentacion ? d.presentacion!.sku : undefined,
        tipo: usarPresentacion ? "PRESENTACION" : "PRODUCTO",
        precioCosto: d.costoUnitario,
        fechaVencimiento: d.fechaVencimiento,
      },
    };
  });
}
