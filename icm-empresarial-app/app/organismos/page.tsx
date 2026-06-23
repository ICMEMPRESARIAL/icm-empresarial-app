import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function OrganismosPage() {
  const { profile } = await requireAuth();

  return (
    <AppShell profile={profile}>
      <Card>
        <p className="text-sm font-medium text-brand">Organismos</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">
          Organismos públicos internos
        </h1>
        <p className="mt-2 text-sm text-muted">
          Este módulo se implementará en la siguiente etapa.
        </p>
      </Card>
    </AppShell>
  );
}
