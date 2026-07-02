import { redirect } from "next/navigation";
import { IvaComprasVentasPanel } from "@/components/empresa-site/IvaComprasVentasPanel";
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

  const canUpload = profile.estado === "activo";

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Subí constancias, libros y PDFs mensuales de IVA Compras/Ventas."
          eyebrow="Perfil de empresa"
          title="Documentación"
        />
        <SectionCard
          description="Cada mes requiere dos PDFs exportados desde Regisoft: compras y ventas."
          title="IVA Compras y Ventas"
        >
          <IvaComprasVentasPanel
            canUpload={canUpload}
            documentos={data.documentos}
            empresaId={data.empresa.id}
          />
        </SectionCard>
        <SectionCard title="Cargar documento">
          {canUpload ? (
            <LegalDocumentUploader empresa={data.empresa} />
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Tu cuenta puede consultar documentación, pero no cargar archivos
              mientras no esté activa.
            </p>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
