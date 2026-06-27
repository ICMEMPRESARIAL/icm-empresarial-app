import { tramiteEstadoLabels, type TramiteEvento } from "@/lib/tramites/types";

type TramiteTimelineProps = {
  eventos: TramiteEvento[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function TramiteTimeline({ eventos }: TramiteTimelineProps) {
  if (eventos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white p-6 text-sm text-muted">
        Todavía no hay eventos registrados.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {eventos.map((evento, index) => (
        <li className="flex gap-4" key={evento.id}>
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
              {index + 1}
            </span>
            {index < eventos.length - 1 ? (
              <span className="mt-2 h-full w-px flex-1 bg-border" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-white p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-ink">
                {evento.titulo || tramiteEstadoLabels[evento.estado]}
              </h3>
              <time className="text-xs text-muted" dateTime={evento.created_at}>
                {formatDate(evento.created_at)}
              </time>
            </div>
            <p className="mt-1 text-xs text-muted">
              {tramiteEstadoLabels[evento.estado]} ·{" "}
              {evento.actor_empresa?.nombre ?? "Sistema"}
            </p>
            {evento.descripcion ? (
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
                {evento.descripcion}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
