import { redirect } from "next/navigation";
import { EmpresaWebEditor } from "@/components/empresa-site/EmpresaWebEditor";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { getCurrentEmpresaSiteData } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function PerfilEmpresaWebPage() {
  const { profile } = await requireAuth();
  const data = await getCurrentEmpresaSiteData();

  if (!data) {
    redirect("/perfil-empresa");
  }

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Esta información se verá en tu sitio interno de empresa."
          eyebrow="Perfil de empresa"
          title="Sitio interno"
        />
        <SectionCard title="Editar sitio">
          <EmpresaWebEditor empresa={data.empresa} web={data.web} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
