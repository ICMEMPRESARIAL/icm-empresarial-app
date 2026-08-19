import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "empresa" | "profesora_admin";
export type ProfileEstado =
  | "pendiente"
  | "activo"
  | "suspendido"
  | "dado_de_baja";

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
  onboarding_completo: boolean;
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
  suspendido_por: string | null;
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
  suspendido_por: string | null;
};

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
      "id,nombre,rol,empresa_id,estado,suspendido_motivo,suspendido_at,suspendido_por,empresas:empresa_id(id,nombre,nombre_comercial,rubro,slug,tipo,logo,logo_url,color_marca,onboarding_completo)"
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

  return {
    error: null,
    profile: {
      empresa: data.empresas,
      empresa_id: data.empresa_id,
      estado: data.estado,
      id: data.id,
      nombre: data.nombre,
      rol: data.rol,
      suspendido_at: data.suspendido_at,
      suspendido_motivo: data.suspendido_motivo,
      suspendido_por: data.suspendido_por
    },
    user
  };
}
