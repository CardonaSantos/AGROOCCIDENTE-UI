import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Icons (lucide)
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { place, ProveedorType } from "./ProveedorTypePage";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProviderViewDialog } from "./ProviderDialog";
import { ProviderEditDialog } from "./ProviderEditDialog";
import { Button } from "@/components/ui/button";

export function ProvidersTable({ providers }: { providers: ProveedorType[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter((p) =>
      [p.nombre, p.correo, p.telefono, p.ciudad, p.pais].some((v) =>
        (v || "").toLowerCase().includes(q)
      )
    );
  }, [providers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const data = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-semibold">Proveedores</h2>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, correo, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Wrapper para scroll horizontal en móvil */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Nombre</TableHead>
              <TableHead className="min-w-[200px]">Correo</TableHead>
              <TableHead className="min-w-[140px]">Teléfono</TableHead>
              <TableHead className="min-w-[160px]">Ubicación</TableHead>
              <TableHead className="min-w-[100px] text-center">
                Estado
              </TableHead>
              <TableHead className="min-w-[120px] text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/40">
                <TableCell className="font-medium">{p.nombre}</TableCell>
                <TableCell className="truncate max-w-[220px]">
                  {p.correo}
                </TableCell>
                <TableCell>{p.telefono}</TableCell>
                <TableCell className="truncate max-w-[180px]">
                  {place(p.pais, p.ciudad) || "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={p.activo ? "default" : "secondary"}>
                    {p.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <ProviderViewDialog provider={p} />
                  <ProviderEditDialog provider={p} />
                </TableCell>
              </TableRow>
            ))}
            {!data.length && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No se encontraron proveedores.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div>
          Mostrando {filtered.length ? (page - 1) * pageSize + 1 : 0}–
          {Math.min(page * pageSize, filtered.length)} de {filtered.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
