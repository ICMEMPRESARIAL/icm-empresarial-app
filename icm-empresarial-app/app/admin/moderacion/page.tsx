import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { requireAuth } from "@/lib/auth/require-auth";
import { getModerationIncidents } from "@/lib/admin/moderacion/queries";

function companyName(
  value: { nombre: string; nombre_comercial: string | null } | null
) {
  return value?.nombre_comercial ?? value?.nombre ?? "Sin entidad";
}

export default async function AdminModeracionPage() {
  const { profile } = await requireAuth();
  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  const incidents = await getModerationIncidents();

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section>
          <p className="text-sm font-medium text-brand">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Moderación del buzón</h1>
          <p className="mt-2 text-sm text-muted">
            Mensajes bloqueados automáticamente antes de llegar al destinatario.
          </p>
        </section>

        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Remitente</th>
                  <th className="px-4 py-3">Destinatario</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Contenido detectado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {new Date(incident.created_at).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {companyName(incident.empresa)}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {companyName(incident.destinatario)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {incident.tipo === "respuesta" ? "Respuesta" : "Nuevo mensaje"}
                    </td>
                    <td className="max-w-xl px-4 py-3 text-red-800">
                      {incident.contenido_excerpt ?? "Contenido no disponible"}
                    </td>
                  </tr>
                ))}
                {incidents.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted" colSpan={5}>
                      No hay incidentes de moderación registrados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
