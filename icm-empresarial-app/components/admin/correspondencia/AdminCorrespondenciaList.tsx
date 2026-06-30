import { AdminCorrespondenciaListItem } from "@/components/admin/correspondencia/AdminCorrespondenciaListItem";
import type { CorrespondenciaListItem } from "@/lib/buzon/types";

type AdminCorrespondenciaListProps = {
  items: CorrespondenciaListItem[];
};

export function AdminCorrespondenciaList({
  items
}: AdminCorrespondenciaListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
        <h2 className="text-base font-semibold text-ink">
          No hay correspondencia para este filtro
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Probá cambiar el filtro o limpiar la búsqueda.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {items.map((item) => (
        <AdminCorrespondenciaListItem item={item} key={item.id} />
      ))}
    </section>
  );
}
