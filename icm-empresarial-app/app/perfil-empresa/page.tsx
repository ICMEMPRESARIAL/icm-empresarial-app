import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/require-auth";
import { EmpresaDetail } from "@/components/empresas/EmpresaDetail";
import { getEmpresaById } from "@/lib/empresas/queries";

export default async function PerfilEmpresaPage() {
  const { profile } = await requireAuth();

  if (profile.rol === "profesora_admin") {
    redirect("/admin/empresas");
  }

  const empresa = profile.empresa_id
    ? await getEmpresaById(profile.empresa_id, profile)
    : null;

  return (
    <AppShell profile={profile}>
      {empresa ? (
        <EmpresaDetail empresa={empresa} />
      ) : (
        <Card>
          <p className="text-sm font-medium text-brand">Perfil de empresa</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">
            Sin empresa asociada
          </h1>
          <p className="mt-2 text-sm text-muted">
            Este usuario no tiene una empresa vinculada en su perfil.
          </p>
        </Card>
      )}
    </AppShell>
  );
}
