import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import type {
  CorrespondenciaDetail,
  CorrespondenciaEstado,
  CorrespondenciaListItem
} from "@/lib/buzon/types";

export type AdminCorrespondenciaFilter =
  | "todos"
  | "reportados"
  | "ocultos"
  | "archivados"
  | "enviados"
  | "leidos"
  | "respondidos";

export type AuditLogItem = {
  id: string;
  actor_id: string | null;
  accion: string;
  objeto: string | null;
  detalle: Record<string, unknown>;
  created_at: string;
};

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

function requireAdminRole(profileRole: string) {
  if (profileRole !== "profesora_admin") {
    throw new Error("Solo la profesora administradora puede acceder.");
  }
}

export function normalizeAdminCorrespondenciaFilter(
  value: string | string[] | undefined
) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (
    candidate === "todos" ||
    candidate === "reportados" ||
    candidate === "ocultos" ||
    candidate === "archivados" ||
    candidate === "enviados" ||
    candidate === "leidos" ||
    candidate === "respondidos"
  ) {
    return candidate satisfies AdminCorrespondenciaFilter;
  }

  return "todos";
}

export async function getAllCorrespondenciaForAdmin(
  filter: AdminCorrespondenciaFilter
) {
  const { profile } = await requireAuth();
  requireAdminRole(profile.rol);

  const supabase = await createClient();
  let query = supabase
    .from("correspondencia")
    .select(correspondenciaSelect)
    .order("created_at", { ascending: false });

  if (filter === "reportados") {
    query = query.eq("reportado", true);
  }

  if (filter === "ocultos") {
    query = query.eq("oculto", true);
  }

  if (
    filter === "archivados" ||
    filter === "enviados" ||
    filter === "leidos" ||
    filter === "respondidos"
  ) {
    query = query.eq("estado", filter.slice(0, -1) as CorrespondenciaEstado);
  }

  const { data, error } = await query.returns<CorrespondenciaListItem[]>();

  if (error) {
    throw new Error(`No se pudo cargar correspondencia admin: ${error.message}`);
  }

  return data;
}

export async function getCorrespondenciaByIdForAdmin(id: string) {
  const { profile } = await requireAuth();
  requireAdminRole(profile.rol);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("correspondencia")
    .select(correspondenciaSelect)
    .eq("id", id)
    .maybeSingle<CorrespondenciaDetail>();

  if (error) {
    throw new Error(`No se pudo cargar correspondencia admin: ${error.message}`);
  }

  return data;
}

export async function getAuditLogsForCorrespondencia(id: string) {
  const { profile } = await requireAuth();
  requireAdminRole(profile.rol);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id,actor_id,accion,objeto,detalle,created_at")
    .contains("detalle", { correspondencia_id: id })
    .order("created_at", { ascending: false })
    .returns<AuditLogItem[]>();

  if (error) {
    throw new Error(`No se pudo cargar auditoria: ${error.message}`);
  }

  return data;
}
