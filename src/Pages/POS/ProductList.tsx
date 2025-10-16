"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Barcode, CirclePlus, Eye, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import sinFoto from "@/assets/sin foto.png";
import { formattMonedaGT } from "@/utils/formattMoneda";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProductoData } from "./interfaces/newProductsPOSResponse";

interface ProductListProps {
  isLoadingProducts: boolean;
  productos: ProductoData[];
  onAddToCart: (product: any) => void;
  onImageClick: (images: string[]) => void;
}

export default function ProductList({
  productos,
  onAddToCart,
  onImageClick,
}: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const filteredProducts = productos.filter(
    (product) =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigoProducto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Barra de búsqueda */}
      <Card className="shadow-md border-0">
        <CardContent className="pt-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              {/* Ícono de lupa a la izquierda */}
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              {/* Botón "borrar" a la derecha (solo si hay texto) */}
              {searchTerm && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={clearSearch}
                  className="absolute left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {/* Input */}
              <Input
                type="text"
                placeholder="Buscar por nombre o código…"
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9 pr-9" /* padding extra a la derecha para el botón */
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-transparent"
            >
              <Barcode className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de productos */}
      <Card className="overflow-hidden shadow-md border-0">
        <CardContent className="p-0">
          <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0">
                <TableRow>
                  <TableHead className="w-14"></TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead className="text-center">Detalles</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="w-16 text-center">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/30">
                    {/* Imagen del producto */}
                    <TableCell className="p-2">
                      <div
                        className="w-10 h-10 rounded-md overflow-hidden bg-muted/20 group relative"
                        onClick={() => {
                          // onImageClick(
                          //   product.imagenesProducto.map((img) => img.url)
                          // );
                        }}
                      >
                        <img
                          src={product.images[0]?.url || sinFoto}
                          width={40}
                          height={40}
                          alt={product.nombre}
                          className="object-cover w-full h-full"
                        />
                        {/* Overlay con icono de ojo */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </TableCell>
                    {/* Nombre del producto */}
                    <TableCell className="py-2">
                      <p className="text-sm font-medium line-clamp-2">
                        {product.nombre}
                      </p>
                    </TableCell>
                    {/* Precio del producto */}
                    <TableCell className="py-2">
                      <div className="flex flex-col gap-0.5">
                        {product.precios.map((precio, index) => (
                          <span key={index} className="text-xs">
                            {formattMonedaGT(precio.precio)}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="flex justify-center items-center ">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Eye className="w-4 h-4" />
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <p className="text-muted-foreground text-sm">
                                {product.descripcion}
                              </p>
                            </div>
                            <div className="grid gap-2"></div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>

                    {/* Verificación de existencia de stock */}
                    {product.stocks && product.stocks.length > 0 ? (
                      <>
                        {/* Cantidad total de stock */}
                        <TableCell className="text-center py-2">
                          {product.stocks.some(
                            (stock) => stock.cantidad > 0
                          ) ? (
                            <Badge variant="outline" className="font-bold">
                              {product.stocks.reduce(
                                (total, stocks) => total + stocks.cantidad,
                                0
                              )}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              Sin stock
                            </Badge>
                          )}
                        </TableCell>

                        {/* Botón para añadir al carrito */}
                        <TableCell className="text-center py-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => onAddToCart(product)}
                            disabled={
                              product.stocks.reduce(
                                (total, stocks) => total + stocks.cantidad,
                                0
                              ) === 0
                            }
                          >
                            <CirclePlus className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      // Caso cuando no hay stock disponible
                      <>
                        <TableCell className="text-center py-2">
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            Sin stock
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full"
                            disabled
                          >
                            <CirclePlus className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
