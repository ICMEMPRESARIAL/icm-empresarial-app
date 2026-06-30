import { MessageStatusBadge } from "@/components/buzon/MessageStatusBadge";
import { MessageTypeBadge } from "@/components/buzon/MessageTypeBadge";
import { ReplyForm } from "@/components/buzon/ReplyForm";
import { suspendUserAction } from "@/lib/admin/usuarios/actions";
import { AdminModerationActions } from "@/components/admin/correspondencia/AdminModerationActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";
import type { AuditLogItem } from "@/lib/admin/correspondencia/queries";
import type {
  CorrespondenciaDetail,
  CorrespondenciaRespuesta
} from "@/lib/buzon/types";

type AdminCorrespondenciaDetailProps = {
  auditoria: AuditLogItem[];
  mensaje: CorrespondenciaDetail;
  profile: ProfileWithEmpresa;
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

function getAuditActorId(
  auditoria: AuditLogItem[],
  accion: string,
  detalleKey?: string,
  detalleValue?: string
) {
  const log = auditoria.find((item) => {
    if (item.accion !== accion) {
      return false;
    }

    if (!detalleKey || !detalleValue) {
      return true;
    }

    return item.detalle[detalleKey] === detalleValue;
  });

  return log?.actor_id ?? null;
}

function SuspendSenderForm({ profileId }: { profileId: string | null }) {
  if (!profileId) {
    return (
      <p className="mt-3 text-xs text-muted">
        No hay usuario emisor registrado en auditoría.
      </p>
    );
  }

  return (
    <form action={suspendUserAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <input name="profile_id" type="hidden" value={profileId} />
      <input
        className="h-10 min-w-0 flex-1 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
        name="motivo"
        placeholder="Motivo de suspensión"
        required
      />
      <Button type="submit" variant="secondary">
        Suspender usuario emisor
      </Button>
    </form>
  );
}

export function AdminCorrespondenciaDetail({
  auditoria,
  mensaje,
  profile,
  respuestas
}: AdminCorrespondenciaDetailProps) {
  const originalActorId = getAuditActorId(auditoria, "correspondencia_creada");
  const canAdminReply = profile.estado === "activo" && Boolean(profile.empresa_id);

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
        <p className="mt-2 text-xs text-muted">
          Usuario emisor: {originalActorId ?? "No disponible"}
        </p>
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted">
          {mensaje.contenido}
        </p>
        <SuspendSenderForm profileId={originalActorId} />
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Respuestas</h2>
        {respuestas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-white p-6 text-sm text-muted">
            No hay respuestas registradas.
          </div>
        ) : (
          respuestas.map((respuesta) => {
            const respuestaActorId = getAuditActorId(
              auditoria,
              "correspondencia_respondida",
              "respuesta_id",
              respuesta.id
            );

            return (
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
              <p className="mt-2 text-xs text-muted">
                Usuario emisor: {respuestaActorId ?? "No disponible"}
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
                {respuesta.contenido}
              </p>
              <SuspendSenderForm profileId={respuestaActorId} />
            </Card>
            );
          })
        )}
      </section>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Respuesta docente</h2>
        {canAdminReply ? (
          <div className="mt-4">
            <ReplyForm
              correspondenciaId={mensaje.id}
              redirectTo={`/admin/correspondencia/${mensaje.id}`}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Para responder desde administración, la cuenta profesora_admin debe
            estar asociada a un organismo interno, por ejemplo Administración ICM.
          </p>
        )}
      </Card>

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
