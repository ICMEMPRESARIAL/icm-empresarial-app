import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function AdminAuditoriaPage() {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  return (
    <AppShell profile={profile}>
      <Card>
        <p className="text-sm font-medium text-brand">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Auditoría</h1>
        <p className="mt-2 text-sm text-muted">
          La lectura de registros de auditoría se implementará en la siguiente
          etapa.
        </p>
      </Card>
    </AppShell>
  );
}
