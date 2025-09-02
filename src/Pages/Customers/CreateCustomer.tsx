import { useEffect, useMemo, useState, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// icons
import {
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Save,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL as string;

// ================= Types =================
interface ClienteResponse {
  id: number;
  nombre: string;
  apellidos: string;
  telefono: string;
  dpi: string;
  direccion: string;
  observaciones?: string;
  actualizadoEn: string;
  _count: { compras: number };
}

interface FormData {
  nombre: string;
  apellidos?: string;
  telefono?: string;
  direccion?: string;
  dpi?: string;
  observaciones?: string;
}

interface FormDataEdit
  extends Required<Pick<ClienteResponse, "id" | "nombre">> {
  apellidos?: string;
  telefono?: string;
  direccion?: string;
  dpi?: string;
  observaciones?: string;
}

// ================ Edit Dialog ================
function EditCustomerDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onSave,
  onAskDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: FormDataEdit;
  onChange: (patch: Partial<FormDataEdit>) => void;
  onSave: () => void;
  onAskDelete: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            Editar cliente
          </DialogTitle>
          <DialogDescription className="text-center">
            Actualiza sólo los campos necesarios.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="edit-nombre">Nombre</Label>
            <Input
              id="edit-nombre"
              value={value.nombre}
              onChange={(e) => onChange({ nombre: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-apellidos">Apellidos</Label>
            <Input
              id="edit-apellidos"
              value={value.apellidos ?? ""}
              onChange={(e) => onChange({ apellidos: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-telefono">Teléfono</Label>
            <Input
              id="edit-telefono"
              value={value.telefono ?? ""}
              onChange={(e) => onChange({ telefono: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-dpi">DPI</Label>
            <Input
              id="edit-dpi"
              value={value.dpi ?? ""}
              onChange={(e) => onChange({ dpi: e.target.value })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="edit-direccion">Dirección</Label>
            <Input
              id="edit-direccion"
              value={value.direccion ?? ""}
              onChange={(e) => onChange({ direccion: e.target.value })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="edit-observaciones">Observaciones</Label>
            <Textarea
              id="edit-observaciones"
              value={value.observaciones ?? ""}
              onChange={(e) => onChange({ observaciones: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
          <Button variant="destructive" onClick={onAskDelete} className="gap-2">
            <Trash2 className="h-4 w-4" /> Eliminar
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" /> Cancelar
          </Button>
          <Button onClick={onSave} className="gap-2">
            <Save className="h-4 w-4" /> Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ================ Page ================
export default function ClientesPageRefactor() {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellidos: "",
    telefono: "",
    direccion: "",
    dpi: "",
    observaciones: "",
  });

  const [clientes, setClientes] = useState<ClienteResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState<"more" | "less">("more");

  // pagination
  const [page, setPage] = useState(1);
  const perPage = 15;

  const API = API_URL;

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const res = await axios.get<ClienteResponse[]>(
        `${API}/client/get-all-customers`
      );
      setClientes(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Error al conseguir clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const onCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/client`, formData);
      if (res.status === 201) {
        toast.success("Cliente creado");
        setFormData({
          nombre: "",
          apellidos: "",
          telefono: "",
          direccion: "",
          dpi: "",
          observaciones: "",
        });
        fetchClientes();
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al crear el cliente");
    }
  };

  // filtering + ordering + pagination (memoized)
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.apellidos ?? "").toLowerCase().includes(q) ||
        (c.direccion ?? "").toLowerCase().includes(q) ||
        (c.telefono ?? "").includes(q) ||
        (c.dpi ?? "").includes(q)
    );

    list.sort((a, b) =>
      orderBy === "more"
        ? b._count.compras - a._count.compras
        : a._count.compras - b._count.compras
    );
    return list;
  }, [clientes, search, orderBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentItems = filtered.slice((page - 1) * perPage, page * perPage);

  // edit state
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editData, setEditData] = useState<FormDataEdit>({ id: 0, nombre: "" });

  const handleEditClick = (c: ClienteResponse) => {
    setEditData({
      id: c.id,
      nombre: c.nombre,
      apellidos: c.apellidos || "",
      telefono: c.telefono || "",
      direccion: c.direccion || "",
      dpi: c.dpi || "",
      observaciones: c.observaciones || "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const res = await axios.patch(`${API}/client/${editData.id}`, editData);
      if (res.status === 200) {
        toast.success("Cliente actualizado");
        setEditOpen(false);
        fetchClientes();
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al actualizar el cliente");
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      const res = await axios.delete(`${API}/client/${editData.id}`);
      if (res.status === 200) {
        toast.success("Cliente eliminado");
        setConfirmDeleteOpen(false);
        setEditOpen(false);
        fetchClientes();
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al eliminar cliente");
    }
  };

  const onCreateChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Tabs defaultValue="crear" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="crear" className="gap-2">
          <UserPlus className="h-4 w-4" /> Crear
        </TabsTrigger>
        <TabsTrigger value="lista">Clientes</TabsTrigger>
      </TabsList>

      {/* Crear */}
      <TabsContent value="crear">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Crear cliente</CardTitle>
            <CardDescription>
              Ingresa los datos básicos. Sólo el nombre es obligatorio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onCreateSubmit}
              className="grid gap-4 max-w-2xl mx-auto"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={onCreateChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="apellidos">Apellidos</Label>
                  <Input
                    id="apellidos"
                    name="apellidos"
                    value={formData.apellidos ?? ""}
                    onChange={onCreateChange}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="dpi">DPI</Label>
                  <Input
                    id="dpi"
                    name="dpi"
                    value={formData.dpi ?? ""}
                    onChange={onCreateChange}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono ?? ""}
                    onChange={onCreateChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion ?? ""}
                  onChange={onCreateChange}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  name="observaciones"
                  value={formData.observaciones ?? ""}
                  onChange={onCreateChange}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="min-w-40">
                  Guardar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Lista */}
      <TabsContent value="lista">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Busca, ordena y edita.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, apellidos, DPI, teléfono o dirección"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={orderBy}
                onValueChange={(v) => setOrderBy(v as "more" | "less")}
              >
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="Orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="more">Más compras primero</SelectItem>
                  <SelectItem value="less">Menos compras primero</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">No.</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Apellidos</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>DPI</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead className="text-right">Compras</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Cargando...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && currentItems.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Sin resultados
                      </TableCell>
                    </TableRow>
                  )}
                  {currentItems.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.id}</TableCell>
                      <TableCell>{c.nombre || "—"}</TableCell>
                      <TableCell>{c.apellidos || "—"}</TableCell>
                      <TableCell>{c.telefono || "—"}</TableCell>
                      <TableCell>{c.dpi || "—"}</TableCell>
                      <TableCell>{c.direccion || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Link to={`/cliente-historial-compras/${c.id}`}>
                          <Button variant="outline">
                            {c._count?.compras ?? 0}
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(c)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>Clientes disponibles</TableCaption>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </PaginationPrevious>
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 || p === totalPages || Math.abs(p - page) <= 1
                    )
                    .map((p, idx, arr) => (
                      <PaginationItem key={p}>
                        {idx > 0 && p - (arr[idx - 1] as number) > 1 ? (
                          <span className="px-2">…</span>
                        ) : null}
                        <PaginationLink
                          isActive={p === page}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
          <CardFooter />
        </Card>
      </TabsContent>

      {/* Edit dialog */}
      <EditCustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        value={editData}
        onChange={(patch) => setEditData((prev) => ({ ...prev, ...patch }))}
        onSave={handleSaveEdit}
        onAskDelete={() => setConfirmDeleteOpen(true)}
      />

      {/* Confirm delete */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Esta acción es permanente. Se eliminará el cliente y sus registros
              asociados.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Sí, eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
