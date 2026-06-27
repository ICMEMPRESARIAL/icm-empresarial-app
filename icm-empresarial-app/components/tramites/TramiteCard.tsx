import Link from "next/link";
import { TramiteStatusBadge } from "@/components/tramites/TramiteStatusBadge";
import type { TramiteListItem } from "@/lib/tramites/types";

type TramiteCardProps = {
  baseHref?: "/admin/tramites" | "/tramites";
  tramite: TramiteListItem;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function TramiteCard({
  baseHref = "/tramites",
  tramite
}: TramiteCardProps) {
  return (
    <Link
      className="block rounded-lg border border-border bg-white p-4 shadow-sm transition hover:border-brand/40 hover:shadow-md"
      href={`${baseHref}/${tramite.id}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-ink">
              {tramite.asunto}
            </h2>
            <TramiteStatusBadge estado={tramite.estado} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {tramite.tipo_tramite?.nombre ?? "Trámite"} ·{" "}
            {tramite.organismo?.nombre ?? "Organismo"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Solicitante: {tramite.solicitante?.nombre ?? "Sin solicitante"}
          </p>
        </div>
        <time className="text-xs text-muted" dateTime={tramite.created_at}>
          {formatDate(tramite.created_at)}
        </time>
      </div>
    </Link>
  );
}
