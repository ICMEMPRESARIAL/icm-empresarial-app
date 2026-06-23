import Link from "next/link";
import { MessageStatusBadge } from "@/components/buzon/MessageStatusBadge";
import { MessageTypeBadge } from "@/components/buzon/MessageTypeBadge";
import type { CorrespondenciaListItem } from "@/lib/buzon/types";

type MailListItemProps = {
  item: CorrespondenciaListItem;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function MailListItem({ item }: MailListItemProps) {
  return (
    <Link
      className="grid gap-3 border-b border-border bg-white px-4 py-4 transition hover:bg-surface md:grid-cols-[1.2fr_1fr_auto]"
      href={`/buzon/${item.id}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <MessageTypeBadge tipo={item.tipo} />
          <MessageStatusBadge estado={item.estado} reportado={item.reportado} />
        </div>
        <h2 className="mt-2 truncate text-sm font-semibold text-ink">
          {item.asunto}
        </h2>
        <p className="mt-1 line-clamp-1 text-sm text-muted">
          {item.contenido}
        </p>
      </div>

      <div className="min-w-0 text-sm text-muted">
        <p className="truncate">
          <span className="font-medium text-ink">De:</span>{" "}
          {item.remitente?.nombre ?? "Sin remitente"}
        </p>
        <p className="mt-1 truncate">
          <span className="font-medium text-ink">Para:</span>{" "}
          {item.destinatario?.nombre ?? "Sin destinatario"}
        </p>
      </div>

      <time className="text-sm text-muted" dateTime={item.created_at}>
        {formatDate(item.created_at)}
      </time>
    </Link>
  );
}
