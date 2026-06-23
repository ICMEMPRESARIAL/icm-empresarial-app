import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getUserProfile } from "@/lib/auth/get-user-profile";

export default async function LoginPage() {
  const session = await getUserProfile();

  if (session.profile?.rol === "profesora_admin") {
    redirect("/admin");
  }

  if (session.user) {
    redirect("/dashboard");
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
        <LoginForm />
      </section>
    </main>
  );
}
