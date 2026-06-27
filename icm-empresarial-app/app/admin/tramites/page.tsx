import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TramiteList } from "@/components/tramites/TramiteList";
import { getAllTramitesForAdmin } from "@/lib/tramites/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function AdminTramitesPage() {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  const tramites = await getAllTramitesForAdmin();

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section>
          <p className="text-sm font-medium text-brand">Administración</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            Trámites
          </h1>
          <p className="mt-2 text-sm text-muted">
            Supervisión global de expedientes internos y seguimiento por
            organismo.
          </p>
        </section>
        <TramiteList baseHref="/admin/tramites" tramites={tramites} />
      </div>
    </AppShell>
  );
}
