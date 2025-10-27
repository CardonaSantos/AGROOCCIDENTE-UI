import { ReusableSelect } from "@/utils/components/ReactSelectComponent/ReusableSelect";
import { QueryTable } from "../interfaces/querytable";
import { TipoPresentacion } from "@/Pages/newCreateProduct/interfaces/DomainProdPressTypes";
import { CategoriaWithCount } from "@/Pages/Categorias/CategoriasMainPage";

/** Preset: multi-select que crece y no lo tapa el header sticky */
const growMultiSelectProps = {
  isSearchable: true,
  closeMenuOnSelect: false,
  menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
  menuPosition: "fixed",
  menuShouldScrollIntoView: false,
  styles: {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    control: (base: any) => ({
      ...base,
      minHeight: 36,
      height: "auto",
      alignItems: "flex-start",
      paddingTop: 2,
      paddingBottom: 2,
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: "2px 8px",
      display: "flex",
      flexWrap: "wrap",
      rowGap: 4,
      columnGap: 4,
      maxHeight: 72, // ~2 filas (ajusta si quieres)
      overflowY: "auto",
    }),
    indicatorsContainer: (b: any) => ({ ...b, height: "auto" }),
    multiValue: (b: any) => ({ ...b, margin: 0 }),
    multiValueLabel: (b: any) => ({
      ...b,
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      maxWidth: 140,
    }),
    input: (b: any) => ({ ...b, margin: 0, padding: 0 }),
  },
} as const;

interface FilterProps {
  handleSelectCat: (ids: number[]) => void;
  cats: CategoriaWithCount[];
  searchQuery: QueryTable;
  tiposPresentacion: TipoPresentacion[];
  handleSelecTiposEmpaque: (ids: number[]) => void;
}

export function FiltersSection({
  handleSelectCat,
  cats,
  searchQuery,
  handleSelecTiposEmpaque,
  tiposPresentacion,
}: FilterProps) {
  const selectedCats = cats.filter((c) =>
    searchQuery.categorias.includes(c.id)
  );
  const selectedTipos = tiposPresentacion.filter((t) =>
    searchQuery.tiposPresentacion.includes(t.id)
  );

  return (
    <>
      {/* Categorías */}
      <div className="min-w-0 grid gap-1">
        <label className="text-xs">Categorías</label>
        <ReusableSelect<CategoriaWithCount>
          isMulti
          isClearable
          items={cats}
          getValue={(c) => c.id}
          getLabel={(c) => `${c.nombre} (relacionados:${c.productosCount})`}
          value={selectedCats}
          onChange={(arr) => handleSelectCat(arr.map((c) => c.id))}
          placeholder="Seleccione categorías"
          selectProps={growMultiSelectProps}
        />
      </div>

      {/* Tipos Empaque */}
      <div className="min-w-0 grid gap-1">
        <label className="text-xs">Tipos Empaque</label>
        <ReusableSelect<TipoPresentacion>
          isMulti
          isClearable
          items={tiposPresentacion}
          getValue={(t) => t.id}
          getLabel={(t) => `${t.nombre} (relacionados:${t.productos ?? 0})`}
          value={selectedTipos}
          onChange={(arr) => handleSelecTiposEmpaque(arr.map((t) => t.id))}
          placeholder="Tipos Empaque"
          selectProps={growMultiSelectProps}
        />
      </div>
    </>
  );
}

export default FiltersSection;
