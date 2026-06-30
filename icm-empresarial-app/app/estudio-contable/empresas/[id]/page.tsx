import { notFound } from "next/navigation";
import { reviewLegalDocumentAction } from "@/lib/empresa-site/actions";
import { EmpresaLegalChecklist } from "@/components/empresa-site/EmpresaLegalChecklist";
import { EmpresaLegalDocumentCard } from "@/components/empresa-site/EmpresaLegalDocumentCard";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmpresaSiteDataById } from "@/lib/empresa-site/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EstudioContableEmpresaPage({ params }: PageProps) {
  const { profile } = await requireAuth();
  const { id } = await params;
  const data = await getEmpresaSiteDataById(id, profile);

  if (!data) {
    notFound();
  }

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Revisión legal y contable para dejar observaciones evaluables."
          eyebrow="Estudio contable"
          title={data.empresa.nombre_comercial ?? data.empresa.nombre}
        />
        <SectionCard title="Estado general">
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">
              {data.revision?.estado ?? "pendiente"}
            </Badge>
            <Badge tone="gray">
              {data.empresa.figura_legal ?? "figura pendiente"}
            </Badge>
            <Badge tone="gray">{data.empresa.rubro ?? "sin rubro"}</Badge>
          </div>
          <p className="mt-3 text-sm text-muted">
            {data.revision?.observaciones_generales ??
              "Sin observaciones generales cargadas."}
          </p>
        </SectionCard>
        <SectionCard title="Checklist legal">
          <EmpresaLegalChecklist documentos={data.documentos} />
        </SectionCard>
        <SectionCard title="Documentación para revisar">
          {data.documentos.length === 0 ? (
            <p className="text-sm text-muted">
              La empresa todavía no cargó documentación legal.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.documentos.map((documento) => (
                <div className="space-y-3" key={documento.id}>
                  <EmpresaLegalDocumentCard documento={documento} />
                  <form
                    action={reviewLegalDocumentAction}
                    className="space-y-3 rounded-xl border border-border bg-surface p-4"
                  >
                    <input
                      name="documento_id"
                      type="hidden"
                      value={documento.id}
                    />
                    <input
                      name="empresa_id"
                      type="hidden"
                      value={data.empresa.id}
                    />
                    <label className="block text-sm font-medium text-ink">
                      Estado
                      <select
                        className="mt-2 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
                        defaultValue={documento.estado}
                        name="estado"
                      >
                        <option value="presentado">Presentado</option>
                        <option value="observado">Observado</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-ink">
                      Observación
                      <textarea
                        className="mt-2 min-h-20 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                        defaultValue={documento.observacion ?? ""}
                        name="observacion"
                      />
                    </label>
                    <button
                      className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white transition hover:bg-[#183f73]"
                      type="submit"
                    >
                      Guardar revisión
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
