"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInvite = searchParams.get("invite") === "1";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setErrorMessage("No se pudo actualizar la contraseña.");
      setIsSubmitting(false);
      return;
    }

    if (isInvite) {
      router.replace("/bienvenida");
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
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting
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
