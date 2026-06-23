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
      <div className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-muted">
        No hay correspondencia para este filtro.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      {items.map((item) => (
        <AdminCorrespondenciaListItem item={item} key={item.id} />
      ))}
    </section>
  );
}
