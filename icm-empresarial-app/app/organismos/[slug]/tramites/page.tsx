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
import { redirectEmpresaFromOperationalRoute } from "@/lib/auth/route-access";

type OrganismoTramitesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function OrganismoTramitesPage({
  params
}: OrganismoTramitesPageProps) {
  const { profile } = await requireAuth();
  redirectEmpresaFromOperationalRoute(profile);

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

        <Card className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                Trámites disponibles
              </h2>
              <p className="mt-1 text-sm text-muted">
                Iniciá un expediente interno directamente ante {organismo.nombre}.
              </p>
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white transition hover:bg-[#183f73]"
              href={`/tramites/nuevo?organismo=${encodeURIComponent(slug)}`}
            >
              Iniciar un trámite
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {tipos.map((tipo) => (
              <Link
                className="group flex h-full flex-col rounded-xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                href={`/tramites/nuevo?organismo=${encodeURIComponent(
                  slug
                )}&tipo=${encodeURIComponent(tipo.slug)}`}
                key={tipo.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {tipo.nombre}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {tipo.categoria ?? "Trámite general"}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Disponible
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-muted">
                  {tipo.descripcion ?? "Sin descripción cargada."}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                  <span className="text-xs text-muted">
                    {tipo.requiere_adjunto
                      ? "Puede requerir adjuntos"
                      : "Sin adjuntos iniciales"}
                  </span>
                  <span className="font-medium text-brand group-hover:underline">
                    Iniciar trámite
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {canSeeBandeja ? (
          <section className="space-y-4 border-t border-border pt-6">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                Expedientes recibidos
              </h2>
              <p className="mt-1 text-sm text-muted">
                Solicitudes enviadas por empresas a este organismo.
              </p>
            </div>
            <TramiteList tramites={tramites} />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
