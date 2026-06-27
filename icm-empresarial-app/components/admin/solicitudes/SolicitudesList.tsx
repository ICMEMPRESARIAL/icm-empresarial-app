import Link from "next/link";
import { SolicitudStatusBadge } from "@/components/admin/solicitudes/SolicitudStatusBadge";
import { Card } from "@/components/ui/Card";
import type { SolicitudRegistro } from "@/lib/admin/solicitudes/queries";

type SolicitudesListProps = {
  solicitudes: SolicitudRegistro[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function SolicitudesList({ solicitudes }: SolicitudesListProps) {
  if (solicitudes.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">No hay solicitudes registradas.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {solicitudes.map((solicitud) => (
        <Link
          className="block rounded-lg border border-border bg-white p-4 shadow-sm transition hover:border-brand/40 hover:shadow-md"
          href={`/admin/solicitudes/${solicitud.id}`}
          key={solicitud.id}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-ink">
                  {solicitud.nombre_entidad}
                </h2>
                <SolicitudStatusBadge estado={solicitud.estado} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {solicitud.nombre_alumno} · {solicitud.email}
              </p>
              <p className="mt-1 text-xs text-muted">
                {solicitud.tipo_entidad} · {solicitud.figura_legal}
                {solicitud.curso ? ` · ${solicitud.curso}` : ""}
              </p>
            </div>
            <time className="text-xs text-muted" dateTime={solicitud.created_at}>
              {formatDate(solicitud.created_at)}
            </time>
          </div>
        </Link>
      ))}
    </div>
  );
}
