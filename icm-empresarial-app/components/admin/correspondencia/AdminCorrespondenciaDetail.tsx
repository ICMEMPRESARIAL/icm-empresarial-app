import { MessageStatusBadge } from "@/components/buzon/MessageStatusBadge";
import { MessageTypeBadge } from "@/components/buzon/MessageTypeBadge";
import { AdminModerationActions } from "@/components/admin/correspondencia/AdminModerationActions";
import { Card } from "@/components/ui/Card";
import type { AuditLogItem } from "@/lib/admin/correspondencia/queries";
import type {
  CorrespondenciaDetail,
  CorrespondenciaRespuesta
} from "@/lib/buzon/types";

type AdminCorrespondenciaDetailProps = {
  auditoria: AuditLogItem[];
  mensaje: CorrespondenciaDetail;
  respuestas: CorrespondenciaRespuesta[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function AdminCorrespondenciaDetail({
  auditoria,
  mensaje,
  respuestas
}: AdminCorrespondenciaDetailProps) {
  return (
    <div className="space-y-6">
      <Card className={mensaje.reportado ? "border-red-200 bg-red-50/50" : ""}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <MessageTypeBadge tipo={mensaje.tipo} />
              <MessageStatusBadge
                estado={mensaje.estado}
                reportado={mensaje.reportado}
              />
              {mensaje.oculto ? (
                <span className="inline-flex rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white">
                  Oculto
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-ink">
              {mensaje.asunto}
            </h1>
          </div>
          <AdminModerationActions
            correspondenciaId={mensaje.id}
            oculto={mensaje.oculto}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Detalle</h2>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium text-ink">Remitente</dt>
            <dd className="mt-1 text-muted">
              {mensaje.remitente?.nombre ?? "Sin remitente"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Destinatario</dt>
            <dd className="mt-1 text-muted">
              {mensaje.destinatario?.nombre ?? "Sin destinatario"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Creado</dt>
            <dd className="mt-1 text-muted">{formatDate(mensaje.created_at)}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Leído</dt>
            <dd className="mt-1 text-muted">{formatDate(mensaje.read_at)}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Reportado</dt>
            <dd className="mt-1 text-muted">{mensaje.reportado ? "Sí" : "No"}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Oculto</dt>
            <dd className="mt-1 text-muted">{mensaje.oculto ? "Sí" : "No"}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Contenido</h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted">
          {mensaje.contenido}
        </p>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Respuestas</h2>
        {respuestas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-white p-6 text-sm text-muted">
            No hay respuestas registradas.
          </div>
        ) : (
          respuestas.map((respuesta) => (
            <Card key={respuesta.id}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-ink">
                  {respuesta.empresa?.nombre ?? "Empresa"}
                </p>
                <time
                  className="text-xs text-muted"
                  dateTime={respuesta.created_at}
                >
                  {formatDate(respuesta.created_at)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
                {respuesta.contenido}
              </p>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Auditoría relacionada</h2>
        {auditoria.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-white p-6 text-sm text-muted">
            No hay registros de auditoría asociados.
          </div>
        ) : (
          auditoria.map((log) => (
            <Card key={log.id}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-ink">{log.accion}</p>
                <time className="text-xs text-muted" dateTime={log.created_at}>
                  {formatDate(log.created_at)}
                </time>
              </div>
              <p className="mt-2 text-xs text-muted">
                Actor: {log.actor_id ?? "Sin actor"}
              </p>
              <pre className="mt-3 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white">
                {JSON.stringify(log.detalle, null, 2)}
              </pre>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
