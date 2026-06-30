"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { logAction } from "@/lib/audit/log-action";
import { createClient } from "@/lib/supabase/server";
import type {
  SolicitudRegistro,
  TipoEntidadRegistro
} from "@/lib/admin/solicitudes/queries";
import type { EmpresaTipo } from "@/lib/empresas/types";

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

function getSolicitudId(formData: FormData) {
  const solicitudId = getRequiredString(formData, "solicitud_id");

  if (!uuidPattern.test(solicitudId)) {
    throw new Error("La solicitud seleccionada no es valida.");
  }

  return solicitudId;
}

async function requireAdminUser() {
  const session = await requireAuth();

  if (session.profile.rol !== "profesora_admin") {
    throw new Error("Solo la profesora administradora puede revisar solicitudes.");
  }

  return session;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function mapTipoEntidad(tipo: TipoEntidadRegistro): EmpresaTipo {
  if (tipo === "banco") {
    return "organismo";
  }

  return tipo;
}

async function getSolicitud(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes_registro")
    .select("*")
    .eq("id", id)
    .maybeSingle<SolicitudRegistro>();

  if (error) {
    throw new Error(`No se pudo cargar la solicitud: ${error.message}`);
  }

  if (!data) {
    throw new Error("La solicitud no existe.");
  }

  return data;
}

async function getAvailableSlug(baseName: string) {
  const supabase = await createClient();
  const baseSlug = slugify(baseName) || "entidad";
  let candidate = baseSlug;
  let suffix = 1;

  while (suffix < 100) {
    const { data, error } = await supabase
      .from("empresas")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new Error(`No se pudo validar slug: ${error.message}`);
    }

    if (!data) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }

  throw new Error("No se pudo generar un slug disponible.");
}

export async function approveSolicitudAction(formData: FormData) {
  const { user } = await requireAdminUser();
  const solicitudId = getSolicitudId(formData);
  const observaciones = getOptionalString(formData, "observaciones_admin");
  const solicitud = await getSolicitud(solicitudId);

  if (solicitud.estado !== "pendiente") {
    throw new Error("La solicitud ya fue revisada.");
  }

  const supabase = await createClient();
  const slug = await getAvailableSlug(solicitud.nombre_entidad);
  const tipo = mapTipoEntidad(solicitud.tipo_entidad);
  const { data: empresa, error: empresaError } = await supabase
    .from("empresas")
    .insert({
      activo: true,
      actividad_principal: solicitud.actividad_principal,
      cuit_simulado: solicitud.cuit_simulado,
      descripcion: solicitud.descripcion,
      domicilio: solicitud.domicilio,
      figura_legal: solicitud.figura_legal,
      curso_anio: solicitud.curso_anio,
      curso_division: solicitud.curso_division,
      integrantes: solicitud.integrantes,
      nombre: solicitud.nombre_entidad,
      nombre_comercial: solicitud.nombre_entidad,
      persona_juridica: solicitud.persona_juridica,
      razon_social: solicitud.nombre_entidad,
      responsable: solicitud.responsable,
      rubro: solicitud.rubro,
      slug,
      socio_responsable:
        solicitud.socio_responsable ?? solicitud.socio_mayor,
      tipo,
      visible_en_directorio: true
    })
    .select("id")
    .single<{ id: string }>();

  if (empresaError) {
    throw new Error(`No se pudo crear la entidad: ${empresaError.message}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      empresa_id: empresa.id,
      estado: "activo"
    })
    .eq("id", solicitud.user_id);

  if (profileError) {
    throw new Error(`No se pudo activar el usuario: ${profileError.message}`);
  }

  const { error: solicitudError } = await supabase
    .from("solicitudes_registro")
    .update({
      estado: "aprobada",
      observaciones_admin: observaciones,
      revisado_at: new Date().toISOString(),
      revisado_por: user.id
    })
    .eq("id", solicitudId);

  if (solicitudError) {
    throw new Error(`No se pudo aprobar la solicitud: ${solicitudError.message}`);
  }

  await logAction({
    accion: "solicitud_aprobada",
    actorId: user.id,
    detalle: {
      empresa_id: empresa.id,
      solicitud_id: solicitudId,
      user_id: solicitud.user_id
    },
    objeto: "solicitudes_registro"
  });

  revalidatePath("/admin/solicitudes");
  revalidatePath(`/admin/solicitudes/${solicitudId}`);
  revalidatePath("/admin/usuarios");
  redirect(`/admin/solicitudes/${solicitudId}`);
}

export async function rejectSolicitudAction(formData: FormData) {
  const { user } = await requireAdminUser();
  const solicitudId = getSolicitudId(formData);
  const observaciones = getOptionalString(formData, "observaciones_admin");
  const solicitud = await getSolicitud(solicitudId);

  if (solicitud.estado !== "pendiente") {
    throw new Error("La solicitud ya fue revisada.");
  }

  const supabase = await createClient();
  const { error: solicitudError } = await supabase
    .from("solicitudes_registro")
    .update({
      estado: "rechazada",
      observaciones_admin: observaciones,
      revisado_at: new Date().toISOString(),
      revisado_por: user.id
    })
    .eq("id", solicitudId);

  if (solicitudError) {
    throw new Error(`No se pudo rechazar la solicitud: ${solicitudError.message}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      estado: "dado_de_baja"
    })
    .eq("id", solicitud.user_id);

  if (profileError) {
    throw new Error(`No se pudo actualizar el usuario: ${profileError.message}`);
  }

  await logAction({
    accion: "solicitud_rechazada",
    actorId: user.id,
    detalle: {
      observaciones,
      solicitud_id: solicitudId,
      user_id: solicitud.user_id
    },
    objeto: "solicitudes_registro"
  });

  revalidatePath("/admin/solicitudes");
  revalidatePath(`/admin/solicitudes/${solicitudId}`);
  revalidatePath("/admin/usuarios");
  redirect(`/admin/solicitudes/${solicitudId}`);
}
