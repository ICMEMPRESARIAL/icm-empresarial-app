"use server";

import { revalidatePath } from "next/cache";
import { assertActiveUserCanOperate } from "@/lib/auth/require-active-profile";
import { logAction } from "@/lib/audit/log-action";
import { createClient } from "@/lib/supabase/server";
import type { EmpresaIntegrante } from "@/lib/empresas/types";

export type UpdateEmpresaProfileState = {
  error: string | null;
  success: string | null;
};

function formString(formData: FormData, field: string) {
  const value = formData.get(field);
  const clean = typeof value === "string" ? value.trim() : "";
  return clean.length > 0 ? clean : null;
}

function parseIntegrantes(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("La lista de integrantes tiene un formato inválido.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("La lista de integrantes debe ser un arreglo.");
  }

  return parsed
    .map((item): EmpresaIntegrante | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const nombre =
        typeof record.nombre === "string" ? record.nombre.trim() : "";
      const rol = typeof record.rol === "string" ? record.rol.trim() : "";
      const email = typeof record.email === "string" ? record.email.trim() : "";

      if (!nombre) {
        return null;
      }

      return {
        email,
        nombre,
        rol
      };
    })
    .filter((item): item is EmpresaIntegrante => Boolean(item));
}

export async function updateEmpresaProfileAction(
  _previousState: UpdateEmpresaProfileState,
  formData: FormData
): Promise<UpdateEmpresaProfileState> {
  const { profile, user } = await assertActiveUserCanOperate(
    "editar perfil de empresa"
  );
  const empresaId = formString(formData, "empresa_id");

  if (!empresaId) {
    return {
      error: "Falta empresa asociada.",
      success: null
    };
  }

  if (profile.rol !== "profesora_admin" && profile.empresa_id !== empresaId) {
    return {
      error: "No tenés permisos para editar esta empresa.",
      success: null
    };
  }

  let integrantes: EmpresaIntegrante[];

  try {
    integrantes = parseIntegrantes(formData.get("integrantes"));
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo leer el equipo.",
      success: null
    };
  }

  const supabase = await createClient();
  const { data: empresa, error: empresaError } = await supabase
    .from("empresas")
    .select("id,slug")
    .eq("id", empresaId)
    .maybeSingle<{ id: string; slug: string }>();

  if (empresaError) {
    return {
      error: `Error de Supabase al buscar la empresa: ${empresaError.message}`,
      success: null
    };
  }

  if (!empresa) {
    return {
      error: "No se encontró la empresa.",
      success: null
    };
  }

  const { error } = await supabase
    .from("empresas")
    .update({
      actividad_principal: formString(formData, "actividad_principal"),
      color_marca: formString(formData, "color_marca"),
      contacto_email: formString(formData, "contacto_email"),
      contacto_telefono: formString(formData, "contacto_telefono"),
      descripcion: formString(formData, "descripcion"),
      domicilio: formString(formData, "domicilio"),
      instagram: formString(formData, "instagram"),
      integrantes,
      nombre_comercial: formString(formData, "nombre_comercial"),
      responsable: formString(formData, "responsable"),
      rubro: formString(formData, "rubro"),
      sitio_web: formString(formData, "sitio_web"),
      slogan: formString(formData, "slogan")
    })
    .eq("id", empresa.id);

  if (error) {
    return {
      error: `Error de Supabase al guardar la empresa: ${error.message}`,
      success: null
    };
  }

  await logAction({
    accion: "empresa_perfil_actualizado",
    actorId: user.id,
    detalle: {
      empresa_id: empresa.id
    },
    objeto: "empresas"
  });

  revalidatePath("/dashboard");
  revalidatePath("/empresas");
  revalidatePath("/organismos");
  revalidatePath("/perfil-empresa");
  revalidatePath(`/empresas/${empresa.slug}`);
  revalidatePath(`/organismos/${empresa.slug}`);

  return {
    error: null,
    success: "Cambios guardados."
  };
}
