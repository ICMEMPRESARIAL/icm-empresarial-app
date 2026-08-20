"use server";

import { redirect } from "next/navigation";
import {
  formatSafeAuthErrorDetails,
  getSafeAuthErrorDetails
} from "@/lib/auth/safe-auth-error";
import { createClient } from "@/lib/supabase/server";

export type UpdatePasswordState = {
  error: string | null;
};

export async function updatePasswordAction(
  _state: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const isInvite = formData.get("invite") === "1";

  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("ICM update password session missing", {
      flow: "server_action_get_user",
      ...(userError ? getSafeAuthErrorDetails(userError) : {})
    });

    return {
      error:
        "No pudimos validar tu sesión. Abrí el enlace más reciente del email o pedí una nueva invitación."
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    const details = getSafeAuthErrorDetails(error);
    console.error("ICM update password failure", details);

    return {
      error: `No se pudo actualizar la contraseña. Detalle: ${formatSafeAuthErrorDetails(
        details
      )}`
    };
  }

  if (isInvite) {
    redirect("/onboarding");
  }

  await supabase.auth.signOut();
  redirect("/login?password=updated");
}
