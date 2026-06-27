import Link from "next/link";
import { RecoverPasswordForm } from "@/components/password/RecoverPasswordForm";

export default function RecuperarPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            ICM Empresarial
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">
            Recuperar contraseña
          </h1>
          <p className="mt-2 text-sm text-muted">
            Te enviaremos un enlace para crear una nueva contraseña.
          </p>
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface"
            href="/login"
          >
            Volver a iniciar sesión
          </Link>
        </div>
        <RecoverPasswordForm />
        <Link
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface"
          href="/login"
        >
          Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
}
