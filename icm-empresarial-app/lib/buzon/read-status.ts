import { logAction } from "@/lib/audit/log-action";
import { getUserProfile } from "@/lib/auth/get-user-profile";
import { createClient } from "@/lib/supabase/server";
import type { CorrespondenciaEstado } from "@/lib/buzon/types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ReadStatusRow = {
  id: string;
  destinatario_empresa_id: string;
  estado: CorrespondenciaEstado;
};

export async function markCorrespondenciaAsReadOnOpen(id: string) {
  try {
    if (!uuidPattern.test(id)) {
      return false;
    }

    const { profile, user } = await getUserProfile();

    if (!profile || !user) {
      return false;
    }

    const supabase = await createClient();
    const { data: mensaje, error: mensajeError } = await supabase
      .from("correspondencia")
      .select("id,destinatario_empresa_id,estado")
      .eq("id", id)
      .maybeSingle<ReadStatusRow>();

    if (mensajeError || !mensaje) {
      if (mensajeError) {
        console.error("No se pudo verificar lectura:", mensajeError.message);
      }

      return false;
    }

    const canMarkAsRead =
      profile.rol === "profesora_admin" ||
      mensaje.destinatario_empresa_id === profile.empresa_id;

    if (!canMarkAsRead || mensaje.estado !== "enviado") {
      return false;
    }

    const { error: updateError } = await supabase
      .from("correspondencia")
      .update({
        estado: "leido",
        read_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) {
      console.error("No se pudo marcar como leida:", updateError.message);
      return false;
    }

    try {
      await logAction({
        accion: "correspondencia_leida",
        actorId: user.id,
        detalle: {
          correspondencia_id: id
        },
        objeto: "correspondencia"
      });
    } catch (error) {
      console.error("No se pudo registrar auditoria de lectura:", error);
    }

    return true;
  } catch (error) {
    console.error("No se pudo procesar la lectura de correspondencia:", error);
    return false;
  }
}
