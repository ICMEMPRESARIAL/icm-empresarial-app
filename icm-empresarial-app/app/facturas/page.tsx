import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function FacturasPage() {
  const { profile } = await requireAuth();

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="La emisión de facturas, pagos y seguimiento Regisoft se implementará en la Fase 3."
          eyebrow="Facturas"
          title="Facturas y pagos"
        />
        <EmptyState
          description="Este acceso queda preparado para el próximo módulo operativo."
          title="Módulo en preparación"
        />
      </div>
    </AppShell>
  );
}
