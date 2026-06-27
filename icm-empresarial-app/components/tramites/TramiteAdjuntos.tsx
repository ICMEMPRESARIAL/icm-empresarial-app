import { addTramiteAdjuntoAction } from "@/lib/tramites/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TramiteAdjunto } from "@/lib/tramites/types";

type TramiteAdjuntosProps = {
  adjuntos: TramiteAdjunto[];
  canAttach: boolean;
  tramiteId: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function TramiteAdjuntos({
  adjuntos,
  canAttach,
  tramiteId
}: TramiteAdjuntosProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">Documentación</h2>
      <div className="mt-4 space-y-3">
        {adjuntos.length === 0 ? (
          <p className="text-sm text-muted">No hay documentación adjunta.</p>
        ) : (
          adjuntos.map((adjunto) => (
            <article
              className="rounded-md border border-border bg-surface p-3"
              key={adjunto.id}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {adjunto.url ? (
                      <a
                        className="text-brand hover:underline"
                        href={adjunto.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {adjunto.nombre_archivo}
                      </a>
                    ) : (
                      adjunto.nombre_archivo
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {adjunto.actor_empresa?.nombre ?? "Usuario"}
                  </p>
                </div>
                <time className="text-xs text-muted" dateTime={adjunto.created_at}>
                  {formatDate(adjunto.created_at)}
                </time>
              </div>
              {adjunto.descripcion ? (
                <p className="mt-2 text-sm text-muted">{adjunto.descripcion}</p>
              ) : null}
            </article>
          ))
        )}
      </div>

      {canAttach ? (
        <form action={addTramiteAdjuntoAction} className="mt-5 grid gap-3 sm:grid-cols-2">
          <input name="tramite_id" type="hidden" value={tramiteId} />
          <label className="block text-sm font-medium text-ink">
            Nombre del archivo
            <input
              className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              name="nombre_archivo"
              required
              type="text"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            URL o referencia
            <input
              className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              name="url"
              type="url"
            />
          </label>
          <label className="block text-sm font-medium text-ink sm:col-span-2">
            Descripción
            <textarea
              className="mt-2 min-h-20 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              name="descripcion"
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit">Adjuntar documentación</Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}
