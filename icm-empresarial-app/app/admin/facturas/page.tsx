import { redirect } from "next/navigation";
import { FacturaList } from "@/components/facturas/FacturaList";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { getAllFacturasForAdmin } from "@/lib/facturas/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function AdminFacturasPage() {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  const facturas = await getAllFacturasForAdmin();

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Vista global de facturas, pagos y seguimiento Regisoft."
          eyebrow="Administración"
          title="Facturas y pagos"
        />
        <SectionCard title="Todas las facturas">
          <FacturaList facturas={facturas} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
