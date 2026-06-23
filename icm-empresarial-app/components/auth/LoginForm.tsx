"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type ProfileRole = "empresa" | "profesora_admin";

type ProfileResponse = {
  rol: ProfileRole;
};

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setErrorMessage("Las credenciales no son válidas.");
      setIsSubmitting(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", authData.user.id)
      .single<ProfileResponse>();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setErrorMessage(
        "El usuario existe, pero todavía no tiene un perfil asignado."
      );
      setIsSubmitting(false);
      return;
    }

    router.replace(profile.rol === "profesora_admin" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          autoComplete="email"
          label="Email"
          name="email"
          placeholder="usuario@icmempresarial.com.ar"
          required
          type="email"
        />
        <Input
          autoComplete="current-password"
          label="Contraseña"
          name="password"
          placeholder="Ingresá tu contraseña"
          required
          type="password"
        />

        {errorMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
    </Card>
  );
}
