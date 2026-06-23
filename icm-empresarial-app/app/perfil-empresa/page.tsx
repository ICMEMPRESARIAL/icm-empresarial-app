import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function PerfilEmpresaPage() {
  const { profile } = await requireAuth();

  return (
    <AppShell profile={profile}>
      <Card>
        <p className="text-sm font-medium text-brand">Perfil de empresa</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">
          {profile.empresa?.nombre ?? "Sin empresa asociada"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Los datos editables de la empresa se implementarán en la siguiente
          etapa.
        </p>
      </Card>
    </AppShell>
  );
}
