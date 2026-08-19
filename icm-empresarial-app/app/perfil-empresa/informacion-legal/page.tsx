import { redirect } from "next/navigation";
import { EmpresaLegalChecklist } from "@/components/empresa-site/EmpresaLegalChecklist";
import { EmpresaLegalDocumentCard } from "@/components/empresa-site/EmpresaLegalDocumentCard";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { getCurrentEmpresaSiteData } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";
import { redirectEmpresaFromOperationalRoute } from "@/lib/auth/route-access";

export default async function PerfilEmpresaInformacionLegalPage() {
  const { profile } = await requireAuth();
  redirectEmpresaFromOperationalRoute(profile);

  const data = await getCurrentEmpresaSiteData();

  if (!data) {
    redirect("/perfil-empresa");
  }

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Checklist evaluable de documentación legal y contable."
          eyebrow="Perfil de empresa"
          title="Información Legal"
        />
        <SectionCard title="Checklist legal">
          <EmpresaLegalChecklist documentos={data.documentos} />
        </SectionCard>
        <SectionCard title="Documentos cargados">
          {data.documentos.length === 0 ? (
            <p className="text-sm text-muted">Todavía no cargaste documentación.</p>
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
      </div>
    </AppShell>
  );
}
