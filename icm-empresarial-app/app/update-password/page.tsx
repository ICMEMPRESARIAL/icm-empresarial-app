import { UpdatePasswordForm } from "@/components/password/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            ICM Empresarial
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">
            Nueva contraseña
          </h1>
          <p className="mt-2 text-sm text-muted">
            Ingresá y confirmá tu nueva contraseña.
          </p>
        </div>
        <UpdatePasswordForm />
      </section>
    </main>
  );
}
