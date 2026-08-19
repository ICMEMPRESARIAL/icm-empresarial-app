import { notFound } from "next/navigation";
import { EmpresaSiteLayout } from "@/components/empresa-site/EmpresaSiteLayout";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { getEmpresaSiteDataBySlug } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";
import { canAccessOperationalRoutes } from "@/lib/auth/route-access";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EmpresaContactoPage({ params }: PageProps) {
  const { profile } = await requireAuth();
  const { slug } = await params;
  const data = await getEmpresaSiteDataBySlug(slug, profile);

  if (!data) notFound();
  const sitioWeb = data.empresa.sitio_web ?? data.empresa.sitio_externo;
  const sitioHref = sitioWeb
    ? sitioWeb.startsWith("http://") || sitioWeb.startsWith("https://")
      ? sitioWeb
      : `https://${sitioWeb}`
    : null;

  return (
    <AppShell profile={profile}>
      <EmpresaSiteLayout
        active="contacto"
        empresa={data.empresa}
        showOperationalActions={canAccessOperationalRoutes(profile)}
        web={data.web}
      >
        <SectionCard title="Contacto interno">
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-ink">Email</dt>
              <dd className="mt-1 text-muted">
                {data.web?.contacto_email ?? data.empresa.contacto_email ?? "Pendiente"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Teléfono</dt>
              <dd className="mt-1 text-muted">
                {data.web?.contacto_telefono ??
                  data.empresa.contacto_telefono ??
                  "Pendiente"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Domicilio</dt>
              <dd className="mt-1 text-muted">
                {data.empresa.domicilio ?? "Pendiente"}
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
      </EmpresaSiteLayout>
    </AppShell>
  );
}
