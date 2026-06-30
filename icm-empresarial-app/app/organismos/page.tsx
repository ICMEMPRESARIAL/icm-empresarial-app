import { AppShell } from "@/components/layout/AppShell";
import { EmpresaGrid } from "@/components/empresas/EmpresaGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmpresasByTipos } from "@/lib/empresas/queries";

export default async function OrganismosPage() {
  const { profile } = await requireAuth();
  const organismos = await getEmpresasByTipos(["organismo"], profile);

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Organismos simulados para comunicaciones, trámites, constancias, pedidos y notificaciones dentro de la plataforma."
          eyebrow="Organismos"
          title="Organismos públicos internos"
        />
        <EmpresaGrid
          basePath="/organismos"
          emptyMessage="No hay organismos visibles para mostrar."
          empresas={organismos}
        />
      </div>
    </AppShell>
  );
}
