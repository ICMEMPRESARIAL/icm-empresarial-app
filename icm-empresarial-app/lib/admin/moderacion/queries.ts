import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";

export type ModerationIncident = {
  id: string;
  actor_id: string;
  empresa_id: string | null;
  destinatario_empresa_id: string | null;
  correspondencia_id: string | null;
  tipo: "nuevo_mensaje" | "respuesta";
  resultado: "bloqueado" | "permitido_con_alerta";
  categorias: Record<string, boolean>;
  contenido_excerpt: string | null;
  fuente: string;
  created_at: string;
  empresa: { nombre: string; nombre_comercial: string | null } | null;
  destinatario: { nombre: string; nombre_comercial: string | null } | null;
};

export async function getModerationIncidents() {
  const { profile } = await requireAuth();
  if (profile.rol !== "profesora_admin") {
    throw new Error("Solo la profesora administradora puede ver moderación.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("moderation_incidents")
    .select(
      "id,actor_id,empresa_id,destinatario_empresa_id,correspondencia_id,tipo,resultado,categorias,contenido_excerpt,fuente,created_at,empresa:empresa_id(nombre,nombre_comercial),destinatario:destinatario_empresa_id(nombre,nombre_comercial)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`No se pudieron cargar los incidentes: ${error.message}`);
  }

  return (data ?? []) as unknown as ModerationIncident[];
}
