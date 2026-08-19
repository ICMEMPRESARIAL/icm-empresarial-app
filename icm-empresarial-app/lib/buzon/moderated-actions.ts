"use server";

import {
  createCorrespondenciaAction,
  replyCorrespondenciaAction,
  type CreateCorrespondenciaFormState,
  type ReplyCorrespondenciaFormState
} from "@/lib/buzon/actions";
import { getUserProfile } from "@/lib/auth/get-user-profile";
import { moderateEducationalMessage } from "@/lib/buzon/moderation";
import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/audit/log-action";

function getFormString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

async function recordBlockedMessage({
  categorias,
  contenido,
  correspondenciaId,
  destinatarioEmpresaId,
  source,
  tipo
}: {
  categorias: Record<string, boolean>;
  contenido: string;
  correspondenciaId?: string | null;
  destinatarioEmpresaId?: string | null;
  source: string;
  tipo: "nuevo_mensaje" | "respuesta";
}) {
  const session = await getUserProfile();
  if (!session.user || !session.profile) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("moderation_incidents").insert({
    actor_id: session.user.id,
    categorias,
    contenido_excerpt: contenido.slice(0, 500),
    correspondencia_id: correspondenciaId ?? null,
    destinatario_empresa_id: destinatarioEmpresaId ?? null,
    empresa_id: session.profile.empresa_id,
    fuente: source,
    resultado: "bloqueado",
    tipo
  });

  const categoriasBloqueadas = Object.entries(categorias)
    .filter(([, flagged]) => flagged)
    .map(([categoria]) => categoria);

  await logAction({
    accion: "mensaje_bloqueado_moderacion",
    actorId: session.user.id,
    detalle: {
      categorias: categoriasBloqueadas,
      correspondencia_id: correspondenciaId ?? null,
      destinatario_empresa_id: destinatarioEmpresaId ?? null,
      tipo
    },
    objeto: "moderation_incident"
  });
}

export async function createModeratedCorrespondenciaAction(
  previousState: CreateCorrespondenciaFormState,
  formData: FormData
): Promise<CreateCorrespondenciaFormState> {
  const asunto = getFormString(formData, "asunto");
  const contenido = getFormString(formData, "contenido");
  const destinatarioEmpresaId = getFormString(
    formData,
    "destinatario_empresa_id"
  );

  if (contenido.length >= 5) {
    try {
      const moderation = await moderateEducationalMessage(
        `${asunto}\n\n${contenido}`
      );

      if (!moderation.allowed) {
        await recordBlockedMessage({
          categorias: moderation.categories,
          contenido: `${asunto}\n\n${contenido}`,
          destinatarioEmpresaId,
          source: moderation.source,
          tipo: "nuevo_mensaje"
        });

        return {
          error:
            moderation.reason ??
            "El mensaje no cumple las normas de convivencia de ICM Empresarial. Revisalo antes de enviarlo.",
          fieldErrors: {
            contenido: "Revisá el vocabulario y el tono del mensaje."
          }
        };
      }
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo verificar el mensaje. Intentá nuevamente.",
        fieldErrors: {}
      };
    }
  }

  return createCorrespondenciaAction(previousState, formData);
}

export async function replyModeratedCorrespondenciaAction(
  previousState: ReplyCorrespondenciaFormState,
  formData: FormData
): Promise<ReplyCorrespondenciaFormState> {
  const contenido = getFormString(formData, "contenido");
  const correspondenciaId = getFormString(formData, "correspondencia_id");

  if (contenido.length >= 5) {
    try {
      const moderation = await moderateEducationalMessage(contenido);

      if (!moderation.allowed) {
        await recordBlockedMessage({
          categorias: moderation.categories,
          contenido,
          correspondenciaId,
          source: moderation.source,
          tipo: "respuesta"
        });

        return {
          error:
            moderation.reason ??
            "La respuesta no cumple las normas de convivencia de ICM Empresarial.",
          fieldErrors: {
            contenido: "Revisá el vocabulario y el tono de la respuesta."
          }
        };
      }
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo verificar la respuesta. Intentá nuevamente.",
        fieldErrors: {}
      };
    }
  }

  return replyCorrespondenciaAction(previousState, formData);
}
