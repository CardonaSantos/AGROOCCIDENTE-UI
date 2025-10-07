import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { SimpleProvider } from "@/Types/Proveedor/SimpleProveedor";

import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";

import { Category, ProductCreate } from "./interfaces.interface";
import { motion } from "framer-motion";

import DesvanecerHaciaArriba from "@/Crm/Motion/DashboardAnimations";
import { PageHeader } from "@/utils/components/PageHeaderPos";
import { QueryTable } from "./interfaces/querytable";
import TableInventario from "./table/table";
import { PaginatedInventarioResponse } from "./interfaces/InventaryInterfaces";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale("es");

interface InventarioProps {
  categorias: Category[];
  proveedores: SimpleProvider[];
  openCategory: boolean;
  setOpenCategory: React.Dispatch<React.SetStateAction<boolean>>;
  loadInventoryData: () => Promise<void>;
  //crear categoria
  createCategory: (nombreCategorya: string) => Promise<void>;
  deleteCategory: (categoryID: number) => Promise<void>;

  updateOneCategory: (
    nombreCategory: string,
    categoryID: number
  ) => Promise<void>;
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
}

export default function Inventario({
  categorias,
  proveedores,
  //para dialog de category
  // openCategory,
  // setOpenCategory,
  loadInventoryData,
  //
  // createCategory,
  // deleteCategory,
  // updateOneCategory,
  setSearchQuery,
  searchQuery,
  productsInventario,
  setPagination,
  pagination,
}: //croper images
//precios del producto
InventarioProps) {
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
      <Button
        onClick={() => {
          loadInventoryData();
        }}
        className=""
      >
        Refrescar
      </Button>

      <Input
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setSearchQuery((previa) => ({
            ...previa,
            productoNombre: e.target.value,
          }));
        }}
        placeholder="Buscar por nombre o código producto"
      />
      <TableInventario
        pagination={pagination}
        setPagination={setPagination}
        data={productsInventario.data}
        meta={productsInventario.meta}
      />
    </motion.div>
  );
}
