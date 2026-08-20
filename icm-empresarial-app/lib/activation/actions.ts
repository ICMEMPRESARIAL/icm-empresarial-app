"use server";

import { redirect } from "next/navigation";
import { getActivationInviteByToken, findAuthUserByEmail } from "@/lib/activation/invites";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActivationFormState = {
  error: string | null;
};

function getString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "No se pudo activar la cuenta.";
}

function userMetadataForInvite(
  email: string,
  role: "empresa" | "profesora_admin",
  empresaId: string | null,
  nombre: string
) {
  return {
    empresa_id: empresaId,
    empresa_nombre: nombre,
    icm_activation: true,
    icm_invite: true,
    icm_role: role,
    nombre
  };
}

export async function activateInviteAction(
  _state: ActivationFormState,
  formData: FormData
): Promise<ActivationFormState> {
  const token = getString(formData, "token");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirm_password");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  let redirectTo = "/login?error=invite_invalid";

  try {
    const activation = await getActivationInviteByToken(token);
    if (activation.status !== "valid" || !activation.invite || !activation.row) {
      const errorByStatus: Record<string, string> = {
        expired: "La invitación venció. Pedí una nueva invitación.",
        invalid: "El enlace de invitación no es válido.",
        missing: "Falta el token de activación.",
        used: "Esta invitación ya fue usada."
      };

      return {
        error:
          errorByStatus[activation.status] ??
          "No pudimos validar el enlace de activación."
      };
    }

    const invite = activation.row;
    const displayName =
      activation.invite.empresaNombre ??
      (typeof invite.metadata.nombre === "string" ? invite.metadata.nombre : null) ??
      invite.email;
    const admin = createAdminClient();
    const existingUser = await findAuthUserByEmail(invite.email);
    const userMetadata = userMetadataForInvite(
      invite.email,
      invite.rol,
      invite.empresa_id,
      displayName
    );
    const authUser = existingUser
      ? await admin.auth.admin.updateUserById(existingUser.id, {
          app_metadata: {
            ...existingUser.app_metadata,
            icm_activation: true
          },
          email_confirm: true,
          password,
          user_metadata: {
            ...existingUser.user_metadata,
            ...userMetadata
          }
        })
      : await admin.auth.admin.createUser({
          app_metadata: {
            icm_activation: true
          },
          email: invite.email,
          email_confirm: true,
          password,
          user_metadata: userMetadata
        });

    if (authUser.error || !authUser.data.user) {
      throw new Error(
        authUser.error?.message ?? "Supabase no devolvio el usuario activado."
      );
    }

    const userId = authUser.data.user.id;
    const { error: profileError } = await admin.from("profiles").upsert({
      empresa_id: invite.empresa_id,
      estado: "activo",
      id: userId,
      nombre: displayName,
      rol: invite.rol
    });

    if (profileError) {
      throw new Error(`No se pudo crear el perfil activo: ${profileError.message}`);
    }

    if (invite.empresa_id) {
      await admin
        .from("empresas")
        .update({ contacto_email: invite.email })
        .eq("id", invite.empresa_id);
    }

    const { data: usedInvite, error: usedError } = await admin
      .from("user_activation_invites")
      .update({
        used_at: new Date().toISOString(),
        used_by: userId
      })
      .eq("id", invite.id)
      .is("used_at", null)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (usedError || !usedInvite) {
      throw new Error("La invitación ya fue usada o no pudo marcarse como usada.");
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: invite.email,
      password
    });

    if (signInError) {
      throw new Error(
        `La cuenta se activó, pero no se pudo iniciar sesión: ${signInError.message}`
      );
    }

    redirectTo = invite.rol === "profesora_admin" ? "/admin" : "/onboarding";
  } catch (error) {
    console.error("ICM activation failure", {
      message: safeErrorMessage(error)
    });
    return {
      error:
        "No se pudo activar la cuenta. Pedí una nueva invitación o avisá a la profesora."
    };
  }

  redirect(redirectTo);
}
