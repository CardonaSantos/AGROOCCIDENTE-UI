import { useApiQuery } from "@/hooks/genericoCall/genericoCallHook";
import {
  CompraRecepcionesParcialesUI,
  CompraResumenUI,
  UsuarioMinUI,
} from "./interfaces/recepcionesInterfaces";
import { motion } from "framer-motion";
import { DesvanecerHaciaArriba } from "@/Pages/movimientos-cajas/utils/animations";
import CardCompraMain from "./CardCompraMain";
import LineasRecepciones from "./LineasRecepciones";
import { Skeleton } from "@/components/ui/skeleton";
const EMPTY_USER: UsuarioMinUI = {
  id: 0,
  nombre: "",
  correo: "",
  rol: undefined,
};

const EMPTY_COMPRA: CompraResumenUI = {
  id: 0,
  fecha: "",
  estado: "",
  origen: "",
  conFactura: false,
  total: 0,
  usuario: EMPTY_USER,
  totales: {
    lineasOrdenadas: 0,
    unidadesOrdenadas: 0,
    unidadesRecibidas: 0,
    unidadesPendientes: 0,
    recepcionesCount: 0,
  },
  detalles: [],
};

export const DEFAULT_RECEPCIONES_DATA: CompraRecepcionesParcialesUI = {
  compra: EMPTY_COMPRA,
  recepciones: [],
  lineasFlat: [],
} as const;

interface PropsRecepciones {
  compraId: number;
}

function RecepcionesMain({ compraId }: PropsRecepciones) {
  const {
    data: dataRecepciones = DEFAULT_RECEPCIONES_DATA,
    isPending: isPendingRecepciones,
  } = useApiQuery<CompraRecepcionesParcialesUI>(
    ["compra-recepciones", compraId],
    `/recepciones/get-recepciones-parciales`,
    {
      params: {
        compraId: compraId,
      },
    },
    {
      placeholderData: DEFAULT_RECEPCIONES_DATA,
      retry: true,
    }
  );

  function SkeletonLoading() {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  return isPendingRecepciones ? (
    <SkeletonLoading />
  ) : (
    <motion.div {...DesvanecerHaciaArriba} className="space-y-3">
      <CardCompraMain compra={dataRecepciones.compra} />
      <LineasRecepciones lineas={dataRecepciones.recepciones} />
    </motion.div>
  );
}

export default RecepcionesMain;
