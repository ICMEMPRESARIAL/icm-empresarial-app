import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import type { Empresa } from "@/lib/empresas/types";
import type {
  BuzonFilter,
  CorrespondenciaDetail,
  CorrespondenciaListItem,
  CorrespondenciaRespuesta
} from "@/lib/buzon/types";

const empresaMiniSelect = "id,nombre,slug,tipo";

const correspondenciaSelect = `
  id,
  remitente_empresa_id,
  destinatario_empresa_id,
  tipo,
  asunto,
  contenido,
  estado,
  reportado,
  oculto,
  created_at,
  read_at,
  remitente:remitente_empresa_id(${empresaMiniSelect}),
  destinatario:destinatario_empresa_id(${empresaMiniSelect})
`;

export function normalizeBuzonFilter(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (
    candidate === "recibidos" ||
    candidate === "enviados" ||
    candidate === "archivados" ||
    candidate === "todos"
  ) {
    return candidate satisfies BuzonFilter;
  }

  return "recibidos";
}

export async function getCorrespondenciaForCurrentUser(filter: BuzonFilter) {
  const { profile } = await requireAuth();
  const supabase = await createClient();
  let query = supabase
    .from("correspondencia")
    .select(correspondenciaSelect)
    .order("created_at", { ascending: false });

  if (profile.rol !== "profesora_admin") {
    if (!profile.empresa_id) {
      return [];
    }

    query = query.eq("oculto", false);

    if (filter === "recibidos") {
      query = query
        .eq("destinatario_empresa_id", profile.empresa_id)
        .neq("estado", "archivado");
    }

    if (filter === "enviados") {
      query = query
        .eq("remitente_empresa_id", profile.empresa_id)
        .neq("estado", "archivado");
    }

    if (filter === "archivados") {
      query = query.eq("estado", "archivado");
    }
  } else if (filter === "archivados") {
    query = query.eq("estado", "archivado");
  } else if (filter === "recibidos" || filter === "enviados") {
    query = query.neq("estado", "archivado");
  }

  const { data, error } = await query.returns<CorrespondenciaListItem[]>();

  if (error) {
    throw new Error(`No se pudo cargar el buzon: ${error.message}`);
  }

  return data;
}

export async function getCorrespondenciaById(id: string) {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("correspondencia")
    .select(correspondenciaSelect)
    .eq("id", id)
    .maybeSingle<CorrespondenciaDetail>();

  if (error) {
    throw new Error(`No se pudo cargar la correspondencia: ${error.message}`);
  }

  return data;
}

export async function getDestinatariosDisponibles() {
  const { profile } = await requireAuth();
  const supabase = await createClient();
  let query = supabase
    .from("empresas")
    .select(
      "id,nombre,slug,tipo,rubro,descripcion,logo,color_marca,sitio_externo,visible_en_directorio,activo,created_at"
    )
    .eq("activo", true)
    .eq("visible_en_directorio", true)
    .order("nombre", { ascending: true });

  if (profile.empresa_id) {
    query = query.neq("id", profile.empresa_id);
  }

  const { data, error } = await query.returns<Empresa[]>();

  if (error) {
    throw new Error(`No se pudieron cargar destinatarios: ${error.message}`);
  }

  return data;
}

export async function getCorrespondenciaRespuestas(correspondenciaId: string) {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("correspondencia_respuestas")
    .select(
      `
        id,
        correspondencia_id,
        empresa_id,
        contenido,
        created_at,
        empresa:empresa_id(${empresaMiniSelect})
      `
    )
    .eq("correspondencia_id", correspondenciaId)
    .order("created_at", { ascending: true })
    .returns<CorrespondenciaRespuesta[]>();

  if (error) {
    throw new Error(`No se pudieron cargar respuestas: ${error.message}`);
  }

  return data;
}
