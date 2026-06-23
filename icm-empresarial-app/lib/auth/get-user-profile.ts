import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "empresa" | "profesora_admin";

export type EmpresaSummary = {
  id: string;
  nombre: string;
  slug: string;
  tipo: "servicio" | "bien" | "organismo";
};

export type ProfileWithEmpresa = {
  id: string;
  nombre: string;
  rol: ProfileRole;
  empresa_id: string | null;
  empresa: EmpresaSummary | null;
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
      "id,nombre,rol,empresa_id,empresas:empresa_id(id,nombre,slug,tipo)"
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
      id: data.id,
      nombre: data.nombre,
      rol: data.rol
    },
    user
  };
}
