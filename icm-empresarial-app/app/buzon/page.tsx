import Link from "next/link";
import { BuzonFilters } from "@/components/buzon/BuzonFilters";
import { AppShell } from "@/components/layout/AppShell";
import { MailList } from "@/components/buzon/MailList";
import { Button } from "@/components/ui/Button";
import {
  getCorrespondenciaForCurrentUser,
  normalizeBuzonFilter
} from "@/lib/buzon/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type BuzonPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

export default async function BuzonPage({ searchParams }: BuzonPageProps) {
  const { profile } = await requireAuth();
  const params = await searchParams;
  const filter = normalizeBuzonFilter(params.filter);
  const items = await getCorrespondenciaForCurrentUser(filter);

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand">Buzón</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">
              Buzón empresarial
            </h1>
            <p className="mt-2 text-sm text-muted">
              Correspondencia formal enviada y recibida dentro de ICM
              Empresarial.
            </p>
          </div>
          {profile.empresa_id ? (
            <Link href="/buzon/nuevo">
              <Button>Nuevo mensaje</Button>
            </Link>
          ) : null}
        </section>

        <BuzonFilters activeFilter={filter} />
        <MailList items={items} />
      </div>
    </AppShell>
  );
}
