import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmpresaAvatar } from "@/components/empresas/EmpresaAvatar";
import { EmpresaBannerUploader } from "@/components/empresas/EmpresaBannerUploader";
import { EmpresaDetail } from "@/components/empresas/EmpresaDetail";
import { EmpresaLogoUploader } from "@/components/empresas/EmpresaLogoUploader";
import { EmpresaVisualProfileForm } from "@/components/empresas/EmpresaVisualProfileForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmpresaById } from "@/lib/empresas/queries";

export default async function PerfilEmpresaPage() {
  const { profile } = await requireAuth();

  if (profile.rol === "profesora_admin") {
    redirect("/admin/empresas");
  }

  const empresa = profile.empresa_id
    ? await getEmpresaById(profile.empresa_id, profile)
    : null;

  return (
    <AppShell profile={profile}>
      {empresa ? (
        <div className="space-y-6">
          <PageHeader
            description="Editá la identidad visual y datos básicos de presentación. Los datos estructurales los administra la profesora."
            eyebrow="Perfil de empresa"
            title={empresa.nombre_comercial ?? empresa.nombre}
          />

          <SectionCard title="Identidad visual">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <EmpresaAvatar className="h-20 w-20 rounded-2xl" empresa={empresa} />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {empresa.nombre}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Subí logo y banner desde Supabase Storage.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <EmpresaLogoUploader empresaId={empresa.id} />
                <EmpresaBannerUploader empresaId={empresa.id} />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            description="La empresa puede editar solo presentación, contacto y marca. Tipo, figura legal, estado y curso quedan bajo revisión docente."
            title="Datos editables"
          >
            <EmpresaVisualProfileForm empresa={empresa} />
          </SectionCard>

          <EmpresaDetail empresa={empresa} />
        </div>
      ) : (
        <EmptyState
          description="Este usuario no tiene una empresa vinculada en su perfil."
          title="Sin empresa asociada"
        />
      )}
    </AppShell>
  );
}
