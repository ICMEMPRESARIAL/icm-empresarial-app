"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/require-auth";
import { logAction } from "@/lib/audit/log-action";
import { createClient } from "@/lib/supabase/server";
import type { ConductaEstado } from "@/lib/auth/get-user-profile";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRequiredString(formData: FormData, field: string) {
  const value = formData.get(field);

  if (typeof value !== "string") {
    throw new Error(`Falta el campo ${field}.`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getProfileId(formData: FormData) {
  const profileId = getRequiredString(formData, "profile_id");

  if (!uuidPattern.test(profileId)) {
    throw new Error("El usuario seleccionado no es valido.");
  }

  return profileId;
}

async function requireAdminUser() {
  const session = await requireAuth();

  if (session.profile.rol !== "profesora_admin") {
    throw new Error("Solo la profesora administradora puede moderar usuarios.");
  }

  return session;
}

async function getModeratedProfile(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,empresa_id,estado,cantidad_suspensiones")
    .eq("id", profileId)
    .maybeSingle<{
      empresa_id: string | null;
      estado: string;
      id: string;
      cantidad_suspensiones: number;
    }>();

  if (error) {
    throw new Error(`No se pudo cargar el usuario: ${error.message}`);
  }

  if (!data) {
    throw new Error("El usuario no existe.");
  }

  return data;
}

function calculateSuspensionUntil(formData: FormData) {
  const duration = getOptionalString(formData, "duracion") ?? "indefinida";
  const now = Date.now();

  if (duration === "1_dia") return new Date(now + 24 * 60 * 60 * 1000).toISOString();
  if (duration === "3_dias") return new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString();
  if (duration === "7_dias") return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
  if (duration === "personalizada") {
    const custom = getOptionalString(formData, "suspendido_hasta");
    return custom ? new Date(custom).toISOString() : null;
  }

  return null;
}

function conductaForSuspension(previousCount: number): ConductaEstado {
  return previousCount > 0 ? "reincidente" : "suspendido_previamente";
}

export async function suspendUserAction(formData: FormData) {
  const { user } = await requireAdminUser();
  const profileId = getProfileId(formData);
  const motivo = getRequiredString(formData, "motivo");
  const detalle = getOptionalString(formData, "detalle");
  const suspendidoHasta = calculateSuspensionUntil(formData);
  const moderatedProfile = await getModeratedProfile(profileId);

  if (profileId === user.id) {
    throw new Error("No podés suspender tu propia cuenta administradora.");
  }

  if (motivo.length < 3) {
    throw new Error("El motivo de suspensión debe tener al menos 3 caracteres.");
  }

  if (!moderatedProfile.empresa_id) {
    throw new Error("Solo se pueden suspender usuarios con entidad asociada.");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const nextCount = (moderatedProfile.cantidad_suspensiones ?? 0) + 1;
  const { error } = await supabase
    .from("profiles")
    .update({
      cantidad_suspensiones: nextCount,
      conducta_estado: conductaForSuspension(
        moderatedProfile.cantidad_suspensiones ?? 0
      ),
      estado: "suspendido",
      suspendido_at: now,
      suspendido_hasta: suspendidoHasta,
      suspendido_motivo: motivo,
      suspendido_por: user.id,
      ultima_suspension_at: now
    })
    .eq("id", profileId);

  if (error) {
    throw new Error(`No se pudo suspender el usuario: ${error.message}`);
  }

  const { error: suspensionError } = await supabase
    .from("user_suspensiones")
    .insert({
      detalle,
      empresa_id: moderatedProfile.empresa_id,
      motivo,
      suspendido_hasta: suspendidoHasta,
      suspendido_por: user.id,
      user_id: profileId
    });

  if (suspensionError) {
    throw new Error(
      `El usuario fue suspendido, pero no se pudo guardar el historial: ${suspensionError.message}`
    );
  }

  await logAction({
    accion: "usuario_suspendido",
    actorId: user.id,
    detalle: {
      motivo,
      profile_id: profileId,
      suspendido_hasta: suspendidoHasta
    },
    objeto: "profile"
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/correspondencia");
}

export async function reactivateUserAction(formData: FormData) {
  const { user } = await requireAdminUser();
  const profileId = getProfileId(formData);
  const moderatedProfile = await getModeratedProfile(profileId);

  if (profileId === user.id) {
    throw new Error("No podés rehabilitar tu propia cuenta administradora.");
  }

  if (!moderatedProfile.empresa_id) {
    throw new Error("No se puede rehabilitar como activo sin entidad asociada.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      estado: "activo",
      suspendido_at: null,
      suspendido_hasta: null,
      suspendido_motivo: null,
      suspendido_por: null
    })
    .eq("id", profileId);

  if (error) {
    throw new Error(`No se pudo rehabilitar el usuario: ${error.message}`);
  }

  await supabase
    .from("user_suspensiones")
    .update({
      estado: "levantada",
      levantada_at: new Date().toISOString(),
      levantada_por: user.id
    })
    .eq("user_id", profileId)
    .eq("estado", "activa");

  await logAction({
    accion: "usuario_rehabilitado",
    actorId: user.id,
    detalle: {
      profile_id: profileId
    },
    objeto: "profile"
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/correspondencia");
}

export async function updateConductaUsuarioAction(formData: FormData) {
  const { user } = await requireAdminUser();
  const profileId = getProfileId(formData);
  const conducta = getRequiredString(formData, "conducta") as ConductaEstado;
  const observacion = getOptionalString(formData, "conducta_observacion");

  if (
    ![
      "excelente",
      "observado",
      "suspendido_previamente",
      "reincidente",
      "grave"
    ].includes(conducta)
  ) {
    throw new Error("El estado de conducta no es válido.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      conducta_estado: conducta,
      conducta_observacion: observacion
    })
    .eq("id", profileId);

  if (error) {
    throw new Error(`No se pudo actualizar conducta: ${error.message}`);
  }

  await logAction({
    accion: "usuario_conducta_actualizada",
    actorId: user.id,
    detalle: {
      conducta,
      profile_id: profileId
    },
    objeto: "profile"
  });

  revalidatePath("/admin/usuarios");
}

export async function deactivateUserAction(formData: FormData) {
  const { user } = await requireAdminUser();
  const profileId = getProfileId(formData);

  if (profileId === user.id) {
    throw new Error("No podés dar de baja tu propia cuenta administradora.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      estado: "dado_de_baja"
    })
    .eq("id", profileId);

  if (error) {
    throw new Error(`No se pudo dar de baja el usuario: ${error.message}`);
  }

  await logAction({
    accion: "usuario_dado_de_baja",
    actorId: user.id,
    detalle: {
      profile_id: profileId
    },
    objeto: "profile"
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/correspondencia");
}
