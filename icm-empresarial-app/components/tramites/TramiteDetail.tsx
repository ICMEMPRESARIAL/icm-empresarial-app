import Link from "next/link";
import { TramiteActions } from "@/components/tramites/TramiteActions";
import { TramiteAdjuntos } from "@/components/tramites/TramiteAdjuntos";
import { TramiteCommentBox } from "@/components/tramites/TramiteCommentBox";
import { TramiteStatusBadge } from "@/components/tramites/TramiteStatusBadge";
import { TramiteTimeline } from "@/components/tramites/TramiteTimeline";
import { Card } from "@/components/ui/Card";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";
import type {
  TramiteAdjunto,
  TramiteComentario,
  TramiteDetail as TramiteDetailType,
  TramiteEvento
} from "@/lib/tramites/types";

type TramiteDetailProps = {
  adjuntos: TramiteAdjunto[];
  comentarios: TramiteComentario[];
  eventos: TramiteEvento[];
  profile: ProfileWithEmpresa;
  tramite: TramiteDetailType;
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

export function TramiteDetail({
  adjuntos,
  comentarios,
  eventos,
  profile,
  tramite
}: TramiteDetailProps) {
  const isAdmin = profile.rol === "profesora_admin";
  const isSolicitante = tramite.solicitante_empresa_id === profile.empresa_id;
  const isOrganismo = tramite.organismo_empresa_id === profile.empresa_id;
  const canManage = isAdmin || isOrganismo;
  const canInteract =
    profile.estado === "activo" && (isAdmin || isSolicitante || isOrganismo);

  return (
    <div className="space-y-6">
      <Card>
        <Link
          className="text-sm font-medium text-brand hover:underline"
          href="/tramites"
        >
          Volver a trámites
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <TramiteStatusBadge estado={tramite.estado} />
              {tramite.numero_expediente ? (
                <span className="rounded-md bg-surface px-2 py-1 text-xs font-medium text-muted">
                  Exp. {tramite.numero_expediente}
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-ink">
              {tramite.asunto}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {tramite.tipo_tramite?.nombre ?? "Trámite"} ante{" "}
              {tramite.organismo?.nombre ?? "Organismo"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Detalle</h2>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium text-ink">Solicitante</dt>
            <dd className="mt-1 text-muted">
              {tramite.solicitante?.nombre ?? "Sin solicitante"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Organismo</dt>
            <dd className="mt-1 text-muted">
              {tramite.organismo?.nombre ?? "Sin organismo"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Creado</dt>
            <dd className="mt-1 text-muted">{formatDate(tramite.created_at)}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Actualizado</dt>
            <dd className="mt-1 text-muted">{formatDate(tramite.updated_at)}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="font-medium text-ink">Descripción</dt>
            <dd className="mt-1 whitespace-pre-line text-muted">
              {tramite.descripcion}
            </dd>
          </div>
          {tramite.observacion_actual ? (
            <div className="md:col-span-2">
              <dt className="font-medium text-ink">Observación actual</dt>
              <dd className="mt-1 whitespace-pre-line text-muted">
                {tramite.observacion_actual}
              </dd>
            </div>
          ) : null}
        </dl>
      </Card>

      <TramiteActions canManage={canManage} tramite={tramite} />

      <Card>
        <h2 className="text-lg font-semibold text-ink">Seguimiento</h2>
        <div className="mt-5">
          <TramiteTimeline eventos={eventos} />
        </div>
      </Card>

      <TramiteAdjuntos
        adjuntos={adjuntos}
        canAttach={canInteract}
        tramiteId={tramite.id}
      />

      <TramiteCommentBox
        canComment={canInteract}
        comentarios={comentarios}
        tramiteId={tramite.id}
      />
    </div>
  );
}
