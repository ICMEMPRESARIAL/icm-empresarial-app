import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TramiteList } from "@/components/tramites/TramiteList";
import { Card } from "@/components/ui/Card";
import { getEmpresaBySlug } from "@/lib/empresas/queries";
import {
  getTiposTramiteByOrganismoSlug,
  getTramitesRecibidosForOrganismo
} from "@/lib/tramites/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type OrganismoTramitesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function OrganismoTramitesPage({
  params
}: OrganismoTramitesPageProps) {
  const { profile } = await requireAuth();
  const { slug } = await params;
  const organismo = await getEmpresaBySlug(slug, "organismo", profile);

  if (!organismo) {
    notFound();
  }

  const [tramites, tipos] = await Promise.all([
    getTramitesRecibidosForOrganismo(slug),
    getTiposTramiteByOrganismoSlug(slug)
  ]);

  const canSeeBandeja =
    profile.rol === "profesora_admin" || profile.empresa_id === organismo.id;

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section>
          <p className="text-sm font-medium text-brand">{organismo.nombre}</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            Trámites del organismo
          </h1>
          <p className="mt-2 text-sm text-muted">
            Catálogo interno de trámites y bandeja de expedientes recibidos.
          </p>
        </section>

        <Card>
          <h2 className="text-lg font-semibold text-ink">Trámites disponibles</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {tipos.map((tipo) => (
              <div
                className="rounded-md border border-border bg-surface p-3"
                key={tipo.id}
              >
                <p className="text-sm font-medium text-ink">{tipo.nombre}</p>
                <p className="mt-1 text-xs text-muted">
                  {tipo.descripcion ?? "Sin descripción"}
                </p>
              </div>
            ))}
          </div>
          <Link
            className="mt-4 inline-flex text-sm font-medium text-brand hover:underline"
            href="/tramites/nuevo"
          >
            Iniciar un trámite
          </Link>
        </Card>

        {canSeeBandeja ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink">
              Bandeja recibida
            </h2>
            <TramiteList tramites={tramites} />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
