import Link from "next/link";
import {
  archiveCorrespondenciaAction,
  reportCorrespondenciaAction
} from "@/lib/buzon/actions";
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

type ChatThreadProps = {
  mensaje: CorrespondenciaDetail;
  profile: ProfileWithEmpresa;
  respuestas: CorrespondenciaRespuesta[];
};

type BubbleProps = {
  contenido: string;
  empresaNombre: string;
  fecha: string;
  propio: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
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

function ChatBubble({ contenido, empresaNombre, fecha, propio }: BubbleProps) {
  return (
    <div className={propio ? "flex justify-end" : "flex justify-start"}>
      <article
        className={[
          "max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[72%]",
          propio
            ? "rounded-br-md bg-brand text-white"
            : "rounded-bl-md border border-border bg-white text-ink"
        ].join(" ")}
      >
        <p
          className={[
            "text-xs font-semibold",
            propio ? "text-white/80" : "text-muted"
          ].join(" ")}
        >
          {empresaNombre}
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6">{contenido}</p>
        <time
          className={[
            "mt-2 block text-right text-[11px]",
            propio ? "text-white/70" : "text-muted"
          ].join(" ")}
          dateTime={fecha}
        >
          {formatDate(fecha)}
        </time>
      </article>
    </div>
  );
}

export function ChatThread({
  mensaje,
  profile,
  respuestas
}: ChatThreadProps) {
  const isOriginalOwn = mensaje.remitente_empresa_id === profile.empresa_id;
  const showReplyForm =
    profile.estado === "activo" &&
    canReply(profile, mensaje) &&
    Boolean(profile.empresa_id);
  const showSuspendedNotice = profile.estado === "suspendido";
  const showAdminReplyNotice =
    profile.rol === "profesora_admin" &&
    profile.estado === "activo" &&
    !profile.empresa_id;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <MessageTypeBadge tipo={mensaje.tipo} />
              <MessageStatusBadge
                estado={mensaje.estado}
                reportado={mensaje.reportado}
              />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-ink sm:text-3xl">
              {mensaje.asunto}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {mensaje.remitente?.nombre ?? "Sin remitente"} a{" "}
              {mensaje.destinatario?.nombre ?? "Sin destinatario"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface"
              href="/buzon"
            >
              Volver al buzón
            </Link>
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

      <section className="rounded-xl border border-border bg-[#eef4f1] p-4 sm:p-6">
        <div className="space-y-4">
          <ChatBubble
            contenido={mensaje.contenido}
            empresaNombre={mensaje.remitente?.nombre ?? "Empresa"}
            fecha={mensaje.created_at}
            propio={isOriginalOwn}
          />

          {respuestas.map((respuesta) => (
            <ChatBubble
              contenido={respuesta.contenido}
              empresaNombre={respuesta.empresa?.nombre ?? "Empresa"}
              fecha={respuesta.created_at}
              key={respuesta.id}
              propio={respuesta.empresa_id === profile.empresa_id}
            />
          ))}
        </div>
      </section>

      {showSuspendedNotice ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-900">
            Tu usuario está suspendido. Podés consultar el contenido, pero no
            enviar mensajes.
          </p>
        </Card>
      ) : null}

      {showReplyForm ? <ReplyForm correspondenciaId={mensaje.id} /> : null}

      {showAdminReplyNotice ? (
        <Card>
          <p className="text-sm text-muted">
            La profesora administradora puede supervisar esta conversación. Para
            responder, el perfil debe estar asociado a un organismo interno.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
