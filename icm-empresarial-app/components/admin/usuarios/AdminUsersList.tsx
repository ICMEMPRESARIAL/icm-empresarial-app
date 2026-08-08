import { UserModerationActions } from "@/components/admin/usuarios/UserModerationActions";
import { UserStatusBadge } from "@/components/admin/usuarios/UserStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { AdminUserItem } from "@/lib/admin/usuarios/queries";

type AdminUsersListProps = {
  users: AdminUserItem[];
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

function conductaLabel(value: AdminUserItem["conducta_estado"]) {
  const labels = {
    excelente: "Excelente",
    grave: "Grave",
    observado: "Observado",
    reincidente: "Reincidente",
    suspendido_previamente: "Suspendido previamente"
  };

  return labels[value];
}

function conductaTone(value: AdminUserItem["conducta_estado"]) {
  if (value === "excelente") return "green";
  if (value === "grave") return "red";
  if (value === "reincidente") return "orange";
  if (value === "observado") return "amber";
  return "blue";
}

export function AdminUsersList({ users }: AdminUsersListProps) {
  if (users.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">No hay usuarios registrados.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id}>
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">{user.nombre}</h2>
                <UserStatusBadge estado={user.estado} />
                <Badge tone={conductaTone(user.conducta_estado)}>
                  {conductaLabel(user.conducta_estado)}
                </Badge>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-ink">Email</dt>
                  <dd className="mt-1 text-muted">
                    {user.email ?? "No disponible"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Rol</dt>
                  <dd className="mt-1 text-muted">{user.rol}</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Entidad</dt>
                  <dd className="mt-1 text-muted">
                    {user.empresa_nombre ?? "Sin entidad asociada"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Creado</dt>
                  <dd className="mt-1 text-muted">{formatDate(user.created_at)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Suspensiones</dt>
                  <dd className="mt-1 text-muted">
                    {user.cantidad_suspensiones}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Última suspensión</dt>
                  <dd className="mt-1 text-muted">
                    {formatDate(user.ultima_suspension_at)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Suspendido hasta</dt>
                  <dd className="mt-1 text-muted">
                    {user.suspendido_hasta
                      ? formatDate(user.suspendido_hasta)
                      : "Sin fecha"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-ink">Motivo suspensión</dt>
                  <dd className="mt-1 text-muted">
                    {user.suspendido_motivo ?? "Sin motivo registrado"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-ink">Observación conducta</dt>
                  <dd className="mt-1 text-muted">
                    {user.conducta_observacion ?? "Sin observación"}
                  </dd>
                </div>
              </dl>
            </div>
            <UserModerationActions user={user} />
          </div>
        </Card>
      ))}
    </div>
  );
}
