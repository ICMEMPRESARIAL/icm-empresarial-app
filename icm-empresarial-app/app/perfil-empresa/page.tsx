import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmpresaAvatar } from "@/components/empresas/EmpresaAvatar";
import { EmpresaBannerUploader } from "@/components/empresas/EmpresaBannerUploader";
import { EmpresaLogoUploader } from "@/components/empresas/EmpresaLogoUploader";
import { EmpresaVisualProfileForm } from "@/components/empresas/EmpresaVisualProfileForm";
import { Badge } from "@/components/ui/Badge";
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

          <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
            <div
              className="relative min-h-56"
              style={{
                backgroundColor: empresa.color_marca ?? "#1f4f8f",
                backgroundImage: empresa.banner_url
                  ? `linear-gradient(90deg, rgba(15,23,42,0.68), rgba(15,23,42,0.18)), url(${empresa.banner_url})`
                  : `linear-gradient(135deg, ${
                      empresa.color_marca ?? "#1f4f8f"
                    }, #0ea5e9 56%, #14b8a6)`
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_32%)]" />
              <div className="relative flex min-h-56 flex-col justify-end p-6 text-white sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                  <EmpresaAvatar
                    className="h-24 w-24 rounded-3xl border-4 border-white/80"
                    empresa={empresa}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="blue">{empresa.tipo}</Badge>
                      <Badge tone="green">
                        {empresa.activo ? "Activa" : "Inactiva"}
                      </Badge>
                      {empresa.figura_legal ? (
                        <Badge tone="violet">{empresa.figura_legal}</Badge>
                      ) : null}
                    </div>
                    <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                      {empresa.nombre_comercial ?? empresa.nombre}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-white/85">
                      {empresa.slogan ??
                        "Cargá un slogan para presentar mejor tu empresa."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <SectionCard
            description="Subí imágenes en PNG, JPG o WebP. Si no hay imagen, la plataforma usa iniciales y un gradiente con el color de marca."
            title="Logo y banner"
          >
            <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
              <EmpresaLogoUploader
                currentUrl={empresa.logo_url ?? empresa.logo}
                empresaId={empresa.id}
              />
              <EmpresaBannerUploader
                currentUrl={empresa.banner_url}
                empresaId={empresa.id}
              />
            </div>
          </SectionCard>

          <SectionCard
            description="La empresa puede editar solo presentación, contacto y marca. Tipo, figura legal, estado y curso quedan bajo revisión docente."
            title="Editar perfil de empresa"
          >
            <EmpresaVisualProfileForm empresa={empresa} />
          </SectionCard>
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
