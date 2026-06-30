import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function AdminFacturasPage() {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Supervisión de facturas, pagos, comprobantes y Regisoft en la Fase 3."
          eyebrow="Administración"
          title="Facturas y pagos"
        />
        <EmptyState
          description="Este panel queda reservado para el módulo de facturación."
          title="Módulo en preparación"
        />
      </div>
    </AppShell>
  );
}
