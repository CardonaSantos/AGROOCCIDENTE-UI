import { ReusableSelect } from "@/utils/components/ReactSelectComponent/ReusableSelect";
import { Categorias } from "../interfaces.interface";
import { QueryTable } from "../interfaces/querytable";

interface FilterProps {
  handleSelectCat: (ids: number[]) => void;
  cats: Categorias[];
  searchQuery: QueryTable;
}

export function FiltersSection({
  handleSelectCat,
  cats,
  searchQuery,
}: FilterProps) {
  // 🔹 Derivamos las categorías actualmente seleccionadas (objetos completos)

  return (
    <div className="w-full max-w-sm">
      <ReusableSelect<Categorias>
        isMulti
        items={cats}
        getValue={(c) => c.id}
        getLabel={(c) => c.nombre}
        value={cats.filter((c) => searchQuery.categorias.includes(c.id))}
        onChange={(selected) => handleSelectCat(selected.map((c) => c.id))}
        placeholder="Seleccione categorías"
        selectProps={{
          menuPortalTarget: document.body,
          menuPosition: "fixed",
          styles: {
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            menu: (base) => ({ ...base, zIndex: 9999 }),
          },
        }}
      />
    </div>
  );
}

export default FiltersSection;
