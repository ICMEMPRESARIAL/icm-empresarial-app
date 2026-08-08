import { redirect } from "next/navigation";
import { EmpresaLegalChecklist } from "@/components/empresa-site/EmpresaLegalChecklist";
import { EmpresaLegalDocumentCard } from "@/components/empresa-site/EmpresaLegalDocumentCard";
import { IvaComprasVentasPanel } from "@/components/empresa-site/IvaComprasVentasPanel";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { getCurrentEmpresaSiteData } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function PerfilEmpresaInformacionLegalPage() {
  const { profile } = await requireAuth();
  const data = await getCurrentEmpresaSiteData();

  if (!data) {
    redirect("/perfil-empresa");
  }

  const documentosGenerales = data.documentos.filter(
    (documento) => documento.categoria !== "iva_compra_venta"
  );
  const canUpload = profile.estado === "activo";

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Checklist evaluable, documentos legales y PDFs mensuales de IVA exportados desde Regisoft."
          eyebrow="Perfil de empresa"
          title="Información Legal"
        />
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted">Empresa</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {data.empresa.nombre_comercial ?? data.empresa.nombre}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Figura legal</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {data.empresa.figura_legal ?? "Pendiente"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Revisión contable</p>
              <p className="mt-2 text-lg font-semibold capitalize text-ink">
                {data.revision?.estado?.replaceAll("_", " ") ?? "Pendiente"}
              </p>
            </div>
          </div>
        </section>
        <SectionCard title="Checklist legal">
          <EmpresaLegalChecklist documentos={data.documentos} />
        </SectionCard>

        <SectionCard
          description="Cargá un PDF de compras y uno de ventas por cada mes."
          title="IVA Compras y Ventas"
        >
          <IvaComprasVentasPanel
            canUpload={canUpload}
            documentos={data.documentos}
            empresaId={data.empresa.id}
          />
        </SectionCard>

        <SectionCard title="Documentos cargados">
          {documentosGenerales.length === 0 ? (
            <EmptyState
              description="Usá la sección Documentación para cargar constancias, libros y otros archivos legales."
              title="Todavía no cargaste documentación general"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {documentosGenerales.map((documento) => (
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
