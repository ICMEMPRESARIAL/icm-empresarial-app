import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import type {
  TipoTramite,
  TramiteAdjunto,
  TramiteComentario,
  TramiteDetail,
  TramiteEstado,
  TramiteEvento,
  TramiteListItem
} from "@/lib/tramites/types";

const empresaMiniSelect = "id,nombre,slug,tipo";

const tramiteSelect = `
  id,
  tipo_tramite_id,
  solicitante_empresa_id,
  organismo_empresa_id,
  estado,
  asunto,
  descripcion,
  numero_expediente,
  observacion_actual,
  oculto,
  created_at,
  updated_at,
  finalizado_at,
  tipo_tramite:tipo_tramite_id(id,nombre,slug,organismo_slug,categoria,requiere_adjunto),
  solicitante:solicitante_empresa_id(${empresaMiniSelect}),
  organismo:organismo_empresa_id(${empresaMiniSelect})
`;

export async function getTiposTramite() {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tipos_tramite")
    .select(
      `
        id,
        organismo_empresa_id,
        organismo_slug,
        nombre,
        slug,
        descripcion,
        categoria,
        documentacion_esperada,
        requiere_adjunto,
        activo,
        created_at,
        organismo:organismo_empresa_id(${empresaMiniSelect})
      `
    )
    .eq("activo", true)
    .order("organismo_slug", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar tipos de tramite: ${error.message}`);
  }

  return (data ?? []) as unknown as TipoTramite[];
}

export async function getTiposTramiteByOrganismoSlug(slug: string) {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tipos_tramite")
    .select(
      `
        id,
        organismo_empresa_id,
        organismo_slug,
        nombre,
        slug,
        descripcion,
        categoria,
        documentacion_esperada,
        requiere_adjunto,
        activo,
        created_at,
        organismo:organismo_empresa_id(${empresaMiniSelect})
      `
    )
    .eq("activo", true)
    .eq("organismo_slug", slug)
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar tramites del organismo: ${error.message}`);
  }

  return (data ?? []) as unknown as TipoTramite[];
}

export async function getTramitesForCurrentUser() {
  const { profile } = await requireAuth();

  if (!profile.empresa_id && profile.rol !== "profesora_admin") {
    return [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("tramites")
    .select(tramiteSelect)
    .order("created_at", { ascending: false });

  if (profile.rol !== "profesora_admin" && profile.empresa_id) {
    query = query.eq("solicitante_empresa_id", profile.empresa_id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`No se pudieron cargar tramites: ${error.message}`);
  }

  return (data ?? []) as unknown as TramiteListItem[];
}

export async function getTramitesRecibidosForOrganismo(slug: string) {
  const { profile } = await requireAuth();
  const supabase = await createClient();
  const { data: organismo, error: organismoError } = await supabase
    .from("empresas")
    .select("id,nombre,slug,tipo")
    .eq("slug", slug)
    .eq("tipo", "organismo")
    .maybeSingle<{ id: string; nombre: string; slug: string; tipo: string }>();

  if (organismoError) {
    throw new Error(`No se pudo cargar organismo: ${organismoError.message}`);
  }

  if (!organismo) {
    return [];
  }

  if (
    profile.rol !== "profesora_admin" &&
    profile.empresa_id !== organismo.id
  ) {
    return [];
  }

  const { data, error } = await supabase
    .from("tramites")
    .select(tramiteSelect)
    .eq("organismo_empresa_id", organismo.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar tramites recibidos: ${error.message}`);
  }

  return (data ?? []) as unknown as TramiteListItem[];
}

export async function getAllTramitesForAdmin() {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    throw new Error("Solo la profesora administradora puede ver todos los tramites.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tramites")
    .select(tramiteSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar tramites admin: ${error.message}`);
  }

  return (data ?? []) as unknown as TramiteListItem[];
}

export async function getTramiteById(id: string) {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tramites")
    .select(tramiteSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar el tramite: ${error.message}`);
  }

  return data as TramiteDetail | null;
}

export async function getTramiteEventos(tramiteId: string) {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tramite_eventos")
    .select(
      `
        id,
        tramite_id,
        actor_id,
        actor_empresa_id,
        estado,
        titulo,
        descripcion,
        created_at,
        actor_empresa:actor_empresa_id(${empresaMiniSelect})
      `
    )
    .eq("tramite_id", tramiteId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar eventos: ${error.message}`);
  }

  return (data ?? []) as unknown as TramiteEvento[];
}

export async function getTramiteComentarios(tramiteId: string) {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tramite_comentarios")
    .select(
      `
        id,
        tramite_id,
        actor_id,
        actor_empresa_id,
        contenido,
        interno,
        created_at,
        actor_empresa:actor_empresa_id(${empresaMiniSelect})
      `
    )
    .eq("tramite_id", tramiteId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar comentarios: ${error.message}`);
  }

  return (data ?? []) as unknown as TramiteComentario[];
}

export async function getTramiteAdjuntos(tramiteId: string) {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tramite_adjuntos")
    .select(
      `
        id,
        tramite_id,
        actor_id,
        actor_empresa_id,
        nombre_archivo,
        url,
        descripcion,
        created_at,
        actor_empresa:actor_empresa_id(${empresaMiniSelect})
      `
    )
    .eq("tramite_id", tramiteId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar adjuntos: ${error.message}`);
  }

  return (data ?? []) as unknown as TramiteAdjunto[];
}

export async function getTramitesCountByEstadoForCurrentUser() {
  const tramites = await getTramitesForCurrentUser();

  return tramites.reduce<Record<TramiteEstado, number>>(
    (acc, tramite) => {
      acc[tramite.estado] += 1;
      return acc;
    },
    {
      aprobada: 0,
      documentacion_enviada: 0,
      documentacion_requerida: 0,
      en_revision: 0,
      finalizada: 0,
      observada: 0,
      recibida_por_organismo: 0,
      rechazada: 0,
      solicitud_enviada: 0
    }
  );
}
