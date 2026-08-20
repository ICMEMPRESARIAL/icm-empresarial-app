import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ActivationForm } from "@/components/activation/ActivationForm";
import { getActivationInviteByToken } from "@/lib/activation/invites";

type ActivarPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

function statusMessage(status: string) {
  if (status === "missing") {
    return "Falta el token de activación.";
  }
  if (status === "expired") {
    return "Esta invitación venció. Pedí una nueva invitación.";
  }
  if (status === "used") {
    return "Esta invitación ya fue usada.";
  }
  return "No pudimos validar este enlace de activación.";
}

export default async function ActivarPage({ searchParams }: ActivarPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const activation = await getActivationInviteByToken(token);

  if (activation.status !== "valid" || !activation.invite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
        <section className="w-full max-w-md">
          <Card>
            <p className="text-sm font-medium uppercase tracking-wide text-brand">
              ICM Empresarial
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">
              Enlace no disponible
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              {statusMessage(activation.status)}
            </p>
            <Link
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface"
              href="/login"
            >
              Ir al ingreso
            </Link>
          </Card>
        </section>
      </main>
    );
  }

  const invite = activation.invite;
  const title =
    invite.rol === "profesora_admin"
      ? "Activar cuenta docente"
      : "Activar cuenta de empresa";

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            ICM Empresarial
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{title}</h1>
          <p className="mt-2 text-sm text-muted">
            Creá tu contraseña para entrar con la cuenta ya asignada.
          </p>
        </div>
        <Card>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-ink">Email</dt>
              <dd className="mt-1 text-muted">{invite.email}</dd>
            </div>
            {invite.empresaNombre ? (
              <div>
                <dt className="font-medium text-ink">Entidad asignada</dt>
                <dd className="mt-1 text-muted">{invite.empresaNombre}</dd>
              </div>
            ) : null}
          </dl>
          <ActivationForm token={token} />
        </Card>
      </section>
    </main>
  );
}
