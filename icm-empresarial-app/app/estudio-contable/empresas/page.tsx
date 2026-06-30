import { AppShell } from "@/components/layout/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { requireAuth } from "@/lib/auth/require-auth";
import { getRevisionesForCurrentEstudio } from "@/lib/empresa-site/queries";

export default async function EstudioContableEmpresasPage() {
  const { profile } = await requireAuth();
  const revisiones = await getRevisionesForCurrentEstudio();

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Revisá información legal y documentación de empresas asignadas."
          eyebrow="Estudio contable"
          title="Empresas asignadas"
        />
        <SectionCard title="Revisiones contables">
          {revisiones.length === 0 ? (
            <EmptyState
              description="Todavía no hay empresas asignadas a este estudio contable."
              title="Sin revisiones asignadas"
            />
          ) : (
            <div className="space-y-3">
              {revisiones.map((revision) => (
                <div
                  className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={revision.id}
                >
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="blue">{revision.estado}</Badge>
                      {revision.estudio_contable ? (
                        <Badge tone="gray">
                          {revision.estudio_contable.nombre_comercial ??
                            revision.estudio_contable.nombre}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {revision.empresa?.nombre_comercial ??
                        revision.empresa?.nombre ??
                        "Empresa sin nombre"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {revision.observaciones_generales ??
                        "Sin observaciones generales."}
                    </p>
                  </div>
                  <ActionButton
                    href={`/estudio-contable/empresas/${revision.empresa_id}`}
                    variant="secondary"
                  >
                    Revisar
                  </ActionButton>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
