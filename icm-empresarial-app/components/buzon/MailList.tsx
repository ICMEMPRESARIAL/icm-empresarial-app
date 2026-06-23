import { MailListItem } from "@/components/buzon/MailListItem";
import type { CorrespondenciaListItem } from "@/lib/buzon/types";

type MailListProps = {
  items: CorrespondenciaListItem[];
};

export function MailList({ items }: MailListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-muted">
        No hay correspondencia para mostrar.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      {items.map((item) => (
        <MailListItem item={item} key={item.id} />
      ))}
    </section>
  );
}
