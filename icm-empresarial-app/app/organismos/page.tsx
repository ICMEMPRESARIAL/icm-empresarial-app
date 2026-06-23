import { AppShell } from "@/components/layout/AppShell";
import { EmpresaGrid } from "@/components/empresas/EmpresaGrid";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmpresasByTipos } from "@/lib/empresas/queries";

export default async function OrganismosPage() {
  const { profile } = await requireAuth();
  const organismos = await getEmpresasByTipos(["organismo"], profile);

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section>
          <p className="text-sm font-medium text-brand">Organismos</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            Organismos públicos internos
          </h1>
          <p className="mt-2 text-sm text-muted">
            Organismos simulados para comunicaciones, pedidos y notificaciones
            dentro de la plataforma.
          </p>
        </section>
        <EmpresaGrid
          basePath="/organismos"
          emptyMessage="No hay organismos visibles para mostrar."
          empresas={organismos}
        />
      </div>
    </AppShell>
  );
}
