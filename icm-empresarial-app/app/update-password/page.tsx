import Link from "next/link";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/password/UpdatePasswordForm";
import { getSafeAuthErrorDetails } from "@/lib/auth/safe-auth-error";
import { createClient } from "@/lib/supabase/server";

type UpdatePasswordPageProps = {
  searchParams: Promise<{
    code?: string;
    error?: string;
    error_code?: string;
    error_description?: string;
    invite?: string;
  }>;
};

export default async function UpdatePasswordPage({
  searchParams
}: UpdatePasswordPageProps) {
  const params = await searchParams;
  const isInvite = params.invite === "1";

  if (isInvite) {
    const supabase = await createClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("ICM update password invite gate failure", {
        flow: "server_page_get_user",
        ...(error ? getSafeAuthErrorDetails(error) : {})
      });

      redirect("/login?error=invite_session_missing");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            ICM Empresarial
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">
            {isInvite ? "Creá tu contraseña" : "Nueva contraseña"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {isInvite
              ? "Este es el último paso para activar tu acceso a ICM Empresarial."
              : "Ingresá y confirmá tu nueva contraseña."}
          </p>
          {!isInvite ? (
            <Link
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface"
              href="/login"
            >
              Volver a iniciar sesión
            </Link>
          ) : null}
        </div>
        <UpdatePasswordForm
          authCode={params.code}
          authError={params.error_description ?? params.error}
          authErrorCode={params.error_code}
          isInvite={isInvite}
        />
      </section>
    </main>
  );
}
