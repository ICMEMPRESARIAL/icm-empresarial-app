import { AppShell } from "@/components/layout/AppShell";
import { NuevoTramiteForm } from "@/components/tramites/NuevoTramiteForm";
import { Card } from "@/components/ui/Card";
import {
  getTiposTramite,
  getTiposTramiteByOrganismoSlug
} from "@/lib/tramites/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type NuevoTramitePageProps = {
  searchParams: Promise<{
    organismo?: string;
    tipo?: string;
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function NuevoTramitePage({
  searchParams
}: NuevoTramitePageProps) {
  const { profile } = await requireAuth();
  const params = await searchParams;
  const organismoSlug = getSearchValue(params.organismo);
  const tipoSlug = getSearchValue(params.tipo);
  const tipos =
    profile.estado === "activo"
      ? organismoSlug
        ? await getTiposTramiteByOrganismoSlug(organismoSlug)
        : await getTiposTramite()
      : [];

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
          <NuevoTramiteForm
            initialOrganismoSlug={organismoSlug}
            initialTipoSlug={tipoSlug}
            tipos={tipos}
          />
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
