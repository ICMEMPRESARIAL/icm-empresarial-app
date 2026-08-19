import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getUserProfile } from "@/lib/auth/get-user-profile";

export default async function BienvenidaPage() {
  const session = await getUserProfile();

  if (!session.user || !session.profile) {
    redirect("/login");
  }

  const { profile } = session;
  const isAdmin = profile.rol === "profesora_admin";

  if (!isAdmin && profile.empresa && !profile.empresa.onboarding_completo) {
    redirect("/onboarding");
  }

  const displayName =
    profile.empresa?.nombre_comercial ?? profile.empresa?.nombre ?? profile.nombre;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <section className="w-full max-w-2xl">
        <Card className="p-8 sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-brand">
            ICM Empresarial
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">
            Bienvenido/a, {displayName}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Tu cuenta ya está activa. No necesitás esperar ninguna aprobación para
            comenzar a usar las herramientas habilitadas.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-5">
              <Mail className="h-5 w-5 text-brand" />
              <h2 className="mt-3 font-semibold text-ink">
                {isAdmin ? "Correspondencia" : "Buzón entre empresas"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {isAdmin
                  ? "Podés supervisar la correspondencia y revisar incidentes de moderación."
                  : "Podés escribir a otras empresas. Los mensajes se verifican antes de enviarse."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5">
              <ShieldCheck className="h-5 w-5 text-brand" />
              <h2 className="mt-3 font-semibold text-ink">
                {isAdmin ? "Administración" : "Convivencia digital"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {isAdmin
                  ? "Podés monitorear usuarios y suspender cuentas cuando sea necesario."
                  : "Mantené una comunicación profesional, respetuosa y adecuada al ámbito educativo."}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90"
              href={isAdmin ? "/admin" : "/buzon"}
            >
              {isAdmin ? "Ir al panel docente" : "Abrir mi buzón"}
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
