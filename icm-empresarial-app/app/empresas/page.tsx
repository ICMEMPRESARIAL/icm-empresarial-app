import { AppShell } from "@/components/layout/AppShell";
import { EmpresaGrid } from "@/components/empresas/EmpresaGrid";
import { getEmpresasByTipos } from "@/lib/empresas/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function EmpresasPage() {
  const { profile } = await requireAuth();
  const empresas = await getEmpresasByTipos(["servicio", "bien"], profile);

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section>
          <p className="text-sm font-medium text-brand">Empresas</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            Directorio interno de empresas
          </h1>
          <p className="mt-2 text-sm text-muted">
            Empresas simuladas de bienes y servicios disponibles dentro de ICM
            Empresarial.
          </p>
        </section>
        <EmpresaGrid
          basePath="/empresas"
          emptyMessage="No hay empresas visibles para mostrar."
          empresas={empresas}
        />
      </div>
    </AppShell>
  );
}
