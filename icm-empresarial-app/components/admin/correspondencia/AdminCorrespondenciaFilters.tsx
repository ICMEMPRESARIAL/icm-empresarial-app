import Link from "next/link";
import type { AdminCorrespondenciaFilter } from "@/lib/admin/correspondencia/queries";

type AdminCorrespondenciaFiltersProps = {
  activeFilter: AdminCorrespondenciaFilter;
  search?: string;
};

const filters: Array<{ label: string; value: AdminCorrespondenciaFilter }> = [
  { label: "Todos", value: "todos" },
  { label: "Reportados", value: "reportados" },
  { label: "Ocultos", value: "ocultos" },
  { label: "Archivados", value: "archivados" },
  { label: "Enviados", value: "enviados" },
  { label: "Leídos", value: "leidos" },
  { label: "Respondidos", value: "respondidos" }
];

export function AdminCorrespondenciaFilters({
  activeFilter,
  search
}: AdminCorrespondenciaFiltersProps) {
  const query = search ? `&q=${encodeURIComponent(search)}` : "";

  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-white p-2 shadow-sm">
      {filters.map((filter) => (
        <Link
          className={[
            "rounded-xl border px-3 py-2 text-sm font-medium transition",
            filter.value === activeFilter
              ? "border-brand bg-brand text-white"
              : "border-border bg-white text-ink hover:bg-surface"
          ].join(" ")}
          href={`/admin/correspondencia?filter=${filter.value}${query}`}
          key={filter.value}
        >
          {filter.label}
        </Link>
      ))}
    </div>
  );
}
