import { requireAuth } from "@/lib/auth/require-auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Factura,
  FacturaDetail,
  FacturaEvento,
  FacturaItem,
  Pago
} from "@/lib/facturas/types";

export type FacturaFilter =
  | "todos"
  | "emitidas"
  | "recibidas"
  | "pendientes_pago"
  | "pendientes_regisoft";

const empresaSelect = "id,nombre,nombre_comercial,slug,tipo";
const facturaSelect = `
  id,
  numero_factura,
  emisor_empresa_id,
  receptor_empresa_id,
  fecha_emision,
  fecha_vencimiento,
  tipo_factura,
  estado,
  concepto,
  subtotal,
  iva,
  total,
  observaciones,
  registrado_en_regisoft,
  registrado_en_regisoft_at,
  registrado_en_regisoft_por,
  referencia_regisoft,
  created_by,
  created_at,
  updated_at,
  emisor:emisor_empresa_id(${empresaSelect}),
  receptor:receptor_empresa_id(${empresaSelect})
`;
const pagoSelect = `
  id,
  factura_id,
  pagador_empresa_id,
  cobrador_empresa_id,
  importe,
  fecha_pago,
  medio_pago,
  numero_operacion,
  estado,
  comprobante_path,
  observaciones,
  registrado_en_regisoft,
  registrado_en_regisoft_at,
  registrado_en_regisoft_por,
  referencia_regisoft,
  created_by,
  created_at,
  updated_at,
  factura:factura_id(id,numero_factura,total,estado),
  pagador:pagador_empresa_id(${empresaSelect}),
  cobrador:cobrador_empresa_id(${empresaSelect})
`;

function applyFacturaFilter<TQuery extends { eq: (column: string, value: string | boolean) => TQuery }>(
  query: TQuery,
  filter: FacturaFilter,
  empresaId: string | null
) {
  if (filter === "emitidas" && empresaId) return query.eq("emisor_empresa_id", empresaId);
  if (filter === "recibidas" && empresaId) return query.eq("receptor_empresa_id", empresaId);
  if (filter === "pendientes_regisoft") return query.eq("registrado_en_regisoft", false);
  if (filter === "pendientes_pago") return query.eq("estado", "emitida");
  return query;
}

export async function getFacturasForCurrentUser(
  filter: FacturaFilter = "todos"
) {
  const { profile } = await requireAuth();
  const supabase = await createClient();
  let query = supabase
    .from("facturas")
    .select(facturaSelect)
    .order("created_at", { ascending: false });

  query = applyFacturaFilter(query, filter, profile.empresa_id);

  const { data, error } = await query.returns<Factura[]>();

  if (error) {
    throw new Error(`No se pudieron cargar facturas: ${error.message}`);
  }

  return data;
}

export async function getAllFacturasForAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facturas")
    .select(facturaSelect)
    .order("created_at", { ascending: false })
    .returns<Factura[]>();

  if (error) {
    throw new Error(`No se pudieron cargar facturas: ${error.message}`);
  }

  return data;
}

export async function getFacturaById(id: string): Promise<FacturaDetail | null> {
  const supabase = await createClient();
  const { data: factura, error } = await supabase
    .from("facturas")
    .select(facturaSelect)
    .eq("id", id)
    .maybeSingle<Factura>();

  if (error) {
    throw new Error(`No se pudo cargar factura: ${error.message}`);
  }

  if (!factura) return null;

  const [itemsResult, pagosResult, eventosResult] = await Promise.all([
    supabase
      .from("factura_items")
      .select("*")
      .eq("factura_id", id)
      .order("created_at", { ascending: true })
      .returns<FacturaItem[]>(),
    supabase
      .from("pagos")
      .select(pagoSelect)
      .eq("factura_id", id)
      .order("created_at", { ascending: false })
      .returns<Pago[]>(),
    supabase
      .from("factura_eventos")
      .select(
        `id,factura_id,actor_id,actor_empresa_id,estado_anterior,estado_nuevo,titulo,descripcion,created_at,actor_empresa:actor_empresa_id(${empresaSelect})`
      )
      .eq("factura_id", id)
      .order("created_at", { ascending: true })
      .returns<FacturaEvento[]>()
  ]);

  if (itemsResult.error) throw new Error(itemsResult.error.message);
  if (pagosResult.error) throw new Error(pagosResult.error.message);
  if (eventosResult.error) throw new Error(eventosResult.error.message);

  return {
    ...factura,
    eventos: eventosResult.data,
    items: itemsResult.data,
    pagos: pagosResult.data
  };
}

export async function getPagosForCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .select(pagoSelect)
    .order("created_at", { ascending: false })
    .returns<Pago[]>();

  if (error) {
    throw new Error(`No se pudieron cargar pagos: ${error.message}`);
  }

  return data;
}

export async function getAllPagosForAdmin() {
  return getPagosForCurrentUser();
}

export async function getPagoById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pagos")
    .select(pagoSelect)
    .eq("id", id)
    .maybeSingle<Pago>();

  if (error) {
    throw new Error(`No se pudo cargar pago: ${error.message}`);
  }

  return data;
}

export async function getDestinatariosFactura() {
  const { profile } = await requireAuth();
  const supabase = await createClient();
  let query = supabase
    .from("empresas")
    .select("id,nombre,nombre_comercial,slug,tipo,rubro")
    .eq("activo", true)
    .eq("visible_en_directorio", true)
    .order("nombre", { ascending: true });

  if (profile.empresa_id) {
    query = query.neq("id", profile.empresa_id);
  }

  const { data, error } = await query.returns<
    {
      id: string;
      nombre: string;
      nombre_comercial: string | null;
      rubro: string | null;
      slug: string;
      tipo: string;
    }[]
  >();

  if (error) {
    throw new Error(`No se pudieron cargar destinatarios: ${error.message}`);
  }

  return data;
}

export async function getFacturacionCounts() {
  const { profile } = await requireAuth();
  const facturas = await getFacturasForCurrentUser();
  const pagos = await getPagosForCurrentUser();

  return {
    emitidasPendientes: facturas.filter(
      (factura) =>
        factura.estado !== "pagada" &&
        factura.emisor_empresa_id === profile.empresa_id
    ).length,
    pagosPendientesConfirmar: pagos.filter(
      (pago) =>
        pago.estado === "enviado" && pago.cobrador_empresa_id === profile.empresa_id
    ).length,
    pendientesRegisoft:
      facturas.filter((factura) => !factura.registrado_en_regisoft).length +
      pagos.filter((pago) => !pago.registrado_en_regisoft).length,
    recibidasPendientes: facturas.filter(
      (factura) =>
        factura.receptor_empresa_id === profile.empresa_id &&
        (factura.estado === "emitida" || factura.estado === "pendiente_pago")
    ).length
  };
}
