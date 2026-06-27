import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { TramiteList } from "@/components/tramites/TramiteList";
import { Button } from "@/components/ui/Button";
import { getTramitesForCurrentUser } from "@/lib/tramites/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function TramitesPage() {
  const { profile } = await requireAuth();
  const tramites = await getTramitesForCurrentUser();

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand">Trámites</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">
              Mis trámites
            </h1>
            <p className="mt-2 text-sm text-muted">
              Seguimiento interno de solicitudes ante organismos de ICM.
            </p>
          </div>
          <Link href="/tramites/nuevo">
            <Button>Nuevo trámite</Button>
          </Link>
        </section>
        <TramiteList tramites={tramites} />
      </div>
    </AppShell>
  );
}
