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
            className="mt-3 inline-flex text-sm font-medium text-brand hover:underline"
            href="/login"
          >
            Volver al login
          </Link>
        </div>
        <RecoverPasswordForm />
      </section>
    </main>
  );
}
