"use server";

import { revalidatePath } from "next/cache";
import { assertActiveUserCanOperate } from "@/lib/auth/require-active-profile";
import { logAction } from "@/lib/audit/log-action";
import { createClient } from "@/lib/supabase/server";

async function saveEmpresaMediaUrl(
  empresaId: string,
  field: "logo_url" | "banner_url",
  url: string
) {
  const { profile, user } = await assertActiveUserCanOperate(
    "modificar identidad visual"
  );

  if (profile.rol !== "profesora_admin" && profile.empresa_id !== empresaId) {
    throw new Error("No tenés permisos para modificar esta empresa.");
  }

  const supabase = await createClient();
  const { data: empresa, error: empresaError } = await supabase
    .from("empresas")
    .select("id,slug")
    .eq("id", empresaId)
    .maybeSingle<{ id: string; slug: string }>();

  if (empresaError) {
    throw new Error(`No se pudo validar empresa: ${empresaError.message}`);
  }

  if (!empresa) {
    throw new Error("La empresa no existe.");
  }

  const { error } = await supabase
    .from("empresas")
    .update({ [field]: url })
    .eq("id", empresaId);

  if (error) {
    throw new Error(`No se pudo guardar la imagen: ${error.message}`);
  }

  await logAction({
    accion: field === "logo_url" ? "empresa_logo_actualizado" : "empresa_banner_actualizado",
    actorId: user.id,
    detalle: { empresa_id: empresaId },
    objeto: "empresas"
  });

  revalidatePath("/dashboard");
  revalidatePath("/perfil-empresa");
  revalidatePath(`/empresas/${empresa.slug}`);
}

export async function saveEmpresaLogoUrlAction(empresaId: string, url: string) {
  await saveEmpresaMediaUrl(empresaId, "logo_url", url);
}

export async function saveEmpresaBannerUrlAction(empresaId: string, url: string) {
  await saveEmpresaMediaUrl(empresaId, "banner_url", url);
}
