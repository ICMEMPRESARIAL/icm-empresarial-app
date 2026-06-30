import { redirect } from "next/navigation";
import { LegalDocumentUploader } from "@/components/empresa-site/LegalDocumentUploader";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { getCurrentEmpresaSiteData } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function PerfilEmpresaDocumentacionPage() {
  const { profile } = await requireAuth();
  const data = await getCurrentEmpresaSiteData();

  if (!data) {
    redirect("/perfil-empresa");
  }

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Subí constancias, libros y documentación legal evaluable."
          eyebrow="Perfil de empresa"
          title="Documentación"
        />
        <SectionCard title="Cargar documento">
          <LegalDocumentUploader empresa={data.empresa} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
