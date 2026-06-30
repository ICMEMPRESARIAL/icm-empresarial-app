import { requireAuth } from "@/lib/auth/require-auth";
import { getEmpresaById, getEmpresaBySlug } from "@/lib/empresas/queries";
import { createClient } from "@/lib/supabase/server";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";
import type {
  EmpresaDocumentoLegal,
  EmpresaProducto,
  EmpresaRevisionContable,
  EmpresaSiteData,
  EmpresaWeb
} from "@/lib/empresa-site/types";

const revisionSelect = `
  id,
  empresa_id,
  estudio_contable_empresa_id,
  estado,
  observaciones_generales,
  created_at,
  updated_at,
  empresa:empresa_id(id,nombre,nombre_comercial,slug),
  estudio_contable:estudio_contable_empresa_id(id,nombre,nombre_comercial,slug)
`;

export async function getEmpresaSiteDataBySlug(
  slug: string,
  profile: ProfileWithEmpresa
): Promise<EmpresaSiteData | null> {
  const empresa = await getEmpresaBySlug(slug, ["servicio", "bien"], profile);

  if (!empresa) {
    return null;
  }

  const [web, productos, documentos, revision] = await Promise.all([
    getEmpresaWeb(empresa.id),
    getEmpresaProductos(empresa.id, profile),
    getEmpresaDocumentosLegales(empresa.id),
    getEmpresaRevisionContable(empresa.id)
  ]);

  return {
    documentos,
    empresa,
    productos,
    revision,
    web
  };
}

export async function getEmpresaSiteDataById(
  empresaId: string,
  profile: ProfileWithEmpresa
): Promise<EmpresaSiteData | null> {
  const empresa = await getEmpresaById(empresaId, profile);

  if (!empresa) {
    return null;
  }

  const [web, productos, documentos, revision] = await Promise.all([
    getEmpresaWeb(empresa.id),
    getEmpresaProductos(empresa.id, profile),
    getEmpresaDocumentosLegales(empresa.id),
    getEmpresaRevisionContable(empresa.id)
  ]);

  return {
    documentos,
    empresa,
    productos,
    revision,
    web
  };
}

export async function getCurrentEmpresaSiteData() {
  const { profile } = await requireAuth();

  if (!profile.empresa_id) {
    return null;
  }

  const empresa = await getEmpresaById(profile.empresa_id, profile);

  if (!empresa) {
    return null;
  }

  const [web, productos, documentos, revision] = await Promise.all([
    getEmpresaWeb(empresa.id),
    getEmpresaProductos(empresa.id, profile),
    getEmpresaDocumentosLegales(empresa.id),
    getEmpresaRevisionContable(empresa.id)
  ]);

  return {
    documentos,
    empresa,
    productos,
    revision,
    web
  };
}

export async function getEmpresaWeb(empresaId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empresa_web")
    .select("*")
    .eq("empresa_id", empresaId)
    .maybeSingle<EmpresaWeb>();

  if (error) {
    throw new Error(`No se pudo cargar sitio interno: ${error.message}`);
  }

  return data;
}

export async function getEmpresaProductos(
  empresaId: string,
  profile: ProfileWithEmpresa
) {
  const supabase = await createClient();
  let query = supabase
    .from("empresa_productos")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (profile.rol !== "profesora_admin" && profile.empresa_id !== empresaId) {
    query = query.eq("activo", true);
  }

  const { data, error } = await query.returns<EmpresaProducto[]>();

  if (error) {
    throw new Error(`No se pudieron cargar productos: ${error.message}`);
  }

  return data;
}

export async function getEmpresaDocumentosLegales(empresaId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empresa_documentacion_legal")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<EmpresaDocumentoLegal[]>();

  if (error) {
    throw new Error(`No se pudo cargar documentación legal: ${error.message}`);
  }

  return data;
}

export async function getEmpresaRevisionContable(empresaId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empresa_revision_contable")
    .select(revisionSelect)
    .eq("empresa_id", empresaId)
    .maybeSingle<EmpresaRevisionContable>();

  if (error) {
    throw new Error(`No se pudo cargar revisión contable: ${error.message}`);
  }

  return data;
}

export async function getRevisionesForCurrentEstudio() {
  const { profile } = await requireAuth();

  if (!profile.empresa_id && profile.rol !== "profesora_admin") {
    return [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("empresa_revision_contable")
    .select(revisionSelect)
    .order("updated_at", { ascending: false });

  if (profile.rol !== "profesora_admin" && profile.empresa_id) {
    query = query.eq("estudio_contable_empresa_id", profile.empresa_id);
  }

  const { data, error } = await query.returns<EmpresaRevisionContable[]>();

  if (error) {
    throw new Error(`No se pudieron cargar revisiones: ${error.message}`);
  }

  return data;
}
