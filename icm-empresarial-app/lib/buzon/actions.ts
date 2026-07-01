"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getUserProfile } from "@/lib/auth/get-user-profile";
import { assertActiveUserCanOperate } from "@/lib/auth/require-active-profile";
import { logAction } from "@/lib/audit/log-action";
import { createClient } from "@/lib/supabase/server";
import {
  correspondenciaTipos,
  type CorrespondenciaDetail,
  type CorrespondenciaTipo
} from "@/lib/buzon/types";

export type CreateCorrespondenciaFormState = {
  error: string | null;
  fieldErrors: {
    asunto?: string;
    contenido?: string;
    destinatario_empresa_id?: string;
    tipo?: string;
  };
};

export type ReplyCorrespondenciaFormState = {
  error: string | null;
  fieldErrors: {
    contenido?: string;
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

function isUuid(value: string) {
  return uuidPattern.test(value);
}

function assertUuid(value: string, field: string) {
  if (!uuidPattern.test(value)) {
    throw new Error(`El campo ${field} no es valido.`);
  }
}

function createCorrespondenciaError(
  error: string,
  fieldErrors: CreateCorrespondenciaFormState["fieldErrors"] = {}
): CreateCorrespondenciaFormState {
  return {
    error,
    fieldErrors
  };
}

function replyCorrespondenciaError(
  error: string,
  fieldErrors: ReplyCorrespondenciaFormState["fieldErrors"] = {}
): ReplyCorrespondenciaFormState {
  return {
    error,
    fieldErrors
  };
}

async function getMensajeForAction(id: string) {
  assertUuid(id, "id");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("correspondencia")
    .select(
      "id,remitente_empresa_id,destinatario_empresa_id,tipo,asunto,contenido,estado,reportado,oculto,created_at,read_at"
    )
    .eq("id", id)
    .maybeSingle<CorrespondenciaDetail>();

  if (error) {
    throw new Error(`No se pudo cargar la correspondencia: ${error.message}`);
  }

  if (!data) {
    throw new Error("La correspondencia no existe o no esta disponible.");
  }

  return data;
}

function isParticipante(
  empresaId: string | null,
  mensaje: Pick<
    CorrespondenciaDetail,
    "remitente_empresa_id" | "destinatario_empresa_id"
  >
) {
  return (
    Boolean(empresaId) &&
    (mensaje.remitente_empresa_id === empresaId ||
      mensaje.destinatario_empresa_id === empresaId)
  );
}

async function getAuthForBuzonMutation() {
  const session = await getUserProfile();

  if (!session.user) {
    redirect("/login");
  }

  if (!session.profile) {
    throw new Error(
      "El usuario autenticado no tiene un perfil asignado en profiles."
    );
  }

  return {
    profile: session.profile,
    user: session.user
  };
}

export async function createCorrespondenciaAction(
  _previousState: CreateCorrespondenciaFormState,
  formData: FormData
): Promise<CreateCorrespondenciaFormState> {
  const { profile, user } = await getAuthForBuzonMutation();

  try {
    await assertActiveUserCanOperate(
      "enviar mensajes",
      "intento_envio_usuario_suspendido"
    );
  } catch (error) {
    return createCorrespondenciaError(
      error instanceof Error
        ? error.message
        : "No podés enviar mensajes con este usuario."
    );
  }

  if (!profile.empresa_id) {
    return createCorrespondenciaError(
      "El usuario no tiene una empresa asociada para enviar."
    );
  }

  const destinatarioEmpresaId = getFormString(
    formData,
    "destinatario_empresa_id"
  );
  const tipoValue = getFormString(formData, "tipo");
  const asunto = getFormString(formData, "asunto");
  const contenido = getFormString(formData, "contenido");
  const fieldErrors: CreateCorrespondenciaFormState["fieldErrors"] = {};

  if (!destinatarioEmpresaId) {
    fieldErrors.destinatario_empresa_id = "Seleccioná un destinatario.";
  } else if (!isUuid(destinatarioEmpresaId)) {
    fieldErrors.destinatario_empresa_id = "El destinatario no es válido.";
  }

  if (!tipoValue) {
    fieldErrors.tipo = "Seleccioná un tipo de mensaje.";
  } else if (!correspondenciaTipos.includes(tipoValue as CorrespondenciaTipo)) {
    fieldErrors.tipo = "El tipo de mensaje no es válido.";
  }

  if (!asunto) {
    fieldErrors.asunto = "Ingresá un asunto.";
  } else if (asunto.length < 3) {
    fieldErrors.asunto = "El asunto debe tener al menos 3 caracteres.";
  }

  if (!contenido) {
    fieldErrors.contenido = "Ingresá el contenido del mensaje.";
  } else if (contenido.length < 5) {
    fieldErrors.contenido = "El contenido debe tener al menos 5 caracteres.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return createCorrespondenciaError("Revisá los datos del mensaje.", fieldErrors);
  }

  if (destinatarioEmpresaId === profile.empresa_id) {
    return createCorrespondenciaError(
      "No se puede enviar correspondencia a la misma empresa.",
      {
        destinatario_empresa_id: "Elegí otra empresa u organismo."
      }
    );
  }

  const tipo = tipoValue as CorrespondenciaTipo;
  const supabase = await createClient();
  const { data: destinatario, error: destinatarioError } = await supabase
    .from("empresas")
    .select("id")
    .eq("id", destinatarioEmpresaId)
    .eq("activo", true)
    .eq("visible_en_directorio", true)
    .maybeSingle<{ id: string }>();

  if (destinatarioError) {
    return createCorrespondenciaError(
      `No se pudo validar destinatario: ${destinatarioError.message}`
    );
  }

  if (!destinatario) {
    return createCorrespondenciaError("El destinatario no está disponible.", {
      destinatario_empresa_id: "Seleccioná otro destinatario."
    });
  }

  const { data, error } = await supabase
    .from("correspondencia")
    .insert({
      asunto,
      contenido,
      destinatario_empresa_id: destinatarioEmpresaId,
      remitente_empresa_id: profile.empresa_id,
      tipo
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    return createCorrespondenciaError(
      `No se pudo crear la correspondencia: ${error.message}`
    );
  }

  await logAction({
    accion: "correspondencia_creada",
    actorId: user.id,
    detalle: {
      correspondencia_id: data.id,
      destinatario_empresa_id: destinatarioEmpresaId,
      remitente_empresa_id: profile.empresa_id,
      tipo
    },
    objeto: "correspondencia"
  });

  revalidatePath("/buzon");
  redirect(`/buzon/${data.id}`);
}

export async function markCorrespondenciaAsReadAction(id: string) {
  const { profile, user } = await requireAuth();
  const mensaje = await getMensajeForAction(id);

  const canRead =
    profile.rol === "profesora_admin" ||
    mensaje.destinatario_empresa_id === profile.empresa_id;

  if (!canRead) {
    throw new Error("No tenes permisos para marcar esta correspondencia.");
  }

  if (mensaje.estado !== "enviado") {
    return false;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("correspondencia")
    .update({
      estado: "leido",
      read_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo marcar como leida: ${error.message}`);
  }

  await logAction({
    accion: "correspondencia_leida",
    actorId: user.id,
    detalle: {
      correspondencia_id: id
    },
    objeto: "correspondencia"
  });

  revalidatePath("/buzon");
  revalidatePath(`/buzon/${id}`);
  return true;
}

export async function replyCorrespondenciaAction(
  _previousState: ReplyCorrespondenciaFormState,
  formData: FormData
): Promise<ReplyCorrespondenciaFormState> {
  const { profile, user } = await getAuthForBuzonMutation();

  try {
    await assertActiveUserCanOperate(
      "responder mensajes",
      "intento_respuesta_usuario_suspendido"
    );
  } catch (error) {
    return replyCorrespondenciaError(
      error instanceof Error
        ? error.message
        : "No podés responder mensajes con este usuario."
    );
  }

  const correspondenciaId = getFormString(formData, "correspondencia_id");
  const contenido = getFormString(formData, "contenido");
  const redirectTo = getFormString(formData, "redirect_to");

  if (!isUuid(correspondenciaId)) {
    return replyCorrespondenciaError("La conversación no es válida.");
  }

  if (!contenido) {
    return replyCorrespondenciaError("Ingresá una respuesta.", {
      contenido: "La respuesta es obligatoria."
    });
  }

  if (contenido.length < 5) {
    return replyCorrespondenciaError(
      "La respuesta debe tener al menos 5 caracteres.",
      {
        contenido: "Escribí una respuesta un poco más completa."
      }
    );
  }

  if (!profile.empresa_id) {
    if (profile.rol === "profesora_admin") {
      return replyCorrespondenciaError(
        "Para responder correspondencia, la cuenta administradora debe estar asociada a un organismo interno."
      );
    }

    return replyCorrespondenciaError(
      "El usuario no tiene una empresa asociada para responder."
    );
  }

  const mensaje = await getMensajeForAction(correspondenciaId);
  const canReply =
    profile.rol === "profesora_admin" ||
    isParticipante(profile.empresa_id, mensaje);

  if (!canReply) {
    return replyCorrespondenciaError(
      "No tenés permisos para responder esta correspondencia."
    );
  }

  const supabase = await createClient();
  const { data: respuesta, error: respuestaError } = await supabase
    .from("correspondencia_respuestas")
    .insert({
      contenido,
      correspondencia_id: correspondenciaId,
      empresa_id: profile.empresa_id
    })
    .select("id")
    .single<{ id: string }>();

  if (respuestaError) {
    return replyCorrespondenciaError(
      `No se pudo responder: ${respuestaError.message}`
    );
  }

  const { error: estadoError } = await supabase
    .from("correspondencia")
    .update({
      estado: "respondido"
    })
    .eq("id", correspondenciaId);

  if (estadoError) {
    return replyCorrespondenciaError(
      `No se pudo actualizar estado: ${estadoError.message}`
    );
  }

  await logAction({
    accion: "correspondencia_respondida",
    actorId: user.id,
    detalle: {
      correspondencia_id: correspondenciaId,
      empresa_id: profile.empresa_id,
      respuesta_id: respuesta.id
    },
    objeto: "correspondencia_respuestas"
  });

  revalidatePath("/buzon");
  revalidatePath(`/buzon/${correspondenciaId}`);
  revalidatePath(`/admin/correspondencia/${correspondenciaId}`);
  redirect(redirectTo || `/buzon/${correspondenciaId}`);
}

export async function archiveCorrespondenciaAction(formData: FormData) {
  const { profile, user } = await assertActiveUserCanOperate(
    "archivar correspondencia"
  );
  const correspondenciaId = getRequiredString(formData, "correspondencia_id");
  const mensaje = await getMensajeForAction(correspondenciaId);
  const canArchive =
    profile.rol === "profesora_admin" ||
    isParticipante(profile.empresa_id, mensaje);

  if (!canArchive) {
    throw new Error("No tenes permisos para archivar esta correspondencia.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("correspondencia")
    .update({
      estado: "archivado"
    })
    .eq("id", correspondenciaId);

  if (error) {
    throw new Error(`No se pudo archivar: ${error.message}`);
  }

  await logAction({
    accion: "correspondencia_archivada",
    actorId: user.id,
    detalle: {
      correspondencia_id: correspondenciaId
    },
    objeto: "correspondencia"
  });

  revalidatePath("/buzon");
  revalidatePath(`/buzon/${correspondenciaId}`);
  redirect("/buzon?filter=archivados");
}

export async function reportCorrespondenciaAction(formData: FormData) {
  const { profile, user } = await assertActiveUserCanOperate(
    "reportar correspondencia"
  );
  const correspondenciaId = getRequiredString(formData, "correspondencia_id");
  const mensaje = await getMensajeForAction(correspondenciaId);

  if (!isParticipante(profile.empresa_id, mensaje)) {
    throw new Error("Solo participantes pueden reportar correspondencia.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("correspondencia")
    .update({
      reportado: true
    })
    .eq("id", correspondenciaId);

  if (error) {
    throw new Error(`No se pudo reportar: ${error.message}`);
  }

  await logAction({
    accion: "correspondencia_reportada",
    actorId: user.id,
    detalle: {
      correspondencia_id: correspondenciaId
    },
    objeto: "correspondencia"
  });

  revalidatePath("/buzon");
  revalidatePath(`/buzon/${correspondenciaId}`);
  redirect(`/buzon/${correspondenciaId}`);
}
