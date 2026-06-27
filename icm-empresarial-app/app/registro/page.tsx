import Link from "next/link";
import { RegistroForm } from "@/components/registro/RegistroForm";

export default function RegistroPage() {
  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            ICM Empresarial
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">
            Crear cuenta de alumno
          </h1>
          <p className="mt-2 text-sm text-muted">
            Tu cuenta quedará pendiente hasta que la profesora apruebe la
            empresa u organismo cargado.
          </p>
          <Link
            className="mt-3 inline-flex text-sm font-medium text-brand hover:underline"
            href="/login"
          >
            Ya tengo cuenta
          </Link>
        </div>
        <RegistroForm />
      </section>
    </main>
  );
}
