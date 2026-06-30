import { createClient } from "@/lib/supabase/server";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";
import type { Empresa, EmpresaTipo } from "@/lib/empresas/types";

const empresaSelect =
  "id,nombre,slug,tipo,rubro,descripcion,logo,logo_url,banner_url,color_marca,figura_legal,razon_social,nombre_comercial,slogan,cuit_simulado,domicilio,actividad_principal,curso_anio,curso_division,integrantes,responsable,persona_juridica,socio_responsable,contacto_email,contacto_telefono,sitio_externo,visible_en_directorio,activo,created_at";

function applyVisibilityFilter<TQuery extends { eq: (column: string, value: boolean) => TQuery }>(
  query: TQuery,
  profile: ProfileWithEmpresa
) {
  if (profile.rol === "profesora_admin") {
    return query;
  }

  return query.eq("activo", true).eq("visible_en_directorio", true);
}

export async function getEmpresasByTipos(
  tipos: EmpresaTipo[],
  profile: ProfileWithEmpresa
) {
  const supabase = await createClient();
  let query = supabase
    .from("empresas")
    .select(empresaSelect)
    .in("tipo", tipos)
    .order("nombre", { ascending: true });

  query = applyVisibilityFilter(query, profile);

  const { data, error } = await query.returns<Empresa[]>();

  if (error) {
    throw new Error(`No se pudo cargar el directorio: ${error.message}`);
  }

  return data;
}

export async function getEmpresaBySlug(
  slug: string,
  tipo: EmpresaTipo | EmpresaTipo[],
  profile: ProfileWithEmpresa
) {
  const supabase = await createClient();
  let query = supabase.from("empresas").select(empresaSelect).eq("slug", slug);

  if (Array.isArray(tipo)) {
    query = query.in("tipo", tipo);
  } else {
    query = query.eq("tipo", tipo);
  }

  query = applyVisibilityFilter(query, profile);

  const { data, error } = await query.maybeSingle<Empresa>();

  if (error) {
    throw new Error(`No se pudo cargar la ficha: ${error.message}`);
  }

  return data;
}

export async function getEmpresaById(
  id: string,
  profile: ProfileWithEmpresa
) {
  const supabase = await createClient();
  let query = supabase.from("empresas").select(empresaSelect).eq("id", id);

  if (profile.rol !== "profesora_admin") {
    query = query.eq("activo", true);
  }

  const { data, error } = await query.maybeSingle<Empresa>();

  if (error) {
    throw new Error(`No se pudo cargar la empresa asociada: ${error.message}`);
  }

  return data;
}
