import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/Card";
import { getUserProfile } from "@/lib/auth/get-user-profile";
import { homePathForProfile } from "@/lib/auth/route-access";

type LoginPageProps = {
  searchParams: Promise<{
    password?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getUserProfile();
  const params = await searchParams;

  if (session.profile?.estado === "pendiente") {
    redirect("/pendiente-aprobacion");
  }

  if (session.profile?.estado === "dado_de_baja") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
        <section className="w-full max-w-md">
          <Card>
            <p className="text-sm font-medium text-brand">ICM Empresarial</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Cuenta dada de baja
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Esta cuenta no puede acceder a la plataforma. Consultá con la
              profesora administradora.
            </p>
            <div className="mt-6">
              <LogoutButton />
            </div>
            <Link
              className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface"
              href="/login"
            >
              Volver a iniciar sesión
            </Link>
          </Card>
        </section>
      </main>
    );
  }

  if (session.profile?.rol === "profesora_admin") {
    redirect("/admin");
  }

  if (session.user && session.profile) {
    redirect(homePathForProfile(session.profile));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            ICM Empresarial
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">
            Acceso a la plataforma
          </h1>
          <p className="mt-2 text-sm text-muted">
            Ingresá con tu usuario para operar dentro del entorno empresarial.
          </p>
        </div>
        {params.password === "updated" ? (
          <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Contraseña actualizada. Ya podés ingresar.
          </p>
        ) : null}
        <LoginForm />
      </section>
    </main>
  );
}
