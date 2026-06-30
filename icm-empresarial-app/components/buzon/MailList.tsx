import { MailListItem } from "@/components/buzon/MailListItem";
import type { CorrespondenciaListItem } from "@/lib/buzon/types";

type MailListProps = {
  items: CorrespondenciaListItem[];
};

export function MailList({ items }: MailListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center shadow-sm">
        <h2 className="text-base font-semibold text-ink">
          No hay correspondencia para mostrar
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Los mensajes, pedidos y reclamos aparecerán acá según el filtro
          seleccionado.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {items.map((item) => (
        <MailListItem item={item} key={item.id} />
      ))}
    </section>
  );
}
