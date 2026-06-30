"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { logAction } from "@/lib/audit/log-action";
import { createClient } from "@/lib/supabase/server";
import {
  tramiteEstadoLabels,
  tramiteEstados,
  type TramiteDetail,
  type TramiteEstado
} from "@/lib/tramites/types";

export type CreateTramiteFormState = {
  error: string | null;
  fieldErrors: {
    asunto?: string;
    descripcion?: string;
    tipo_tramite_id?: string;
  };
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRequiredString(formData: FormData, field: string) {
  const value = formData.get(field);

  if (typeof value !== "string") {
    throw new Error(`Falta el campo ${field}.`);
  }

  return value.trim();
}

function getFormString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function assertUuid(value: string, field: string) {
  if (!uuidPattern.test(value)) {
    throw new Error(`El campo ${field} no es valido.`);
  }
}

function isUuid(value: string) {
  return uuidPattern.test(value);
}

function createTramiteError(
  error: string,
  fieldErrors: CreateTramiteFormState["fieldErrors"] = {}
): CreateTramiteFormState {
  return {
    error,
    fieldErrors
  };
}

function parseEstado(value: string): TramiteEstado {
  if (tramiteEstados.includes(value as TramiteEstado)) {
    return value as TramiteEstado;
  }

  throw new Error("El estado del tramite no es valido.");
}

async function assertActiveProfile() {
  const session = await requireAuth();

  if (session.profile.estado !== "activo") {
    if (session.profile.estado === "pendiente") {
      throw new Error("Tu cuenta todavía está pendiente de aprobación.");
    }

    if (session.profile.estado === "suspendido") {
      throw new Error("Tu usuario está suspendido. No podés operar trámites.");
    }

    throw new Error("El usuario fue dado de baja y no puede operar trámites.");
  }

  return session;
}

async function getTramiteForAction(id: string) {
  assertUuid(id, "tramite_id");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tramites")
    .select(
      "id,tipo_tramite_id,solicitante_empresa_id,organismo_empresa_id,estado,asunto,descripcion,numero_expediente,observacion_actual,oculto,created_at,updated_at,finalizado_at"
    )
    .eq("id", id)
    .maybeSingle<TramiteDetail>();

  if (error) {
    throw new Error(`No se pudo cargar el tramite: ${error.message}`);
  }

  if (!data) {
    throw new Error("El tramite no existe o no esta disponible.");
  }

  return data;
}

function isParticipante(empresaId: string | null, tramite: TramiteDetail) {
  return (
    Boolean(empresaId) &&
    (tramite.solicitante_empresa_id === empresaId ||
      tramite.organismo_empresa_id === empresaId)
  );
}

function canManageEstado(
  profileRol: string,
  empresaId: string | null,
  tramite: TramiteDetail
) {
  return (
    profileRol === "profesora_admin" ||
    (Boolean(empresaId) && tramite.organismo_empresa_id === empresaId)
  );
}

async function insertEvento(input: {
  actorEmpresaId: string | null;
  actorId: string;
  descripcion?: string | null;
  estado: TramiteEstado;
  titulo: string;
  tramiteId: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("tramite_eventos").insert({
    actor_empresa_id: input.actorEmpresaId,
    actor_id: input.actorId,
    descripcion: input.descripcion ?? null,
    estado: input.estado,
    titulo: input.titulo,
    tramite_id: input.tramiteId
  });

  if (error) {
    throw new Error(`No se pudo registrar evento: ${error.message}`);
  }
}

async function updateEstado(input: {
  descripcion?: string | null;
  estado: TramiteEstado;
  numeroExpediente?: string | null;
  titulo?: string;
  tramiteId: string;
}) {
  const { profile, user } = await assertActiveProfile();
  const tramite = await getTramiteForAction(input.tramiteId);

  if (!canManageEstado(profile.rol, profile.empresa_id, tramite)) {
    throw new Error("Solo el organismo responsable o la profesora pueden cambiar el estado.");
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tramites")
    .update({
      estado: input.estado,
      finalizado_at: input.estado === "finalizada" ? now : tramite.finalizado_at,
      numero_expediente: input.numeroExpediente ?? tramite.numero_expediente,
      observacion_actual: input.descripcion ?? null,
      updated_at: now
    })
    .eq("id", input.tramiteId);

  if (error) {
    throw new Error(`No se pudo actualizar el tramite: ${error.message}`);
  }

  await insertEvento({
    actorEmpresaId: profile.empresa_id,
    actorId: user.id,
    descripcion: input.descripcion,
    estado: input.estado,
    titulo: input.titulo ?? tramiteEstadoLabels[input.estado],
    tramiteId: input.tramiteId
  });

  await logAction({
    accion: "tramite_estado_actualizado",
    actorId: user.id,
    detalle: {
      estado: input.estado,
      tramite_id: input.tramiteId
    },
    objeto: "tramites"
  });

  revalidatePath("/tramites");
  revalidatePath(`/tramites/${input.tramiteId}`);
  revalidatePath("/admin/tramites");
  revalidatePath(`/admin/tramites/${input.tramiteId}`);
}

export async function createTramiteAction(
  _previousState: CreateTramiteFormState,
  formData: FormData
): Promise<CreateTramiteFormState> {
  const { profile, user } = await requireAuth();

  if (profile.estado === "pendiente") {
    return createTramiteError("Tu cuenta todavía está pendiente de aprobación.");
  }

  if (profile.estado === "suspendido") {
    return createTramiteError("Tu usuario está suspendido. No podés operar trámites.");
  }

  if (profile.estado === "dado_de_baja") {
    return createTramiteError("El usuario fue dado de baja y no puede operar trámites.");
  }

  if (!profile.empresa_id) {
    return createTramiteError("El usuario no tiene una empresa asociada.");
  }

  const tipoTramiteId = getFormString(formData, "tipo_tramite_id");
  const asunto = getFormString(formData, "asunto");
  const descripcion = getFormString(formData, "descripcion");
  const fieldErrors: CreateTramiteFormState["fieldErrors"] = {};

  if (!tipoTramiteId) {
    fieldErrors.tipo_tramite_id = "Seleccioná un trámite.";
  } else if (!isUuid(tipoTramiteId)) {
    fieldErrors.tipo_tramite_id = "El trámite seleccionado no es válido.";
  }

  if (!asunto) {
    fieldErrors.asunto = "Ingresá un asunto.";
  } else if (asunto.length < 3) {
    fieldErrors.asunto = "El asunto debe tener al menos 3 caracteres.";
  }

  if (!descripcion) {
    fieldErrors.descripcion = "Ingresá una descripción.";
  } else if (descripcion.length < 8) {
    fieldErrors.descripcion = "La descripción debe tener al menos 8 caracteres.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return createTramiteError("Revisá los datos del trámite.", fieldErrors);
  }

  const supabase = await createClient();
  const { data: tipo, error: tipoError } = await supabase
    .from("tipos_tramite")
    .select("id,organismo_empresa_id,nombre")
    .eq("id", tipoTramiteId)
    .eq("activo", true)
    .maybeSingle<{
      id: string;
      nombre: string;
      organismo_empresa_id: string;
    }>();

  if (tipoError) {
    return createTramiteError(
      `No se pudo validar el tipo de trámite: ${tipoError.message}`
    );
  }

  if (!tipo) {
    return createTramiteError("El tipo de trámite no está disponible.", {
      tipo_tramite_id: "Seleccioná otro trámite."
    });
  }

  if (tipo.organismo_empresa_id === profile.empresa_id) {
    return createTramiteError("No se puede iniciar un trámite ante la misma entidad.");
  }

  const { data: tramite, error } = await supabase
    .from("tramites")
    .insert({
      asunto,
      created_by: user.id,
      datos_formulario: {},
      descripcion,
      estado: "solicitud_enviada",
      organismo_empresa_id: tipo.organismo_empresa_id,
      prioridad: "normal",
      solicitante_empresa_id: profile.empresa_id,
      titulo: asunto,
      tipo_tramite_id: tipo.id
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    return createTramiteError(`No se pudo crear el trámite: ${error.message}`);
  }

  await insertEvento({
    actorEmpresaId: profile.empresa_id,
    actorId: user.id,
    descripcion: "La empresa inició el trámite.",
    estado: "solicitud_enviada",
    titulo: "Solicitud enviada",
    tramiteId: tramite.id
  });

  await logAction({
    accion: "tramite_creado",
    actorId: user.id,
    detalle: {
      organismo_empresa_id: tipo.organismo_empresa_id,
      solicitante_empresa_id: profile.empresa_id,
      tipo_tramite_id: tipo.id,
      tramite_id: tramite.id
    },
    objeto: "tramites"
  });

  revalidatePath("/tramites");
  redirect(`/tramites/${tramite.id}`);
}

export async function updateTramiteEstadoAction(formData: FormData) {
  const tramiteId = getRequiredString(formData, "tramite_id");
  const estado = parseEstado(getRequiredString(formData, "estado"));
  const descripcion = getOptionalString(formData, "descripcion");
  const numeroExpediente = getOptionalString(formData, "numero_expediente");

  await updateEstado({
    descripcion,
    estado,
    numeroExpediente,
    tramiteId
  });

  redirect(`/tramites/${tramiteId}`);
}

export async function addTramiteEventoAction(formData: FormData) {
  const { profile, user } = await assertActiveProfile();
  const tramiteId = getRequiredString(formData, "tramite_id");
  const estado = parseEstado(getRequiredString(formData, "estado"));
  const titulo = getRequiredString(formData, "titulo");
  const descripcion = getOptionalString(formData, "descripcion");
  const tramite = await getTramiteForAction(tramiteId);

  if (!isParticipante(profile.empresa_id, tramite) && profile.rol !== "profesora_admin") {
    throw new Error("No tenés permisos para agregar eventos.");
  }

  await insertEvento({
    actorEmpresaId: profile.empresa_id,
    actorId: user.id,
    descripcion,
    estado,
    titulo,
    tramiteId
  });

  await logAction({
    accion: "tramite_evento_agregado",
    actorId: user.id,
    detalle: {
      estado,
      tramite_id: tramiteId
    },
    objeto: "tramite_eventos"
  });

  revalidatePath(`/tramites/${tramiteId}`);
  redirect(`/tramites/${tramiteId}`);
}

export async function addTramiteComentarioAction(formData: FormData) {
  const { profile, user } = await assertActiveProfile();
  const tramiteId = getRequiredString(formData, "tramite_id");
  const contenido = getRequiredString(formData, "contenido");
  const tramite = await getTramiteForAction(tramiteId);

  if (!isParticipante(profile.empresa_id, tramite) && profile.rol !== "profesora_admin") {
    throw new Error("No tenés permisos para comentar este trámite.");
  }

  if (contenido.length < 3) {
    throw new Error("El comentario debe tener al menos 3 caracteres.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tramite_comentarios").insert({
    actor_empresa_id: profile.empresa_id,
    actor_id: user.id,
    contenido,
    tramite_id: tramiteId
  });

  if (error) {
    throw new Error(`No se pudo agregar comentario: ${error.message}`);
  }

  await logAction({
    accion: "tramite_comentario_agregado",
    actorId: user.id,
    detalle: {
      tramite_id: tramiteId
    },
    objeto: "tramite_comentarios"
  });

  revalidatePath(`/tramites/${tramiteId}`);
  revalidatePath(`/admin/tramites/${tramiteId}`);
  redirect(`/tramites/${tramiteId}`);
}

export async function addTramiteAdjuntoAction(formData: FormData) {
  const { profile, user } = await assertActiveProfile();
  const tramiteId = getRequiredString(formData, "tramite_id");
  const nombreArchivo = getRequiredString(formData, "nombre_archivo");
  const url = getOptionalString(formData, "url");
  const descripcion = getOptionalString(formData, "descripcion");
  const tramite = await getTramiteForAction(tramiteId);

  if (!isParticipante(profile.empresa_id, tramite) && profile.rol !== "profesora_admin") {
    throw new Error("No tenés permisos para adjuntar documentación.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tramite_adjuntos").insert({
    actor_empresa_id: profile.empresa_id,
    actor_id: user.id,
    descripcion,
    nombre_archivo: nombreArchivo,
    tramite_id: tramiteId,
    url
  });

  if (error) {
    throw new Error(`No se pudo agregar adjunto: ${error.message}`);
  }

  if (
    tramite.estado === "documentacion_requerida" &&
    tramite.solicitante_empresa_id === profile.empresa_id
  ) {
    const now = new Date().toISOString();
    const { error: estadoError } = await supabase
      .from("tramites")
      .update({
        estado: "documentacion_enviada",
        observacion_actual: "El solicitante adjuntó documentación requerida.",
        updated_at: now
      })
      .eq("id", tramiteId);

    if (estadoError) {
      throw new Error(`No se pudo actualizar documentación: ${estadoError.message}`);
    }

    await insertEvento({
      actorEmpresaId: profile.empresa_id,
      actorId: user.id,
      descripcion: "El solicitante adjuntó documentación requerida.",
      estado: "documentacion_enviada",
      titulo: "Documentación enviada",
      tramiteId
    });
  }

  await logAction({
    accion: "tramite_adjunto_agregado",
    actorId: user.id,
    detalle: {
      tramite_id: tramiteId
    },
    objeto: "tramite_adjuntos"
  });

  revalidatePath(`/tramites/${tramiteId}`);
  revalidatePath(`/admin/tramites/${tramiteId}`);
  redirect(`/tramites/${tramiteId}`);
}

export async function requestDocumentacionAction(formData: FormData) {
  const tramiteId = getRequiredString(formData, "tramite_id");
  const descripcion =
    getOptionalString(formData, "descripcion") ??
    "El organismo solicitó documentación adicional.";

  await updateEstado({
    descripcion,
    estado: "documentacion_requerida",
    titulo: "Documentación requerida",
    tramiteId
  });

  redirect(`/tramites/${tramiteId}`);
}

export async function approveTramiteAction(formData: FormData) {
  const tramiteId = getRequiredString(formData, "tramite_id");
  const descripcion = getOptionalString(formData, "descripcion");

  await updateEstado({
    descripcion,
    estado: "aprobada",
    titulo: "Trámite aprobado",
    tramiteId
  });

  redirect(`/tramites/${tramiteId}`);
}

export async function rejectTramiteAction(formData: FormData) {
  const tramiteId = getRequiredString(formData, "tramite_id");
  const descripcion =
    getOptionalString(formData, "descripcion") ??
    "El trámite fue rechazado por el organismo.";

  await updateEstado({
    descripcion,
    estado: "rechazada",
    titulo: "Trámite rechazado",
    tramiteId
  });

  redirect(`/tramites/${tramiteId}`);
}

export async function finalizeTramiteAction(formData: FormData) {
  const tramiteId = getRequiredString(formData, "tramite_id");
  const descripcion = getOptionalString(formData, "descripcion");

  await updateEstado({
    descripcion,
    estado: "finalizada",
    titulo: "Trámite finalizado",
    tramiteId
  });

  redirect(`/tramites/${tramiteId}`);
}
