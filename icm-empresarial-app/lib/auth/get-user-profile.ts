import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "empresa" | "profesora_admin";
export type ProfileEstado =
  | "pendiente"
  | "activo"
  | "suspendido"
  | "dado_de_baja";
export type ConductaEstado =
  | "excelente"
  | "observado"
  | "suspendido_previamente"
  | "reincidente"
  | "grave";

export type EmpresaSummary = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  rubro: string | null;
  slug: string;
  tipo: "servicio" | "bien" | "organismo";
  color_marca: string | null;
  logo: string | null;
  logo_url: string | null;
};

export type ProfileWithEmpresa = {
  id: string;
  nombre: string;
  rol: ProfileRole;
  empresa_id: string | null;
  empresa: EmpresaSummary | null;
  estado: ProfileEstado;
  suspendido_motivo: string | null;
  suspendido_at: string | null;
  suspendido_hasta: string | null;
  suspendido_por: string | null;
  conducta_estado: ConductaEstado;
  conducta_observacion: string | null;
  cantidad_suspensiones: number;
  ultima_suspension_at: string | null;
};

export type UserProfileResult = {
  user: User | null;
  profile: ProfileWithEmpresa | null;
  error: "no_session" | "missing_profile" | "profile_query_error" | null;
};

type ProfileRow = {
  id: string;
  nombre: string;
  rol: ProfileRole;
  empresa_id: string | null;
  empresas: EmpresaSummary | null;
  estado: ProfileEstado;
  suspendido_motivo: string | null;
  suspendido_at: string | null;
  suspendido_hasta: string | null;
  suspendido_por: string | null;
  conducta_estado: ConductaEstado;
  conducta_observacion: string | null;
  cantidad_suspensiones: number;
  ultima_suspension_at: string | null;
};

async function completeExpiredSuspension(
  profile: ProfileRow,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (
    profile.estado !== "suspendido" ||
    !profile.suspendido_hasta ||
    new Date(profile.suspendido_hasta).getTime() > Date.now()
  ) {
    return profile;
  }

  const now = new Date().toISOString();
  await supabase
    .from("profiles")
    .update({
      estado: "activo",
      suspendido_at: null,
      suspendido_hasta: null,
      suspendido_motivo: null,
      suspendido_por: null
    })
    .eq("id", profile.id);
  await supabase
    .from("user_suspensiones")
    .update({
      estado: "cumplida",
      levantada_at: now
    })
    .eq("user_id", profile.id)
    .eq("estado", "activa");
  await supabase.from("audit_logs").insert({
    accion: "usuario_suspension_cumplida",
    actor_id: profile.id,
    detalle: {
      profile_id: profile.id
    },
    objeto: "profile"
  });

  return {
    ...profile,
    estado: "activo" as const,
    suspendido_at: null,
    suspendido_hasta: null,
    suspendido_motivo: null,
    suspendido_por: null
  };
}

export async function getUserProfile(): Promise<UserProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "no_session",
      profile: null,
      user: null
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,nombre,rol,empresa_id,estado,suspendido_motivo,suspendido_at,suspendido_hasta,suspendido_por,conducta_estado,conducta_observacion,cantidad_suspensiones,ultima_suspension_at,empresas:empresa_id(id,nombre,nombre_comercial,rubro,slug,tipo,logo,logo_url,color_marca)"
    )
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    return {
      error: "profile_query_error",
      profile: null,
      user
    };
  }

  if (!data) {
    return {
      error: "missing_profile",
      profile: null,
      user
    };
  }

  const profile = await completeExpiredSuspension(data, supabase);

  return {
    error: null,
    profile: {
      cantidad_suspensiones: profile.cantidad_suspensiones ?? 0,
      conducta_estado: profile.conducta_estado ?? "excelente",
      conducta_observacion: profile.conducta_observacion,
      empresa: profile.empresas,
      empresa_id: profile.empresa_id,
      estado: profile.estado,
      id: profile.id,
      nombre: profile.nombre,
      rol: profile.rol,
      suspendido_at: profile.suspendido_at,
      suspendido_hasta: profile.suspendido_hasta,
      suspendido_motivo: profile.suspendido_motivo,
      suspendido_por: profile.suspendido_por,
      ultima_suspension_at: profile.ultima_suspension_at
    },
    user
  };
}
