import { addTramiteComentarioAction } from "@/lib/tramites/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TramiteComentario } from "@/lib/tramites/types";

type TramiteCommentBoxProps = {
  canComment: boolean;
  comentarios: TramiteComentario[];
  tramiteId: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function TramiteCommentBox({
  canComment,
  comentarios,
  tramiteId
}: TramiteCommentBoxProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">Comentarios</h2>
      <div className="mt-4 space-y-3">
        {comentarios.length === 0 ? (
          <p className="text-sm text-muted">No hay comentarios todavía.</p>
        ) : (
          comentarios.map((comentario) => (
            <article
              className="rounded-md border border-border bg-surface p-3"
              key={comentario.id}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-ink">
                  {comentario.actor_empresa?.nombre ?? "Usuario"}
                </p>
                <time className="text-xs text-muted" dateTime={comentario.created_at}>
                  {formatDate(comentario.created_at)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
                {comentario.contenido}
              </p>
            </article>
          ))
        )}
      </div>

      {canComment ? (
        <form action={addTramiteComentarioAction} className="mt-5 space-y-3">
          <input name="tramite_id" type="hidden" value={tramiteId} />
          <label className="block text-sm font-medium text-ink">
            Nuevo comentario
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              minLength={3}
              name="contenido"
              required
            />
          </label>
          <Button type="submit">Agregar comentario</Button>
        </form>
      ) : null}
    </Card>
  );
}
