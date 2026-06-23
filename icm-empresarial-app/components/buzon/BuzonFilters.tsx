import Link from "next/link";
import type { BuzonFilter } from "@/lib/buzon/types";

type BuzonFiltersProps = {
  activeFilter: BuzonFilter;
};

const filters: Array<{ label: string; value: BuzonFilter }> = [
  { label: "Recibidos", value: "recibidos" },
  { label: "Enviados", value: "enviados" },
  { label: "Archivados", value: "archivados" },
  { label: "Todos", value: "todos" }
];

export function BuzonFilters({ activeFilter }: BuzonFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Link
          className={[
            "rounded-md border px-3 py-2 text-sm font-medium transition",
            filter.value === activeFilter
              ? "border-brand bg-brand text-white"
              : "border-border bg-white text-ink hover:bg-surface"
          ].join(" ")}
          href={`/buzon?filter=${filter.value}`}
          key={filter.value}
        >
          {filter.label}
        </Link>
      ))}
    </div>
  );
}
