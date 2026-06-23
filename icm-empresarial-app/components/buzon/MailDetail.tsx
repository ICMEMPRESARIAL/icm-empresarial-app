import { archiveCorrespondenciaAction, reportCorrespondenciaAction } from "@/lib/buzon/actions";
import { MessageStatusBadge } from "@/components/buzon/MessageStatusBadge";
import { MessageTypeBadge } from "@/components/buzon/MessageTypeBadge";
import { ReplyForm } from "@/components/buzon/ReplyForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";
import type {
  CorrespondenciaDetail,
  CorrespondenciaRespuesta
} from "@/lib/buzon/types";

type MailDetailProps = {
  mensaje: CorrespondenciaDetail;
  profile: ProfileWithEmpresa;
  respuestas: CorrespondenciaRespuesta[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function canReply(profile: ProfileWithEmpresa, mensaje: CorrespondenciaDetail) {
  return (
    profile.rol === "profesora_admin" ||
    (Boolean(profile.empresa_id) &&
      (profile.empresa_id === mensaje.remitente_empresa_id ||
        profile.empresa_id === mensaje.destinatario_empresa_id))
  );
}

export function MailDetail({
  mensaje,
  profile,
  respuestas
}: MailDetailProps) {
  const showReplyForm = canReply(profile, mensaje) && Boolean(profile.empresa_id);
  const showAdminReplyNotice =
    profile.rol === "profesora_admin" && !profile.empresa_id;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <MessageTypeBadge tipo={mensaje.tipo} />
              <MessageStatusBadge
                estado={mensaje.estado}
                reportado={mensaje.reportado}
              />
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-ink">
              {mensaje.asunto}
            </h1>
            <time
              className="mt-2 block text-sm text-muted"
              dateTime={mensaje.created_at}
            >
              {formatDate(mensaje.created_at)}
            </time>
          </div>

          <div className="flex flex-wrap gap-2">
            {mensaje.estado !== "archivado" ? (
              <form action={archiveCorrespondenciaAction}>
                <input
                  name="correspondencia_id"
                  type="hidden"
                  value={mensaje.id}
                />
                <Button type="submit" variant="secondary">
                  Archivar
                </Button>
              </form>
            ) : null}
            {profile.rol !== "profesora_admin" && !mensaje.reportado ? (
              <form action={reportCorrespondenciaAction}>
                <input
                  name="correspondencia_id"
                  type="hidden"
                  value={mensaje.id}
                />
                <Button type="submit" variant="secondary">
                  Reportar
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <dl className="grid gap-4 text-sm md:grid-cols-2">
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
            Todavía no hay respuestas.
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

      {showReplyForm ? <ReplyForm correspondenciaId={mensaje.id} /> : null}
      {showAdminReplyNotice ? (
        <Card>
          <p className="text-sm text-muted">
            La profesora administradora puede supervisar esta conversación. Para
            responder, el perfil debe tener una empresa u organismo asociado.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
