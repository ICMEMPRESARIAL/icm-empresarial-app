import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  getTramitesCountByEstadoForCurrentUser
} from "@/lib/tramites/queries";
import { tramiteEstadoLabels } from "@/lib/tramites/types";

const cards = [
  {
    title: "Buzón empresarial",
    description: "Mensajes, pedidos, reclamos y notificaciones internas.",
    href: "/buzon"
  },
  {
    title: "Empresas",
    description: "Directorio interno de empresas simuladas.",
    href: "/empresas"
  },
  {
    title: "Organismos",
    description: "Organismos públicos internos de la simulación.",
    href: "/organismos"
  },
  {
    title: "Mis trámites",
    description: "Expedientes internos ante organismos públicos.",
    href: "/tramites"
  },
  {
    title: "Perfil de empresa",
    description: "Datos internos de la empresa asociada al usuario.",
    href: "/perfil-empresa"
  }
] as const;

export default async function DashboardPage() {
  const { profile } = await requireAuth();
  const tramitesCount = await getTramitesCountByEstadoForCurrentUser();
  const totalTramites = Object.values(tramitesCount).reduce(
    (total, value) => total + value,
    0
  );

  return (
    <AppShell profile={profile}>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-medium text-brand">Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            Hola, {profile.nombre}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Accesos principales para operar la simulación empresarial dentro de
            la plataforma.
          </p>
          <dl className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-3">
            <div>
              <dt className="font-medium text-ink">Rol</dt>
              <dd>{profile.rol}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Empresa asociada</dt>
              <dd>{profile.empresa?.nombre ?? "Sin empresa asociada"}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Tipo</dt>
              <dd>{profile.empresa?.tipo ?? "No aplica"}</dd>
            </div>
          </dl>
        </section>

        <section>
          <Card>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">Mis trámites</h2>
                <p className="mt-1 text-sm text-muted">
                  {totalTramites} trámite{totalTramites === 1 ? "" : "s"} en
                  seguimiento.
                </p>
              </div>
              <Link
                className="text-sm font-medium text-brand hover:underline"
                href="/tramites"
              >
                Ver trámites
              </Link>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              {Object.entries(tramitesCount)
                .filter(([, count]) => count > 0)
                .slice(0, 6)
                .map(([estado, count]) => (
                  <div
                    className="rounded-md border border-border bg-surface p-3"
                    key={estado}
                  >
                    <dt className="text-xs text-muted">
                      {tramiteEstadoLabels[
                        estado as keyof typeof tramiteEstadoLabels
                      ]}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold text-ink">
                      {count}
                    </dd>
                  </div>
                ))}
              {totalTramites === 0 ? (
                <div className="rounded-md border border-border bg-surface p-3 text-sm text-muted sm:col-span-3">
                  Todavía no hay trámites iniciados.
                </div>
              ) : null}
            </dl>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-ink">
                    {card.title}
                  </h2>
                  <span className="text-sm font-medium text-brand">Abrir</span>
                </div>
                <p className="mt-2 text-sm text-muted">{card.description}</p>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
