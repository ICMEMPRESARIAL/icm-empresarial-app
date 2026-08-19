import { notFound } from "next/navigation";
import { EmpresaSiteLayout } from "@/components/empresa-site/EmpresaSiteLayout";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmpresaProductoCard } from "@/components/empresa-site/EmpresaProductoCard";
import { EmpresaLegalChecklist } from "@/components/empresa-site/EmpresaLegalChecklist";
import { getEmpresaSiteDataBySlug } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";
import { canAccessOperationalRoutes } from "@/lib/auth/route-access";

type EmpresaSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EmpresaSlugPage({ params }: EmpresaSlugPageProps) {
  const { profile } = await requireAuth();
  const { slug } = await params;
  const data = await getEmpresaSiteDataBySlug(slug, profile);

  if (!data) {
    notFound();
  }

  const destacados = data.productos.slice(0, 3);
  const sitioWeb = data.empresa.sitio_web ?? data.empresa.sitio_externo;
  const sitioHref = sitioWeb
    ? sitioWeb.startsWith("http://") || sitioWeb.startsWith("https://")
      ? sitioWeb
      : `https://${sitioWeb}`
    : null;

  return (
    <AppShell profile={profile}>
      <EmpresaSiteLayout
        active="inicio"
        empresa={data.empresa}
        showOperationalActions={canAccessOperationalRoutes(profile)}
        web={data.web}
      >
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <SectionCard title="Inicio">
            <p className="whitespace-pre-line text-sm leading-7 text-muted">
              {data.web?.descripcion_inicio ??
                data.empresa.descripcion ??
                "Esta empresa todavía está preparando su presentación interna."}
            </p>
          </SectionCard>
          <SectionCard title="Datos clave">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-ink">Rubro</dt>
                <dd className="mt-1 text-muted">
                  {data.empresa.rubro ?? "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Actividad principal</dt>
                <dd className="mt-1 text-muted">
                  {data.empresa.actividad_principal ?? "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Responsable</dt>
                <dd className="mt-1 text-muted">
                  {data.empresa.responsable ?? "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Sitio web</dt>
                <dd className="mt-1 text-muted">
                  {sitioHref ? (
                    <a
                      className="font-medium text-brand hover:underline"
                      href={sitioHref}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {sitioWeb}
                    </a>
                  ) : (
                    "Pendiente"
                  )}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>

        {canAccessOperationalRoutes(profile) ? (
          <SectionCard title="Productos y servicios destacados">
            {destacados.length === 0 ? (
              <p className="text-sm text-muted">
                Esta empresa todavía no publicó productos o servicios.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {destacados.map((producto) => (
                  <EmpresaProductoCard
                    empresaSlug={data.empresa.slug}
                    key={producto.id}
                    producto={producto}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        ) : null}

        {canAccessOperationalRoutes(profile) ? (
          <SectionCard title="Información legal">
            <EmpresaLegalChecklist documentos={data.documentos} />
          </SectionCard>
        ) : null}
      </EmpresaSiteLayout>
    </AppShell>
  );
}
