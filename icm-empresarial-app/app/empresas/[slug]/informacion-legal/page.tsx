import { notFound } from "next/navigation";
import { EmpresaLegalChecklist } from "@/components/empresa-site/EmpresaLegalChecklist";
import { EmpresaLegalDocumentCard } from "@/components/empresa-site/EmpresaLegalDocumentCard";
import { EmpresaSiteLayout } from "@/components/empresa-site/EmpresaSiteLayout";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { getEmpresaSiteDataBySlug } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  canAccessOperationalRoutes,
  redirectEmpresaFromOperationalRoute
} from "@/lib/auth/route-access";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EmpresaInformacionLegalPage({ params }: PageProps) {
  const { profile } = await requireAuth();
  redirectEmpresaFromOperationalRoute(profile);

  const { slug } = await params;
  const data = await getEmpresaSiteDataBySlug(slug, profile);

  if (!data) notFound();

  return (
    <AppShell profile={profile}>
      <EmpresaSiteLayout
        active="legal"
        empresa={data.empresa}
        showOperationalActions={canAccessOperationalRoutes(profile)}
        web={data.web}
      >
        <SectionCard
          description="Documentación legal y contable evaluable dentro de ICM Empresarial."
          title="Información Legal"
        >
          <EmpresaLegalChecklist documentos={data.documentos} />
        </SectionCard>
        <SectionCard title="Datos legales principales">
          <dl className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="font-medium text-ink">Razón social</dt>
              <dd className="mt-1 text-muted">{data.empresa.razon_social ?? "Pendiente"}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">CUIT simulado</dt>
              <dd className="mt-1 text-muted">{data.empresa.cuit_simulado ?? "Pendiente"}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Domicilio</dt>
              <dd className="mt-1 text-muted">{data.empresa.domicilio ?? "Pendiente"}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Socio responsable</dt>
              <dd className="mt-1 text-muted">{data.empresa.socio_responsable ?? "Pendiente"}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Persona jurídica</dt>
              <dd className="mt-1 text-muted">{data.empresa.persona_juridica ?? "Pendiente"}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Revisión contable</dt>
              <dd className="mt-1 text-muted">{data.revision?.estado ?? "Pendiente"}</dd>
            </div>
          </dl>
        </SectionCard>
        <SectionCard title="Documentos presentados">
          {data.documentos.length === 0 ? (
            <p className="text-sm text-muted">Aún no se presentaron documentos.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.documentos.map((documento) => (
                <EmpresaLegalDocumentCard
                  documento={documento}
                  key={documento.id}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </EmpresaSiteLayout>
    </AppShell>
  );
}
