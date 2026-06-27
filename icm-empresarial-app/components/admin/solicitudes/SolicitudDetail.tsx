import Link from "next/link";
import {
  approveSolicitudAction,
  rejectSolicitudAction
} from "@/lib/admin/solicitudes/actions";
import { SolicitudStatusBadge } from "@/components/admin/solicitudes/SolicitudStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SolicitudRegistro } from "@/lib/admin/solicitudes/queries";

type SolicitudDetailProps = {
  solicitud: SolicitudRegistro;
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

function DetailItem({
  label,
  value
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-ink">{label}</dt>
      <dd className="mt-1 text-sm text-muted">{value || "Sin informar"}</dd>
    </div>
  );
}

export function SolicitudDetail({ solicitud }: SolicitudDetailProps) {
  const isPending = solicitud.estado === "pendiente";

  return (
    <div className="space-y-6">
      <Card>
        <Link
          className="text-sm font-medium text-brand hover:underline"
          href="/admin/solicitudes"
        >
          Volver a solicitudes
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <SolicitudStatusBadge estado={solicitud.estado} />
              <span className="rounded-md bg-surface px-2 py-1 text-xs font-medium text-muted">
                {solicitud.figura_legal}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-ink">
              {solicitud.nombre_entidad}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Solicitada por {solicitud.nombre_alumno} el{" "}
              {formatDate(solicitud.created_at)}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Datos cargados</h2>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          <DetailItem label="Alumno" value={solicitud.nombre_alumno} />
          <DetailItem label="Email" value={solicitud.email} />
          <DetailItem label="Curso" value={solicitud.curso} />
          <DetailItem label="Teléfono" value={solicitud.telefono} />
          <DetailItem label="Tipo de entidad" value={solicitud.tipo_entidad} />
          <DetailItem label="Figura legal" value={solicitud.figura_legal} />
          <DetailItem label="Rubro / área" value={solicitud.rubro} />
          <DetailItem label="Descripción" value={solicitud.descripcion} />
          <DetailItem label="Socio mayor" value={solicitud.socio_mayor} />
          <DetailItem label="Responsable" value={solicitud.responsable} />
          <DetailItem
            label="Cargo responsable"
            value={solicitud.cargo_responsable}
          />
          <DetailItem label="CUIT simulado" value={solicitud.cuit_simulado} />
          <DetailItem label="Domicilio" value={solicitud.domicilio} />
          <DetailItem
            label="Actividad principal"
            value={solicitud.actividad_principal}
          />
          <DetailItem
            label="Observaciones admin"
            value={solicitud.observaciones_admin}
          />
          <DetailItem label="Revisado" value={formatDate(solicitud.revisado_at)} />
        </dl>
      </Card>

      {isPending ? (
        <Card>
          <h2 className="text-lg font-semibold text-ink">Revisión docente</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <form action={approveSolicitudAction} className="space-y-3">
              <input name="solicitud_id" type="hidden" value={solicitud.id} />
              <label className="block text-sm font-medium text-ink">
                Observaciones
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  name="observaciones_admin"
                />
              </label>
              <Button type="submit">Aprobar y activar usuario</Button>
            </form>

            <form action={rejectSolicitudAction} className="space-y-3">
              <input name="solicitud_id" type="hidden" value={solicitud.id} />
              <label className="block text-sm font-medium text-ink">
                Motivo u observaciones
                <textarea
                  className="mt-2 min-h-24 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  name="observaciones_admin"
                />
              </label>
              <Button type="submit" variant="secondary">
                Rechazar solicitud
              </Button>
            </form>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
