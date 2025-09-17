import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Ban,
  Building,
  Building2,
  Calendar,
  CircleUserRound,
  Clock,
  InfinityIcon,
  MapPin,
  Search,
  Tag,
  TagIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Boxes } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowDownUp,
  Barcode,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
} from "lucide-react";
import { SimpleProvider } from "@/Types/Proveedor/SimpleProveedor";
import { ProductsInventary } from "@/Types/Inventary/ProductsInventary";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Separator } from "@/components/ui/separator";
import { formattMonedaGT } from "@/utils/formattMoneda";
import { Category, ProductCreate } from "./interfaces.interface";
import CreateCategory from "./CreateCategory";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DesvanecerHaciaArriba from "@/Crm/Motion/DashboardAnimations";
import { PageHeader } from "@/utils/components/PageHeaderPos";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale("es");

const formatearFecha = (fecha: string) => {
  return dayjs.utc(fecha).format("DD/MM/YYYY");
};

interface InventarioProps {
  products: ProductsInventary[];
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
  //Para precios del producto creando
}

export default function Inventario({
  categorias,
  products,
  proveedores,
  //para dialog de category
  openCategory,
  setOpenCategory,
  loadInventoryData,
  //
  createCategory,
  deleteCategory,
  updateOneCategory,
}: //croper images
//precios del producto
InventarioProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const filteredProducts = products
    .filter((product) => {
      const hasStock = product.stock.length > 0;
      const firstStock = hasStock ? product.stock : null;

      // Filtrado por nombre de producto o código de producto
      const matchesSearchTerm =
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigoProducto.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtrado por categoría
      const matchesCategory =
        categoryFilter === "all" ||
        (product.categorias.length > 0 &&
          product.categorias.some((cat) => cat.nombre === categoryFilter));

      // Filtrado por proveedor
      const matchesSupplier =
        supplierFilter === "all" ||
        (firstStock &&
          firstStock.some(
            (stock) =>
              stock.entregaStock.proveedor.nombre.trim().toLocaleLowerCase() ===
              supplierFilter.trim().toLocaleLowerCase()
          ));

      // Se filtra por el término de búsqueda y luego por los demás filtros
      return matchesSearchTerm && matchesCategory && matchesSupplier;
    })
    .sort((a, b) => {
      const stockA = a.stock.length > 0 ? a.stock[0] : null;
      const stockB = b.stock.length > 0 ? b.stock[0] : null;

      // Ordenar por cantidad
      if (sortBy === "quantity") {
        return sortOrder === "asc"
          ? (stockA?.cantidad || 0) - (stockB?.cantidad || 0)
          : (stockB?.cantidad || 0) - (stockA?.cantidad || 0);
      }

      // Ordenar por precio
      if (sortBy === "price") {
        return sortOrder === "asc"
          ? a.precioVenta - b.precioVenta
          : b.precioVenta - a.precioVenta;
      }

      // Ordenar por fecha de vencimiento
      if (sortBy === "expiration") {
        const expirationA = stockA?.fechaVencimiento
          ? new Date(stockA.fechaVencimiento).getTime()
          : null;
        const expirationB = stockB?.fechaVencimiento
          ? new Date(stockB.fechaVencimiento).getTime()
          : null;

        if (!expirationA) return sortOrder === "asc" ? 1 : -1;
        if (!expirationB) return sortOrder === "asc" ? -1 : 1;

        return sortOrder === "asc"
          ? expirationA - expirationB
          : expirationB - expirationA;
      }

      return 0;
    });

  // PAGINACIÓN
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalInventoryCount = filteredProducts.reduce((sum, product) => {
    const stockQuantity =
      product.stock.length > 0 ? product.stock[0].cantidad : 0;
    return sum + stockQuantity;
  }, 0);

  return (
    <motion.div className="container mx-auto" {...DesvanecerHaciaArriba}>
      <PageHeader
        title="Inventario General"
        subtitle="Gestione sus productos y stocks"
        sticky={false}
        fallbackBackTo="/"
      />
      <div className="bg-muted/50 p-6 rounded-xl mb-6 shadow-sm border border-border/40 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Boxes className="h-6 w-6 text-primary dark:text-white" />
            <div className="text-LG font-semibold">
              Inventario Total:{" "}
              <span className="text-primary font-bold dark:text-white">
                {totalInventoryCount}
              </span>{" "}
              items
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              className="flex items-center space-x-2 transition-all hover:shadow-md"
              asChild
              // onClick={() => setOpenCategory(true)}
            >
              <Link to={`/crear-producto`}>
                <Tag className="h-4 w-4" />
                <span>Producto y categorias</span>
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
          {/* Input de búsqueda */}
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-white" />
            <Input
              type="text"
              placeholder="Buscar producto por nombre, código"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full transition-all border-border/50 focus:border-primary"
              aria-label="Buscar productos"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                >
                  <Barcode className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Buscar por código de barras</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Filtro de categoría */}
          <div className="w-full md:w-1/3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full border-border/50 focus:border-primary">
                <div className="flex items-center">
                  <TagIcon className="mr-2 h-4 w-4 text-muted-foreground dark:text-white" />
                  <SelectValue placeholder="Categoría" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {categorias &&
                  categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nombre}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de proveedores */}
          <div className="w-full md:w-1/3">
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full border-border/50 focus:border-primary">
                <div className="flex items-center">
                  <CircleUserRound className="mr-2 h-4 w-4 text-muted-foreground dark:text-white" />
                  <SelectValue placeholder="Proveedores" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {proveedores &&
                  proveedores.map((prov) => (
                    <SelectItem key={prov.id} value={prov.nombre}>
                      {prov.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {/* MAPEO DE PRODUCTOS EN LA TABLA */}
      <div className="overflow-x-auto rounded-lg border border-border/40 shadow-sm">
        <TooltipProvider>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold w-32">Producto</TableHead>
                <TableHead className="font-semibold w-24">Categoría</TableHead>
                <TableHead
                  className="cursor-pointer font-semibold group w-28"
                  onClick={() => handleSort("quantity")}
                >
                  <div className="flex items-center">
                    <span className="text-xs">Stock</span>
                    {sortBy === "quantity" ? (
                      <ArrowDownUp className="ml-1 h-3 w-3 text-primary transition-transform" />
                    ) : (
                      <ArrowDownUp className="ml-1 h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="font-semibold w-16 text-xs">
                  Min.
                </TableHead>
                <TableHead
                  className="cursor-pointer font-semibold group w-24"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center">
                    <span className="text-xs">Precio</span>
                    {sortBy === "price" ? (
                      <ArrowDownUp className="ml-1 h-3 w-3 text-primary transition-transform" />
                    ) : (
                      <ArrowDownUp className="ml-1 h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="font-semibold w-20 text-xs">
                  Entrada
                </TableHead>
                <TableHead
                  className="cursor-pointer font-semibold group w-24"
                  onClick={() => handleSort("expiration")}
                >
                  <div className="flex items-center">
                    <span className="text-xs">Vencimiento</span>
                    {sortBy === "expiration" ? (
                      <ArrowDownUp className="ml-1 h-3 w-3 text-primary transition-transform" />
                    ) : (
                      <ArrowDownUp className="ml-1 h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="font-semibold w-20 text-xs">
                  Sucursales
                </TableHead>
                <TableHead className="font-semibold w-16">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((product) => {
                const stock = Array.isArray(product?.stock)
                  ? product.stock
                  : [];
                const visibles = stock.slice(0, 2);
                const restantes = stock.slice(2);

                return (
                  <TableRow
                    key={product.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium text-sm py-2">
                      <div className="max-w-32 truncate" title={product.nombre}>
                        {product.nombre}
                      </div>
                    </TableCell>

                    <TableCell className="py-2">
                      <div className="flex flex-wrap gap-0.5 max-w-24">
                        {product.categorias.slice(0, 2).map((cat) => (
                          <Badge
                            key={cat.nombre}
                            variant="outline"
                            className="text-[10px] px-1 py-0 h-4"
                          >
                            {cat.nombre.slice(0, 4)}
                          </Badge>
                        ))}
                        {product.categorias.length > 2 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 h-4"
                          >
                            +{product.categorias.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-2">
                      {product.stock.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-28">
                          {product.stock
                            .slice(0, 3)
                            .map(({ id, cantidad, sucursal }) => (
                              <div
                                key={id}
                                className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-zinc-900"
                              >
                                <span className="font-semibold">
                                  {sucursal.nombre.slice(0, 2).toUpperCase()}
                                </span>
                                <span className="font-bold">{cantidad}</span>
                              </div>
                            ))}
                          {product.stock.length > 3 && (
                            <div className="text-[10px] text-muted-foreground">
                              +{product.stock.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center text-[10px] text-gray-500">
                          <Ban className="h-3 w-3 mr-1" />
                          N/A
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-2 text-sm">
                      {product.stockThreshold?.stockMinimo ?? "N/A"}
                    </TableCell>

                    <TableCell className="py-2">
                      <div className="space-y-0.5 max-w-24">
                        {product.precios.slice(0, 2).map((precio, idx) => (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <div className="text-xs font-medium cursor-pointer truncate">
                                {formattMonedaGT(precio.precio)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                <p>
                                  <b>Orden:</b> {precio.orden}
                                </p>
                                <p>
                                  <b>Precio:</b>{" "}
                                  {formattMonedaGT(precio.precio)}
                                </p>
                                <p>
                                  <b>Rol:</b> {precio.rol}
                                </p>
                                <p>
                                  <b>Tipo:</b> {precio.tipo}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {product.precios.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">
                            +{product.precios.length - 2} más
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-2">
                      {stock.length === 0 ? (
                        <div className="text-[10px] flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Sin stock
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {visibles.map((s) => (
                            <Link
                              key={s.id}
                              to={`/stock-edicion/${s.id}`}
                              className="text-[10px] block hover:underline hover:text-blue-500"
                            >
                              {formatearFecha(s.fechaIngreso)}
                            </Link>
                          ))}

                          {restantes.length > 0 && (
                            <div className="text-[10px] text-muted-foreground">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="link"
                                    className="h-auto p-0 text-[10px]"
                                  >
                                    <span className="text-black dark:text-white font-semibold hover:underline">
                                      +{restantes.length}
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                  className="w-56"
                                  align="center"
                                  sideOffset={4}
                                >
                                  <DropdownMenuLabel className="text-center">
                                    Lista de entradas
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />

                                  {/* Usa Group + Item (no RadioGroup) */}
                                  <DropdownMenuGroup>
                                    {restantes.map((s) => (
                                      <DropdownMenuItem
                                        key={s.id}
                                        asChild
                                        className="justify-center"
                                      >
                                        <Link
                                          to={`/stock-edicion/${s.id}`}
                                          className="w-full text-center text-xs hover:underline hover:text-blue-500 hover:cursor-pointer"
                                        >
                                          {formatearFecha(s.fechaIngreso)}
                                        </Link>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-2">
                      {product.stock.length > 0 ? (
                        <div className="space-y-0.5">
                          {product.stock.slice(0, 2).map((stock, index) => {
                            const fechaVencimiento = new Date(
                              stock.fechaVencimiento
                            );
                            const hoy = new Date();
                            const estaVencido =
                              stock.fechaVencimiento &&
                              fechaVencimiento.setHours(23, 59, 59, 999) <=
                                hoy.getTime();
                            const diasRestantes = stock.fechaVencimiento
                              ? Math.ceil(
                                  (fechaVencimiento.getTime() - hoy.getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              : null;

                            return (
                              <div key={index}>
                                {stock.fechaVencimiento ? (
                                  estaVencido ? (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px] px-1 py-0 h-4"
                                    >
                                      <Clock className="h-2 w-2 mr-0.5" />
                                      Expirado
                                    </Badge>
                                  ) : (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant={
                                            diasRestantes && diasRestantes < 30
                                              ? "outline"
                                              : "secondary"
                                          }
                                          className={`text-[10px] px-1 py-0 h-4 ${
                                            diasRestantes && diasRestantes < 30
                                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                              : ""
                                          }`}
                                        >
                                          <Calendar className="h-2 w-2 mr-0.5" />
                                          {formatearFecha(
                                            stock.fechaVencimiento
                                          ).slice(0, 5)}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-xs">
                                          <p>
                                            {formatearFecha(
                                              stock.fechaVencimiento
                                            )}
                                          </p>
                                          {diasRestantes && (
                                            <p>
                                              {diasRestantes} días restantes
                                            </p>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1 py-0 h-4 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                  >
                                    <InfinityIcon className="h-2 w-2 mr-0.5" />
                                    N/A
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                          {product.stock.length > 2 && (
                            <div className="text-[10px] text-muted-foreground">
                              +{product.stock.length - 2}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center text-[10px]">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Sin stock
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-2">
                      {product && product.stock && product.stock.length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[10px] bg-transparent"
                            >
                              <MapPin className="h-2 w-2 mr-0.5" />
                              Ver
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64">
                            <div className="space-y-2">
                              <h2 className="font-medium text-xs flex items-center">
                                <Building2 className="h-3 w-3 mr-1" />
                                Distribución por Sucursal
                              </h2>
                              <Separator />
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {product.stock
                                  .reduce(
                                    (
                                      acc: {
                                        sucursal: { nombre: string };
                                        cantidad: number;
                                      }[],
                                      stock: {
                                        sucursal: { nombre: string };
                                        cantidad: number;
                                      }
                                    ) => {
                                      const existingStock = acc.find(
                                        (s) =>
                                          s.sucursal.nombre ===
                                          stock.sucursal.nombre
                                      );
                                      if (existingStock) {
                                        existingStock.cantidad +=
                                          stock.cantidad;
                                      } else {
                                        acc.push({ ...stock });
                                      }
                                      return acc;
                                    },
                                    []
                                  )
                                  .map((stock) => (
                                    <div
                                      key={stock.sucursal.nombre}
                                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/40"
                                    >
                                      <div className="flex items-center">
                                        <Building className="h-4 w-4 mr-2" />
                                        <span className="text-xs">
                                          {stock.sucursal.nombre}
                                        </span>
                                      </div>
                                      <Badge variant="secondary">
                                        {stock.cantidad} Uds
                                      </Badge>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-[10px] px-1 py-0 h-4 bg-muted text-muted-foreground">
                          No asignado
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-2">
                      <div className="flex items-center space-x-1">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full"
                              aria-label="Ver detalles"
                            >
                              <Eye className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-72">
                            <div className="flex justify-between">
                              <h4 className="font-semibold text-sm">
                                Detalles del producto
                              </h4>
                              <Badge variant="outline" className="text-[10px]">
                                {product.codigoProducto || "Sin código"}
                              </Badge>
                            </div>
                            <Separator className="my-2" />
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                {product.descripcion ||
                                  "No hay descripción disponible"}
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>

                        <Link
                          to={`/editar-producto/${product.id}`}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-6 w-6 p-0"
                          aria-label="Editar producto"
                        >
                          <Edit className="h-3 w-3 text-blue-500" />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
      {/* MAPEO DE PRODUCTOS EN LA TABLA */}

      <div className="flex items-center justify-center py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button onClick={() => onPageChange(1)}>Primero</Button>
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </PaginationPrevious>
            </PaginationItem>

            {/* Sistema de truncado */}
            {currentPage > 3 && (
              <>
                <PaginationItem>
                  <PaginationLink onClick={() => onPageChange(1)}>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <span className="text-muted-foreground">...</span>
                </PaginationItem>
              </>
            )}

            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              if (
                page === currentPage ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={index}>
                    <PaginationLink
                      onClick={() => onPageChange(page)}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return null;
            })}

            {currentPage < totalPages - 2 && (
              <>
                <PaginationItem>
                  <span className="text-muted-foreground">...</span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => onPageChange(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
              >
                <ChevronRight className="h-4 w-4" />
              </PaginationNext>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant={"destructive"}
                onClick={() => onPageChange(totalPages)}
              >
                Último
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      <Dialog open={openCategory} onOpenChange={setOpenCategory}>
        <DialogContent className="w-full max-w-2xl h-[90vh] overflow-auto">
          <CreateCategory
            categories={categorias}
            onCreateCategory={createCategory}
            onDeleteCategory={deleteCategory}
            onUpdateCategory={updateOneCategory}
            loadInventoryData={loadInventoryData}
            setOpenCategory={setOpenCategory}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
