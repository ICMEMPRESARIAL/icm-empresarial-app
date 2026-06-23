import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function BuzonPage() {
  const { profile } = await requireAuth();

  return (
    <AppShell profile={profile}>
      <Card>
        <p className="text-sm font-medium text-brand">Buzón</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">
          Buzón empresarial
        </h1>
        <p className="mt-2 text-sm text-muted">
          La correspondencia interna se implementará en la siguiente etapa.
        </p>
      </Card>
    </AppShell>
  );
}
