"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { logAction } from "@/lib/audit/log-action";
import { createClient } from "@/lib/supabase/server";
import type { Factura, MedioPago } from "@/lib/facturas/types";

export type FacturaActionState = {
  error: string | null;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ParsedItem = {
  cantidad: number;
  descripcion: string;
  precio_unitario: number;
  subtotal: number;
};

function errorState(error: string): FacturaActionState {
  return { error };
}

function formString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function formRequired(formData: FormData, field: string, label: string) {
  const value = formString(formData, field);

  if (!value) {
    throw new Error(`${label} es obligatorio.`);
  }

  return value;
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseItems(raw: string): ParsedItem[] {
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Los ítems de la factura no son válidos.");
  }

  const items = parsed
    .filter(isRecord)
    .map((item) => {
      const descripcion =
        typeof item.descripcion === "string" ? item.descripcion.trim() : "";
      const cantidad =
        typeof item.cantidad === "number"
          ? item.cantidad
          : Number(item.cantidad);
      const precioUnitario =
        typeof item.precio_unitario === "number"
          ? item.precio_unitario
          : Number(item.precio_unitario);
      const subtotal = cantidad * precioUnitario;

      return {
        cantidad,
        descripcion,
        precio_unitario: precioUnitario,
        subtotal
      };
    })
    .filter(
      (item) =>
        item.descripcion.length > 0 &&
        Number.isFinite(item.cantidad) &&
        item.cantidad > 0 &&
        Number.isFinite(item.precio_unitario) &&
        item.precio_unitario >= 0
    );

  if (items.length === 0) {
    throw new Error("Agregá al menos un ítem a la factura.");
  }

  return items;
}

async function assertActiveOperator() {
  const { profile, user } = await requireAuth();

  if (profile.estado !== "activo" && profile.rol !== "profesora_admin") {
    await logAction({
      accion: "intento_operacion_facturacion_bloqueada",
      actorId: user.id,
      detalle: { estado: profile.estado, profile_id: profile.id },
      objeto: "profile"
    });
    throw new Error("Tu usuario no está activo para operar facturas o pagos.");
  }

  if (!profile.empresa_id && profile.rol !== "profesora_admin") {
    throw new Error("El usuario no tiene una empresa asociada.");
  }

  return { profile, user };
}

async function addFacturaEvento(input: {
  descripcion?: string;
  estadoAnterior?: string | null;
  estadoNuevo?: string | null;
  facturaId: string;
  titulo: string;
  userId: string;
  empresaId: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("factura_eventos").insert({
    actor_empresa_id: input.empresaId,
    actor_id: input.userId,
    descripcion: input.descripcion ?? null,
    estado_anterior: input.estadoAnterior ?? null,
    estado_nuevo: input.estadoNuevo ?? null,
    factura_id: input.facturaId,
    titulo: input.titulo
  });

  if (error) {
    throw new Error(`No se pudo registrar evento: ${error.message}`);
  }
}

async function getFacturaForAction(id: string) {
  if (!uuidPattern.test(id)) {
    throw new Error("La factura no es válida.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facturas")
    .select("*")
    .eq("id", id)
    .maybeSingle<Factura>();

  if (error) {
    throw new Error(`No se pudo cargar factura: ${error.message}`);
  }

  if (!data) {
    throw new Error("La factura no existe o no está disponible.");
  }

  return data;
}

function assertFacturaParticipant(
  empresaId: string | null,
  factura: Pick<Factura, "emisor_empresa_id" | "receptor_empresa_id">
) {
  if (
    !empresaId ||
    (factura.emisor_empresa_id !== empresaId &&
      factura.receptor_empresa_id !== empresaId)
  ) {
    throw new Error("No tenés permisos para operar esta factura.");
  }
}

export async function createFacturaAction(
  _previousState: FacturaActionState,
  formData: FormData
): Promise<FacturaActionState> {
  let facturaId: string | null = null;

  try {
    const { profile, user } = await assertActiveOperator();

    if (!profile.empresa_id) {
      return errorState("La cuenta debe estar asociada a una empresa emisora.");
    }

    const receptorEmpresaId = formRequired(
      formData,
      "receptor_empresa_id",
      "Empresa receptora"
    );
    const concepto = formRequired(formData, "concepto", "Concepto");
    const fechaVencimiento = formString(formData, "fecha_vencimiento") || null;
    const observaciones = formString(formData, "observaciones") || null;
    const items = parseItems(formRequired(formData, "items_json", "Ítems"));

    if (receptorEmpresaId === profile.empresa_id) {
      return errorState("No se puede emitir una factura a la misma empresa.");
    }

    const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
    const iva = Math.round(subtotal * 0.21 * 100) / 100;
    const total = Math.round((subtotal + iva) * 100) / 100;
    const numeroFactura = `ICM-${Date.now()}`;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("facturas")
      .insert({
        concepto,
        created_by: user.id,
        emisor_empresa_id: profile.empresa_id,
        estado: "emitida",
        fecha_vencimiento: fechaVencimiento,
        iva,
        numero_factura: numeroFactura,
        observaciones,
        receptor_empresa_id: receptorEmpresaId,
        subtotal,
        total
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      return errorState(`No se pudo crear factura: ${error.message}`);
    }

    facturaId = data.id;

    const { error: itemsError } = await supabase.from("factura_items").insert(
      items.map((item) => ({
        ...item,
        factura_id: data.id
      }))
    );

    if (itemsError) {
      return errorState(`No se pudieron guardar ítems: ${itemsError.message}`);
    }

    await addFacturaEvento({
      descripcion: "La empresa emisora creó y envió la factura simulada.",
      estadoNuevo: "emitida",
      facturaId: data.id,
      titulo: "Factura emitida",
      userId: user.id,
      empresaId: profile.empresa_id
    });
    await supabase.from("correspondencia").insert({
      asunto: `Factura emitida ${numeroFactura}`,
      contenido: `Se emitió una factura simulada por $${total.toFixed(2)}. Consultala en el módulo Facturas.`,
      destinatario_empresa_id: receptorEmpresaId,
      remitente_empresa_id: profile.empresa_id,
      tipo: "factura_simulada"
    });
    await logAction({
      accion: "factura_emitida",
      actorId: user.id,
      detalle: { factura_id: data.id, total },
      objeto: "facturas"
    });
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Error inesperado.");
  }

  revalidatePath("/facturas");
  redirect(`/facturas/${facturaId}`);
}

export async function payFacturaAction(
  _previousState: FacturaActionState,
  formData: FormData
): Promise<FacturaActionState> {
  let facturaId: string | null = null;

  try {
    const { profile, user } = await assertActiveOperator();
    const id = formRequired(formData, "factura_id", "Factura");
    const factura = await getFacturaForAction(id);
    assertFacturaParticipant(profile.empresa_id, factura);

    if (profile.empresa_id !== factura.receptor_empresa_id) {
      return errorState("Solo la empresa receptora puede pagar esta factura.");
    }

    const importe = parseMoney(formRequired(formData, "importe", "Importe"));
    const medioPago = formRequired(formData, "medio_pago", "Medio de pago") as MedioPago;
    const supabase = await createClient();
    const { error } = await supabase.from("pagos").insert({
      cobrador_empresa_id: factura.emisor_empresa_id,
      comprobante_path: formString(formData, "comprobante_path") || null,
      created_by: user.id,
      factura_id: factura.id,
      fecha_pago: formRequired(formData, "fecha_pago", "Fecha de pago"),
      importe,
      medio_pago: medioPago,
      numero_operacion: formString(formData, "numero_operacion") || null,
      observaciones: formString(formData, "observaciones") || null,
      pagador_empresa_id: profile.empresa_id
    });

    if (error) {
      return errorState(`No se pudo registrar pago: ${error.message}`);
    }

    const { error: updateError } = await supabase
      .from("facturas")
      .update({ estado: "pago_enviado", updated_at: new Date().toISOString() })
      .eq("id", factura.id);

    if (updateError) {
      return errorState(`No se pudo actualizar factura: ${updateError.message}`);
    }

    await addFacturaEvento({
      descripcion: "La empresa receptora envió un pago con comprobante.",
      estadoAnterior: factura.estado,
      estadoNuevo: "pago_enviado",
      facturaId: factura.id,
      titulo: "Pago enviado",
      userId: user.id,
      empresaId: profile.empresa_id
    });
    await logAction({
      accion: "pago_enviado",
      actorId: user.id,
      detalle: { factura_id: factura.id, importe },
      objeto: "pagos"
    });
    facturaId = factura.id;
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Error inesperado.");
  }

  revalidatePath("/facturas");
  redirect(`/facturas/${facturaId}`);
}

export async function updatePagoEstadoAction(formData: FormData) {
  const { profile, user } = await assertActiveOperator();
  const pagoId = formRequired(formData, "pago_id", "Pago");
  const estado = formRequired(formData, "estado", "Estado");
  const observaciones = formString(formData, "observaciones") || null;

  if (!["observado", "confirmado", "rechazado"].includes(estado)) {
    throw new Error("Estado de pago inválido.");
  }

  const supabase = await createClient();
  const { data: pago, error } = await supabase
    .from("pagos")
    .select("id,factura_id,cobrador_empresa_id,estado")
    .eq("id", pagoId)
    .maybeSingle<{
      cobrador_empresa_id: string;
      estado: string;
      factura_id: string;
      id: string;
    }>();

  if (error || !pago) {
    throw new Error(error?.message ?? "El pago no existe.");
  }

  if (profile.rol !== "profesora_admin" && profile.empresa_id !== pago.cobrador_empresa_id) {
    throw new Error("Solo la empresa cobradora puede confirmar u observar el pago.");
  }

  const facturaEstado = estado === "confirmado" ? "pagada" : "observada";
  const { error: updatePagoError } = await supabase
    .from("pagos")
    .update({ estado, observaciones, updated_at: new Date().toISOString() })
    .eq("id", pago.id);

  if (updatePagoError) {
    throw new Error(updatePagoError.message);
  }

  await supabase
    .from("facturas")
    .update({ estado: facturaEstado, updated_at: new Date().toISOString() })
    .eq("id", pago.factura_id);
  await addFacturaEvento({
    descripcion: observaciones ?? "La empresa cobradora revisó el pago.",
    estadoAnterior: pago.estado,
    estadoNuevo: estado,
    facturaId: pago.factura_id,
    titulo: estado === "confirmado" ? "Cobro confirmado" : "Pago revisado",
    userId: user.id,
    empresaId: profile.empresa_id
  });
  await logAction({
    accion: estado === "confirmado" ? "pago_confirmado" : "pago_observado",
    actorId: user.id,
    detalle: { pago_id: pago.id },
    objeto: "pagos"
  });
  revalidatePath("/facturas");
  redirect(`/facturas/${pago.factura_id}`);
}

export async function markFacturaRegistradaEnRegisoftAction(formData: FormData) {
  const { profile, user } = await requireAuth();
  const facturaId = formRequired(formData, "factura_id", "Factura");
  const referencia = formString(formData, "referencia_regisoft") || null;
  const factura = await getFacturaForAction(facturaId);

  if (profile.rol !== "profesora_admin") {
    assertFacturaParticipant(profile.empresa_id, factura);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("facturas")
    .update({
      referencia_regisoft: referencia,
      registrado_en_regisoft: true,
      registrado_en_regisoft_at: new Date().toISOString(),
      registrado_en_regisoft_por: user.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", facturaId);

  if (error) {
    throw new Error(error.message);
  }

  await logAction({
    accion: "factura_registrada_regisoft",
    actorId: user.id,
    detalle: { factura_id: facturaId },
    objeto: "facturas"
  });
  revalidatePath("/facturas");
  redirect(`/facturas/${facturaId}`);
}

export async function markPagoRegistradoEnRegisoftAction(formData: FormData) {
  const { profile, user } = await requireAuth();
  const pagoId = formRequired(formData, "pago_id", "Pago");
  const referencia = formString(formData, "referencia_regisoft") || null;
  const supabase = await createClient();
  const { data: pago, error: pagoError } = await supabase
    .from("pagos")
    .select("id,factura_id,pagador_empresa_id,cobrador_empresa_id")
    .eq("id", pagoId)
    .maybeSingle<{
      cobrador_empresa_id: string;
      factura_id: string;
      id: string;
      pagador_empresa_id: string;
    }>();

  if (pagoError || !pago) {
    throw new Error(pagoError?.message ?? "El pago no existe.");
  }

  if (
    profile.rol !== "profesora_admin" &&
    profile.empresa_id !== pago.pagador_empresa_id &&
    profile.empresa_id !== pago.cobrador_empresa_id
  ) {
    throw new Error("No tenés permisos para marcar este pago en Regisoft.");
  }

  const { error } = await supabase
    .from("pagos")
    .update({
      referencia_regisoft: referencia,
      registrado_en_regisoft: true,
      registrado_en_regisoft_at: new Date().toISOString(),
      registrado_en_regisoft_por: user.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", pagoId);

  if (error) {
    throw new Error(error.message);
  }

  await logAction({
    accion: "pago_registrado_regisoft",
    actorId: user.id,
    detalle: { pago_id: pagoId },
    objeto: "pagos"
  });
  revalidatePath("/pagos");
  redirect(`/facturas/${pago.factura_id}`);
}
