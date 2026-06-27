import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/require-auth";

const adminCards = [
  {
    title: "Solicitudes",
    description: "Aprobación de alumnos y creación de entidades internas.",
    href: "/admin/solicitudes"
  },
  {
    title: "Empresas",
    description: "Alta, edición y estado de empresas y organismos.",
    href: "/admin/empresas"
  },
  {
    title: "Usuarios",
    description: "Usuarios, perfiles y empresas asociadas.",
    href: "/admin/usuarios"
  },
  {
    title: "Auditoría",
    description: "Registro básico de actividad del sistema.",
    href: "/admin/auditoria"
  },
  {
    title: "Correspondencia",
    description: "Supervisión y moderación de mensajes internos.",
    href: "/admin/correspondencia"
  }
] as const;

export default async function AdminPage() {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  return (
    <AppShell profile={profile}>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-medium text-brand">Administración</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            Panel de profesora administradora
          </h1>
          <p className="mt-2 text-sm text-muted">
            Base inicial para gestionar la operación educativa de ICM Empresarial.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {adminCards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition hover:border-brand hover:shadow-sm">
                <h2 className="text-lg font-semibold text-ink">{card.title}</h2>
                <p className="mt-2 text-sm text-muted">{card.description}</p>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
