import Link from "next/link";
import { MailPlus } from "lucide-react";
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
        <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand">Buzón</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">
              Buzón empresarial
            </h1>
            <p className="mt-2 text-sm text-muted">
              Mensajes, pedidos y reclamos entre empresas y organismos de la
              simulación.
            </p>
          </div>
          {profile.empresa_id ? (
            <Link href="/buzon/nuevo">
              <Button className="gap-2">
                <MailPlus className="h-4 w-4" />
                Nuevo mensaje
              </Button>
            </Link>
          ) : null}
          </div>
        </section>

        <BuzonFilters activeFilter={filter} />
        <MailList items={items} />
      </div>
    </AppShell>
  );
}
