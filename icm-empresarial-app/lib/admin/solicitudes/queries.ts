import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";

export type SolicitudRegistroEstado = "pendiente" | "aprobada" | "rechazada";
export type TipoEntidadRegistro = "bien" | "servicio" | "organismo" | "banco";
export type FiguraLegalRegistro =
  | "monotributo"
  | "sas"
  | "organismo_publico"
  | "banco";

export type SolicitudRegistro = {
  id: string;
  user_id: string;
  nombre_alumno: string;
  email: string;
  curso: string | null;
  telefono: string | null;
  nombre_entidad: string;
  tipo_entidad: TipoEntidadRegistro;
  figura_legal: FiguraLegalRegistro;
  rubro: string | null;
  descripcion: string | null;
  socio_mayor: string | null;
  responsable: string | null;
  cargo_responsable: string | null;
  cuit_simulado: string | null;
  domicilio: string | null;
  actividad_principal: string | null;
  estado: SolicitudRegistroEstado;
  revisado_por: string | null;
  revisado_at: string | null;
  observaciones_admin: string | null;
  created_at: string;
};

const solicitudSelect = `
  id,
  user_id,
  nombre_alumno,
  email,
  curso,
  telefono,
  nombre_entidad,
  tipo_entidad,
  figura_legal,
  rubro,
  descripcion,
  socio_mayor,
  responsable,
  cargo_responsable,
  cuit_simulado,
  domicilio,
  actividad_principal,
  estado,
  revisado_por,
  revisado_at,
  observaciones_admin,
  created_at
`;

function assertAdminRole(profileRole: string) {
  if (profileRole !== "profesora_admin") {
    throw new Error("Solo la profesora administradora puede acceder.");
  }
}

export async function getSolicitudesRegistro() {
  const { profile } = await requireAuth();
  assertAdminRole(profile.rol);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes_registro")
    .select(solicitudSelect)
    .order("created_at", { ascending: false })
    .returns<SolicitudRegistro[]>();

  if (error) {
    throw new Error(`No se pudieron cargar solicitudes: ${error.message}`);
  }

  return data;
}

export async function getSolicitudRegistroById(id: string) {
  const { profile } = await requireAuth();
  assertAdminRole(profile.rol);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes_registro")
    .select(solicitudSelect)
    .eq("id", id)
    .maybeSingle<SolicitudRegistro>();

  if (error) {
    throw new Error(`No se pudo cargar la solicitud: ${error.message}`);
  }

  return data;
}
