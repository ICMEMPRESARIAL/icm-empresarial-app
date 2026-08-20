"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatSafeAuthErrorDetails,
  getSafeAuthErrorDetails
} from "@/lib/auth/safe-auth-error";
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
  const [isPreparingSession, setIsPreparingSession] = useState(
    Boolean(authCode || isInvite)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      if (isInvite) {
        const {
          data: { session: refreshedSession },
          error: refreshedSessionError
        } = await supabase.auth.getSession();

        if (refreshedSessionError) {
          console.error("ICM invite session refresh failure", {
            ...getSafeAuthErrorDetails(refreshedSessionError)
          });
        }

        if (!refreshedSession) {
          if (isMounted) {
            setErrorMessage(
              "No pudimos validar tu invitacion. Abrí el enlace más reciente del email o pedí una nueva invitacion."
            );
            setIsPreparingSession(false);
          }
          return;
        }
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      const details = getSafeAuthErrorDetails(error);
      console.error("ICM update password failure", details);
      setErrorMessage(
        `No se pudo actualizar la contraseña. Detalle: ${formatSafeAuthErrorDetails(
          details
        )}`
      );
      setIsSubmitting(false);
      return;
    }

    if (isInvite) {
      router.replace("/onboarding");
      router.refresh();
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?password=updated");
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input label="Nueva contraseña" name="password" required type="password" />
        <Input
          label="Confirmar contraseña"
          name="confirm_password"
          required
          type="password"
        />
        {errorMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
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
