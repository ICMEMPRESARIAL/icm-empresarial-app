"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { logAction } from "@/lib/audit/log-action";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getCorrespondenciaId(formData: FormData) {
  const value = formData.get("correspondencia_id");

  if (typeof value !== "string" || !uuidPattern.test(value)) {
    throw new Error("La correspondencia no es valida.");
  }

  return value;
}

async function requireAdmin() {
  const { profile, user } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    throw new Error("Solo la profesora administradora puede moderar.");
  }

  return { profile, user };
}

export async function hideCorrespondenciaAction(formData: FormData) {
  const { user } = await requireAdmin();
  const correspondenciaId = getCorrespondenciaId(formData);
  const supabase = await createClient();

  const { error } = await supabase
    .from("correspondencia")
    .update({ oculto: true })
    .eq("id", correspondenciaId);

  if (error) {
    throw new Error(`No se pudo ocultar correspondencia: ${error.message}`);
  }

  await logAction({
    accion: "correspondencia_ocultada",
    actorId: user.id,
    detalle: {
      correspondencia_id: correspondenciaId
    },
    objeto: "correspondencia"
  });

  revalidatePath("/admin/correspondencia");
  revalidatePath(`/admin/correspondencia/${correspondenciaId}`);
  redirect(`/admin/correspondencia/${correspondenciaId}`);
}

export async function restoreCorrespondenciaAction(formData: FormData) {
  const { user } = await requireAdmin();
  const correspondenciaId = getCorrespondenciaId(formData);
  const supabase = await createClient();

  const { error } = await supabase
    .from("correspondencia")
    .update({ oculto: false })
    .eq("id", correspondenciaId);

  if (error) {
    throw new Error(`No se pudo restaurar correspondencia: ${error.message}`);
  }

  await logAction({
    accion: "correspondencia_restaurada",
    actorId: user.id,
    detalle: {
      correspondencia_id: correspondenciaId
    },
    objeto: "correspondencia"
  });

  revalidatePath("/admin/correspondencia");
  revalidatePath(`/admin/correspondencia/${correspondenciaId}`);
  redirect(`/admin/correspondencia/${correspondenciaId}`);
}
