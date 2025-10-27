import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleProvider } from "@/Types/Proveedor/SimpleProveedor";
import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { ProductCreate } from "./interfaces.interface";
import { motion } from "framer-motion";
import DesvanecerHaciaArriba from "@/Crm/Motion/DashboardAnimations";
import { PageHeader } from "@/utils/components/PageHeaderPos";
import { QueryTable } from "./interfaces/querytable";
import TableInventario from "./table/table";
import { PaginatedInventarioResponse } from "./interfaces/InventaryInterfaces";
import { Package2, RotateCcw, Tag, X } from "lucide-react";
import { Link } from "react-router-dom";
import FiltersSection from "./filters/filters-sections";
import { CategoriaWithCount } from "../Categorias/CategoriasMainPage";
import { TipoPresentacion } from "../newCreateProduct/interfaces/DomainProdPressTypes";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale("es");

interface InventarioProps {
  handleSelecTiposEmpaque: (ids: number[]) => void;
  categorias: CategoriaWithCount[];
  proveedores: SimpleProvider[];
  openCategory: boolean;
  setOpenCategory: React.Dispatch<React.SetStateAction<boolean>>;
  loadInventoryData: () => Promise<void>;
  //crear categoria
  //Para crear producto y limpiar
  productCreate: ProductCreate;
  setProductCreate: React.Dispatch<React.SetStateAction<ProductCreate>>;
  //croper de imagenes
  setSearchQuery: React.Dispatch<React.SetStateAction<QueryTable>>;
  searchQuery: QueryTable;

  productsInventario: PaginatedInventarioResponse;

  setPagination: React.Dispatch<
    React.SetStateAction<{
      pageIndex: number;
      pageSize: number;
    }>
  >;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };

  isloadingInventario: boolean;

  handleSelectCat: (ids: number[]) => void;
  tiposPresentacion: TipoPresentacion[];
}

export default function Inventario({
  categorias,
  proveedores,
  loadInventoryData,
  setSearchQuery,
  searchQuery,
  productsInventario,
  setPagination,
  pagination,
  isloadingInventario,
  tiposPresentacion,
  handleSelectCat,
  handleSelecTiposEmpaque,
}: InventarioProps) {
  console.log("Las categorias son: ", categorias);
  console.log("proveedores: ", proveedores);
  console.log("el query es: ", searchQuery);
  console.log();

  return (
    <motion.div className="container mx-auto" {...DesvanecerHaciaArriba}>
      <PageHeader
        title="Inventario General"
        subtitle="Gestione sus productos y stocks"
        sticky={false}
        fallbackBackTo="/"
      />

      <div className="mb-3 grid gap-3 lg:grid-cols-[1fr_auto] items-start">
        {/* Controles (input + selects) */}
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))] items-end">
          {/* Buscar */}
          <div className="min-w-0 grid gap-1">
            <label className="text-xs">Buscar</label>
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setSearchQuery((prev) => ({
                    ...prev,
                    codigoProducto: "",
                    productoNombre: "",
                  }))
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-600"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>

              <Input
                type="search"
                placeholder="Buscar por nombre o código de producto"
                className="pl-8 h-9 text-sm"
                value={searchQuery.productoNombre ?? ""}
                onChange={(e) =>
                  setSearchQuery((prev) => ({
                    ...prev,
                    productoNombre: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Inserta los dos selects aquí (como fragmento) */}
          <FiltersSection
            handleSelecTiposEmpaque={handleSelecTiposEmpaque}
            tiposPresentacion={tiposPresentacion}
            searchQuery={searchQuery}
            cats={categorias}
            handleSelectCat={handleSelectCat}
          />
        </div>

        {/* Acciones (derecha en desktop, abajo en mobile) */}
        <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2">
          <Button
            onClick={loadInventoryData}
            disabled={isloadingInventario}
            aria-busy={isloadingInventario}
            className="inline-flex items-center gap-2 h-9 px-3"
            variant="secondary"
          >
            <RotateCcw
              className={`h-4 w-4 ${isloadingInventario ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refrescar</span>
          </Button>

          <Link to={"/categorias"}>
            <Button
              variant="outline"
              className="inline-flex items-center justify-center h-9 w-9 p-0"
              title="Etiquetas o filtros"
            >
              <Tag className="h-4 w-4" />
            </Button>
          </Link>

          <Link to={"/tipos-presentaciones"}>
            <Button
              variant="outline"
              className="inline-flex items-center justify-center h-9 w-9 p-0"
              title="Tipos de presentaciones"
            >
              <Package2 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <TableInventario
        pagination={pagination}
        setPagination={setPagination}
        data={productsInventario.data}
        meta={productsInventario.meta}
      />
    </motion.div>
  );
}
