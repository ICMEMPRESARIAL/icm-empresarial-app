"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatSafeAuthErrorDetails,
  getSafeAuthErrorDetails
} from "@/lib/auth/safe-auth-error";
import {
  updatePasswordAction
} from "@/lib/auth/password-actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type UpdatePasswordFormProps = {
  authCode?: string;
  authError?: string;
  authErrorCode?: string;
  isInvite?: boolean;
};

export function UpdatePasswordForm({
  authCode,
  authError,
  authErrorCode,
  isInvite = false
}: UpdatePasswordFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreparingSession, setIsPreparingSession] = useState(Boolean(authCode));
  const [state, formAction, isSubmitting] = useActionState(
    updatePasswordAction,
    { error: null }
  );

  useEffect(() => {
    let isMounted = true;

    async function prepareSession() {
      if (authError) {
        console.error("ICM update password auth link failure", {
          code: authErrorCode,
          message: authError
        });

        if (isMounted) {
          setErrorMessage(
            `No pudimos validar el enlace de invitacion. Detalle: ${formatSafeAuthErrorDetails(
              { code: authErrorCode, message: authError }
            )}`
          );
          setIsPreparingSession(false);
        }
        return;
      }

      const supabase = createClient();
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("ICM update password session check failure", {
          ...getSafeAuthErrorDetails(sessionError)
        });
      }

      if (!session && authCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(authCode);

        if (error) {
          const details = getSafeAuthErrorDetails(error);
          console.error("ICM update password code exchange failure", details);

          if (isMounted) {
            setErrorMessage(
              `No pudimos validar el enlace de invitacion. Detalle: ${formatSafeAuthErrorDetails(
                details
              )}`
            );
            setIsPreparingSession(false);
          }
          return;
        }

        router.replace(
          isInvite ? "/update-password?invite=1" : "/update-password"
        );
      }

      if (isMounted) {
        setIsPreparingSession(false);
      }
    }

    prepareSession();

    return () => {
      isMounted = false;
    };
  }, [authCode, authError, authErrorCode, isInvite, router]);

  return (
    <Card>
      <form action={formAction} className="space-y-5">
        {isInvite ? <input name="invite" type="hidden" value="1" /> : null}
        <Input label="Nueva contraseña" name="password" required type="password" />
        <Input
          label="Confirmar contraseña"
          name="confirm_password"
          required
          type="password"
        />
        {errorMessage || state.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage ?? state.error}
          </p>
        ) : null}
        <Button
          className="w-full"
          disabled={isPreparingSession || isSubmitting}
          type="submit"
        >
          {isPreparingSession
            ? "Validando invitacion..."
            : isSubmitting
            ? "Guardando..."
            : isInvite
              ? "Crear contraseña y continuar"
              : "Actualizar contraseña"}
        </Button>
        {!isInvite ? (
          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface"
            href="/login"
          >
            Volver a iniciar sesión
          </Link>
        ) : null}
      </form>
    </Card>
  );
}
