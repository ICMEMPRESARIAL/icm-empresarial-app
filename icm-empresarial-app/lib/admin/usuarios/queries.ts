import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import type {
  ConductaEstado,
  ProfileEstado,
  ProfileRole
} from "@/lib/auth/get-user-profile";

export type AdminUserItem = {
  id: string;
  nombre: string;
  email: string | null;
  rol: ProfileRole;
  empresa_id: string | null;
  empresa_nombre: string | null;
  estado: ProfileEstado;
  suspendido_motivo: string | null;
  suspendido_at: string | null;
  suspendido_hasta: string | null;
  suspendido_por: string | null;
  conducta_estado: ConductaEstado;
  conducta_observacion: string | null;
  cantidad_suspensiones: number;
  ultima_suspension_at: string | null;
  created_at: string;
};

function assertAdminRole(profileRole: ProfileRole) {
  if (profileRole !== "profesora_admin") {
    throw new Error("Solo la profesora administradora puede acceder.");
  }
}

export async function getAdminUsers() {
  const { profile } = await requireAuth();
  assertAdminRole(profile.rol);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_profiles");

  if (error) {
    throw new Error(`No se pudieron cargar usuarios: ${error.message}`);
  }

  return (data ?? []) as AdminUserItem[];
}
