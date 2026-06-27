import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Card } from "@/components/ui/Card";
import { getUserProfile } from "@/lib/auth/get-user-profile";

export default async function PendienteAprobacionPage() {
  const session = await getUserProfile();

  if (session.profile?.estado === "activo") {
    redirect(session.profile.rol === "profesora_admin" ? "/admin" : "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <section className="w-full max-w-lg">
        <Card>
          <p className="text-sm font-medium text-brand">Cuenta creada</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">
            Pendiente de aprobación
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Tu cuenta fue creada y está pendiente de aprobación por la
            profesora. Cuando sea aprobada, vas a poder entrar al dashboard y
            usar el buzón empresarial.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {session.user ? <LogoutButton /> : null}
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface"
              href="/login"
            >
              Ir al login
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
