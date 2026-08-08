import { notFound } from "next/navigation";
import { EmpresaLegalChecklist } from "@/components/empresa-site/EmpresaLegalChecklist";
import { EmpresaLegalDocumentCard } from "@/components/empresa-site/EmpresaLegalDocumentCard";
import { IvaComprasVentasPanel } from "@/components/empresa-site/IvaComprasVentasPanel";
import { EmpresaSiteLayout } from "@/components/empresa-site/EmpresaSiteLayout";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { getEmpresaSiteDataBySlug } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EmpresaInformacionLegalPage({ params }: PageProps) {
  const { profile } = await requireAuth();
  const { slug } = await params;
  const data = await getEmpresaSiteDataBySlug(slug, profile);

  if (!data) notFound();
  const canUpload =
    profile.estado === "activo" && profile.empresa_id === data.empresa.id;
  const documentosGenerales = data.documentos.filter(
    (documento) => documento.categoria !== "iva_compra_venta"
  );

  return (
    <AppShell profile={profile}>
      <EmpresaSiteLayout active="legal" empresa={data.empresa} web={data.web}>
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="violet">Legal y contable</Badge>
                <Badge tone="blue">Regisoft</Badge>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-ink">
                Información evaluable de la empresa
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                Constancias, libros, IVA Compras/Ventas y documentación que
                permite a la profesora y a estudios contables revisar el
                recorrido formal de la empresa simulada.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
              Estado contable:{" "}
              <span className="font-semibold capitalize text-ink">
                {data.revision?.estado?.replaceAll("_", " ") ?? "Pendiente"}
              </span>
            </div>
          </div>
        </section>

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

        <SectionCard
          description="Un PDF de compras y uno de ventas por cada mes, exportados desde Regisoft."
          title="IVA Compras y Ventas"
        >
          <IvaComprasVentasPanel
            canUpload={canUpload}
            documentos={data.documentos}
            empresaId={data.empresa.id}
          />
        </SectionCard>

        <SectionCard
          description="Constancias, libros y archivos legales no mensuales."
          title="Documentos presentados"
        >
          {documentosGenerales.length === 0 ? (
            <EmptyState
              description="Los documentos cargados por la empresa aparecerán acá."
              title="Aún no se presentaron documentos"
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
      </EmpresaSiteLayout>
    </AppShell>
  );
}
