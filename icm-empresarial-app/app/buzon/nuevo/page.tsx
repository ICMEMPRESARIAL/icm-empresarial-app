import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { NewMessageForm } from "@/components/buzon/NewMessageForm";
import { getDestinatariosDisponibles } from "@/lib/buzon/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function NuevoMensajePage() {
  const { profile } = await requireAuth();
  const destinatarios = profile.empresa_id
    ? await getDestinatariosDisponibles()
    : [];

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-brand">Buzón</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            Nuevo mensaje
          </h1>
          <p className="mt-2 text-sm text-muted">
            El remitente se obtiene automáticamente desde tu perfil. No hace
            falta elegir desde qué empresa escribís.
          </p>
        </section>

        {profile.estado === "suspendido" ? (
          <Card className="border-amber-200 bg-amber-50">
            <h2 className="text-lg font-semibold text-ink">
              Usuario suspendido
            </h2>
            <p className="mt-2 text-sm text-muted">
              Tu usuario está suspendido. Podés consultar el contenido, pero no
              enviar mensajes.
            </p>
          </Card>
        ) : profile.empresa_id ? (
          <NewMessageForm destinatarios={destinatarios} />
        ) : (
          <Card>
            <h2 className="text-lg font-semibold text-ink">
              No hay empresa asociada
            </h2>
            <p className="mt-2 text-sm text-muted">
              Para enviar correspondencia, el perfil debe estar vinculado a una
              empresa u organismo.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
