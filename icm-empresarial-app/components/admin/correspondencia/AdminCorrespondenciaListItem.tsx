import Link from "next/link";
import { MessageStatusBadge } from "@/components/buzon/MessageStatusBadge";
import { MessageTypeBadge } from "@/components/buzon/MessageTypeBadge";
import { Avatar } from "@/components/ui/Avatar";
import type { CorrespondenciaListItem, EmpresaMini } from "@/lib/buzon/types";

type AdminCorrespondenciaListItemProps = {
  item: CorrespondenciaListItem;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function empresaName(empresa: EmpresaMini | null) {
  return empresa?.nombre_comercial ?? empresa?.nombre ?? "Sin empresa";
}

export function AdminCorrespondenciaListItem({
  item
}: AdminCorrespondenciaListItemProps) {
  const remitenteName = empresaName(item.remitente);
  const destinatarioName = empresaName(item.destinatario);

  return (
    <Link
      className={[
        "grid gap-4 border-b border-border px-4 py-4 transition hover:bg-surface lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]",
        item.reportado ? "bg-red-50/60" : "bg-white",
        item.oculto ? "opacity-75" : ""
      ].join(" ")}
      href={`/admin/correspondencia/${item.id}`}
    >
      <div className="flex min-w-0 gap-3">
        <Avatar
          alt={`Logo de ${remitenteName}`}
          color={item.remitente?.color_marca}
          name={remitenteName}
          src={item.remitente?.logo_url}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <MessageTypeBadge tipo={item.tipo} />
            <MessageStatusBadge
              estado={item.estado}
              reportado={item.reportado}
            />
            {item.oculto ? (
              <span className="inline-flex rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white">
                Oculto
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 truncate text-sm font-semibold text-ink">
            {item.asunto}
          </h2>
        </div>
      </div>

      <div className="min-w-0 text-sm text-muted">
        <p className="truncate">
          <span className="font-medium text-ink">De:</span> {remitenteName}
        </p>
        <p className="mt-1 truncate">
          <span className="font-medium text-ink">Para:</span>{" "}
          {destinatarioName}
        </p>
      </div>

      <time className="text-sm text-muted" dateTime={item.created_at}>
        {formatDate(item.created_at)}
      </time>
    </Link>
  );
}
