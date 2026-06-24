import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/require-auth";

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
    title: "Perfil de empresa",
    description: "Datos internos de la empresa asociada al usuario.",
    href: "/perfil-empresa"
  }
] as const;

export default async function DashboardPage() {
  const { profile } = await requireAuth();

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
