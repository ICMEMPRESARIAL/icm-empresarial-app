import { notFound } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, FileCheck2, Landmark, MessageSquare } from "lucide-react";
import { EmpresaSiteLayout } from "@/components/empresa-site/EmpresaSiteLayout";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmpresaProductoCard } from "@/components/empresa-site/EmpresaProductoCard";
import { EmpresaLegalChecklist } from "@/components/empresa-site/EmpresaLegalChecklist";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getEmpresaSiteDataBySlug } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type EmpresaSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EmpresaSlugPage({ params }: EmpresaSlugPageProps) {
  const { profile } = await requireAuth();
  const { slug } = await params;
  const data = await getEmpresaSiteDataBySlug(slug, profile);

  if (!data) {
    notFound();
  }

  const destacados = data.productos.slice(0, 3);
  const presentados = data.documentos.filter(
    (documento) => documento.estado === "presentado" || documento.estado === "aprobado"
  ).length;

  return (
    <AppShell profile={profile}>
      <EmpresaSiteLayout active="inicio" empresa={data.empresa} web={data.web}>
        <section className="grid gap-5 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <Badge tone="blue">{data.empresa.rubro ?? "Rubro pendiente"}</Badge>
              {data.empresa.actividad_principal ? (
                <Badge tone="green">{data.empresa.actividad_principal}</Badge>
              ) : null}
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-ink">
              Presentación interna
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
              {data.web?.descripcion_inicio ??
                data.empresa.descripcion ??
                "Esta empresa todavía está preparando su presentación interna."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton
                href={`/empresas/${data.empresa.slug}/productos`}
                icon={<BriefcaseBusiness className="h-4 w-4" />}
              >
                Ver productos
              </ActionButton>
              <ActionButton
                href={`/buzon/nuevo?destinatario=${data.empresa.id}`}
                icon={<MessageSquare className="h-4 w-4" />}
                variant="secondary"
              >
                Enviar consulta
              </ActionButton>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-muted">Documentos</p>
              <p className="mt-2 text-3xl font-semibold text-ink">{presentados}</p>
              <p className="mt-1 text-xs text-muted">presentados o aprobados</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-muted">Publicaciones</p>
              <p className="mt-2 text-3xl font-semibold text-ink">
                {data.productos.length}
              </p>
              <p className="mt-1 text-xs text-muted">productos y servicios</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-muted">Revisión contable</p>
              <p className="mt-2 text-xl font-semibold capitalize text-ink">
                {data.revision?.estado?.replaceAll("_", " ") ?? "Pendiente"}
              </p>
              <p className="mt-1 text-xs text-muted">seguimiento educativo</p>
            </div>
          </div>
        </section>

        <SectionCard
          actions={
            <ActionButton
              href={`/empresas/${data.empresa.slug}/productos`}
              icon={<ArrowRight className="h-4 w-4" />}
              variant="secondary"
            >
              Ver todos
            </ActionButton>
          }
          description="Oferta simulada disponible para operaciones dentro de ICM."
          title="Productos y servicios destacados"
        >
          {destacados.length === 0 ? (
            <EmptyState
              description="Cuando la empresa cargue su oferta, aparecerá en este espacio."
              title="Sin publicaciones todavía"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {destacados.map((producto) => (
                <EmpresaProductoCard
                  empresaSlug={data.empresa.slug}
                  key={producto.id}
                  producto={producto}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <SectionCard
            description="Estado resumido de constancias, libros y documentos evaluables."
            title="Información legal"
          >
            <EmpresaLegalChecklist documentos={data.documentos} />
          </SectionCard>
          <SectionCard title="Datos clave">
            <dl className="grid gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Landmark className="mt-0.5 h-4 w-4 text-brand" />
                <div>
                  <dt className="font-medium text-ink">Figura legal</dt>
                  <dd className="mt-1 text-muted">
                    {data.empresa.figura_legal ?? "Pendiente"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileCheck2 className="mt-0.5 h-4 w-4 text-brand" />
                <div>
                  <dt className="font-medium text-ink">CUIT simulado</dt>
                  <dd className="mt-1 text-muted">
                    {data.empresa.cuit_simulado ?? "Pendiente"}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="font-medium text-ink">Responsable</dt>
                <dd className="mt-1 text-muted">
                  {data.empresa.responsable ??
                    data.empresa.socio_responsable ??
                    "Pendiente"}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </EmpresaSiteLayout>
    </AppShell>
  );
}
