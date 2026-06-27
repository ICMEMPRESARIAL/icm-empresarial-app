import { AppShell } from "@/components/layout/AppShell";
import { NuevoTramiteForm } from "@/components/tramites/NuevoTramiteForm";
import { Card } from "@/components/ui/Card";
import { getTiposTramite } from "@/lib/tramites/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function NuevoTramitePage() {
  const { profile } = await requireAuth();
  const tipos = profile.estado === "activo" ? await getTiposTramite() : [];

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section>
          <p className="text-sm font-medium text-brand">Trámites</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            Nuevo trámite
          </h1>
          <p className="mt-2 text-sm text-muted">
            Iniciá un trámite interno ante un organismo de la simulación.
          </p>
        </section>

        {profile.estado === "activo" && profile.empresa_id ? (
          <NuevoTramiteForm tipos={tipos} />
        ) : (
          <Card>
            <h2 className="text-lg font-semibold text-ink">
              No podés iniciar trámites
            </h2>
            <p className="mt-2 text-sm text-muted">
              La cuenta debe estar activa y asociada a una empresa u organismo.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
