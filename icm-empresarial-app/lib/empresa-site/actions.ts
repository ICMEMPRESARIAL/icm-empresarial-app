"use server";

import { revalidatePath } from "next/cache";
import { assertActiveUserCanOperate } from "@/lib/auth/require-active-profile";
import { logAction } from "@/lib/audit/log-action";
import { createClient } from "@/lib/supabase/server";
import type {
  DocumentoLegalEstado,
  EmpresaProductoModalidad,
  EmpresaProductoTipo,
  IvaMes,
  IvaMovimiento
} from "@/lib/empresa-site/types";
import { ivaMeses } from "@/lib/empresa-site/types";

type ActionState = {
  error: string | null;
  success: string | null;
};

const initialError = (message: string): ActionState => ({
  error: message,
  success: null
});

function formString(formData: FormData, field: string) {
  const value = formData.get(field);
  const clean = typeof value === "string" ? value.trim() : "";
  return clean.length > 0 ? clean : null;
}

function formRequired(formData: FormData, field: string, label: string) {
  const value = formString(formData, field);

  if (!value) {
    throw new Error(`${label} es obligatorio.`);
  }

  return value;
}

function parseMoney(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIvaMovimiento(value: string | null): IvaMovimiento {
  if (value === "compra" || value === "venta") {
    return value;
  }

  throw new Error("El movimiento de IVA no es válido.");
}

function parseIvaMes(value: string | null): IvaMes {
  if (ivaMeses.includes(value as IvaMes)) {
    return value as IvaMes;
  }

  throw new Error("El mes de IVA no es válido.");
}

function parsePeriodoAnio(value: string | null) {
  const parsed = Number(value);
  const currentYear = new Date().getFullYear();

  if (Number.isInteger(parsed) && parsed >= 2024 && parsed <= currentYear + 1) {
    return parsed;
  }

  return currentYear;
}

async function requireEditableEmpresa(empresaId: string) {
  const { profile, user } = await assertActiveUserCanOperate(
    "editar datos de empresa"
  );

  if (profile.rol !== "profesora_admin" && profile.empresa_id !== empresaId) {
    throw new Error("No tenés permisos para editar esta empresa.");
  }

  return { profile, user };
}

async function revalidateEmpresaViews(empresaId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("empresas")
    .select("slug")
    .eq("id", empresaId)
    .maybeSingle<{ slug: string }>();

  revalidatePath("/perfil-empresa");
  revalidatePath("/perfil-empresa/web");
  revalidatePath("/perfil-empresa/productos");
  revalidatePath("/perfil-empresa/informacion-legal");
  revalidatePath("/perfil-empresa/documentacion");
  revalidatePath("/empresas");

  if (data?.slug) {
    revalidatePath(`/empresas/${data.slug}`);
    revalidatePath(`/empresas/${data.slug}/productos`);
    revalidatePath(`/empresas/${data.slug}/contratarnos`);
    revalidatePath(`/empresas/${data.slug}/informacion-legal`);
    revalidatePath(`/empresas/${data.slug}/contacto`);
  }
}

export async function upsertEmpresaWebAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const empresaId = formRequired(formData, "empresa_id", "Empresa");
    const { user } = await requireEditableEmpresa(empresaId);
    const supabase = await createClient();
    const { error } = await supabase.from("empresa_web").upsert(
      {
        banner_url: formString(formData, "banner_url"),
        condiciones_contratacion: formString(
          formData,
          "condiciones_contratacion"
        ),
        contacto_email: formString(formData, "contacto_email"),
        contacto_telefono: formString(formData, "contacto_telefono"),
        descripcion_inicio: formString(formData, "descripcion_inicio"),
        empresa_id: empresaId,
        slogan: formString(formData, "slogan"),
        updated_at: new Date().toISOString()
      },
      { onConflict: "empresa_id" }
    );

    if (error) {
      return initialError(`No se pudo guardar el sitio: ${error.message}`);
    }

    await logAction({
      accion: "empresa_web_actualizada",
      actorId: user.id,
      detalle: { empresa_id: empresaId },
      objeto: "empresa_web"
    });
    await revalidateEmpresaViews(empresaId);

    return { error: null, success: "Sitio interno guardado." };
  } catch (error) {
    return initialError(error instanceof Error ? error.message : "Error inesperado.");
  }
}

export async function createProductoAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const empresaId = formRequired(formData, "empresa_id", "Empresa");
    const { user } = await requireEditableEmpresa(empresaId);
    const tipo = formRequired(formData, "tipo", "Tipo") as EmpresaProductoTipo;
    const modalidad = (formString(formData, "modalidad") ??
      "mensual") as EmpresaProductoModalidad;

    if (tipo !== "producto" && tipo !== "servicio") {
      return initialError("El tipo de publicación no es válido.");
    }

    const supabase = await createClient();
    const { error } = await supabase.from("empresa_productos").insert({
      activo: true,
      categoria: formString(formData, "categoria"),
      descripcion: formString(formData, "descripcion"),
      empresa_id: empresaId,
      imagen_url: formString(formData, "imagen_url"),
      modalidad,
      nombre: formRequired(formData, "nombre", "Nombre"),
      precio_simulado: parseMoney(formString(formData, "precio_simulado")),
      tipo
    });

    if (error) {
      return initialError(`No se pudo crear producto/servicio: ${error.message}`);
    }

    await logAction({
      accion: "empresa_producto_creado",
      actorId: user.id,
      detalle: { empresa_id: empresaId },
      objeto: "empresa_productos"
    });
    await revalidateEmpresaViews(empresaId);

    return { error: null, success: "Producto o servicio creado." };
  } catch (error) {
    return initialError(error instanceof Error ? error.message : "Error inesperado.");
  }
}

export async function toggleProductoActivoAction(formData: FormData) {
  const empresaId = formRequired(formData, "empresa_id", "Empresa");
  const productoId = formRequired(formData, "producto_id", "Producto");
  const activo = formString(formData, "activo") === "true";
  await requireEditableEmpresa(empresaId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("empresa_productos")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", productoId)
    .eq("empresa_id", empresaId);

  if (error) {
    throw new Error(`No se pudo actualizar producto: ${error.message}`);
  }

  await revalidateEmpresaViews(empresaId);
}

export async function createLegalDocumentAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const empresaId = formRequired(formData, "empresa_id", "Empresa");
    const { user } = await requireEditableEmpresa(empresaId);
    const supabase = await createClient();
    const { error } = await supabase
      .from("empresa_documentacion_legal")
      .insert({
        archivo_nombre: formString(formData, "archivo_nombre"),
        archivo_path: formString(formData, "archivo_path"),
        archivo_size: null,
        archivo_tipo: formString(formData, "archivo_tipo"),
        categoria: formString(formData, "categoria"),
        created_by: user.id,
        descripcion: formString(formData, "descripcion"),
        empresa_id: empresaId,
        estado: "presentado",
        tipo_documento: formRequired(formData, "tipo_documento", "Tipo de documento"),
        titulo: formRequired(formData, "titulo", "Título"),
        visible_publicamente: formString(formData, "visible_publicamente") !== "false"
      });

    if (error) {
      return initialError(`No se pudo cargar documentación: ${error.message}`);
    }

    await logAction({
      accion: "documentacion_legal_presentada",
      actorId: user.id,
      detalle: { empresa_id: empresaId },
      objeto: "empresa_documentacion_legal"
    });
    await revalidateEmpresaViews(empresaId);

    return { error: null, success: "Documento legal cargado." };
  } catch (error) {
    return initialError(error instanceof Error ? error.message : "Error inesperado.");
  }
}

export async function upsertIvaDocumentAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const empresaId = formRequired(formData, "empresa_id", "Empresa");
    const { user } = await requireEditableEmpresa(empresaId);
    const mes = parseIvaMes(formString(formData, "mes"));
    const tipoMovimiento = parseIvaMovimiento(
      formString(formData, "tipo_movimiento")
    );
    const periodoAnio = parsePeriodoAnio(formString(formData, "periodo_anio"));
    const archivoPath = formRequired(formData, "archivo_path", "Archivo PDF");
    const archivoNombre = formRequired(
      formData,
      "archivo_nombre",
      "Nombre del archivo"
    );
    const archivoTipo = formString(formData, "archivo_tipo") ?? "application/pdf";

    if (archivoTipo !== "application/pdf") {
      return initialError("IVA Compras/Ventas debe cargarse en formato PDF.");
    }

    const titulo =
      tipoMovimiento === "compra"
        ? `IVA Compras - ${mes} ${periodoAnio}`
        : `IVA Ventas - ${mes} ${periodoAnio}`;
    const supabase = await createClient();
    const { data: existing, error: existingError } = await supabase
      .from("empresa_documentacion_legal")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("categoria", "iva_compra_venta")
      .eq("periodo_anio", periodoAnio)
      .eq("mes", mes)
      .eq("tipo_movimiento", tipoMovimiento)
      .maybeSingle<{ id: string }>();

    if (existingError) {
      return initialError(`No se pudo validar IVA: ${existingError.message}`);
    }

    const payload = {
      archivo_nombre: archivoNombre,
      archivo_path: archivoPath,
      archivo_size: null,
      archivo_tipo: archivoTipo,
      categoria: "iva_compra_venta",
      created_by: user.id,
      descripcion:
        "Documento exportado desde Regisoft para Información Legal y Contable.",
      emitido_por: "Regisoft",
      empresa_id: empresaId,
      estado: "presentado" as const,
      mes,
      origen: "regisoft",
      periodo_anio: periodoAnio,
      tipo_documento:
        tipoMovimiento === "compra" ? "iva_compra" : "iva_venta",
      tipo_movimiento: tipoMovimiento,
      titulo,
      updated_at: new Date().toISOString(),
      visible_publicamente: true
    };

    const { error } = existing
      ? await supabase
          .from("empresa_documentacion_legal")
          .update(payload)
          .eq("id", existing.id)
      : await supabase.from("empresa_documentacion_legal").insert(payload);

    if (error) {
      return initialError(`No se pudo guardar IVA: ${error.message}`);
    }

    await logAction({
      accion: "iva_documento_presentado",
      actorId: user.id,
      detalle: {
        empresa_id: empresaId,
        mes,
        periodo_anio: periodoAnio,
        tipo_movimiento: tipoMovimiento
      },
      objeto: "empresa_documentacion_legal"
    });
    await revalidateEmpresaViews(empresaId);

    return { error: null, success: "PDF de IVA guardado." };
  } catch (error) {
    return initialError(error instanceof Error ? error.message : "Error inesperado.");
  }
}

export async function reviewLegalDocumentAction(formData: FormData) {
  const { profile, user } = await assertActiveUserCanOperate(
    "revisar documentación legal"
  );
  const documentoId = formRequired(formData, "documento_id", "Documento");
  const empresaId = formRequired(formData, "empresa_id", "Empresa");
  const estado = formRequired(formData, "estado", "Estado") as DocumentoLegalEstado;

  if (
    !["pendiente", "presentado", "observado", "aprobado", "rechazado"].includes(
      estado
    )
  ) {
    throw new Error("El estado de revisión no es válido.");
  }

  if (profile.rol !== "profesora_admin" && !profile.empresa_id) {
    throw new Error("No tenés permisos para revisar documentación.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("empresa_documentacion_legal")
    .update({
      estado,
      observacion: formString(formData, "observacion"),
      revisado_at: new Date().toISOString(),
      revisado_por: user.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", documentoId)
    .eq("empresa_id", empresaId);

  if (error) {
    throw new Error(`No se pudo revisar documentación: ${error.message}`);
  }

  await logAction({
    accion: "documentacion_legal_revisada",
    actorId: user.id,
    detalle: { documento_id: documentoId, empresa_id: empresaId, estado },
    objeto: "empresa_documentacion_legal"
  });
  await revalidateEmpresaViews(empresaId);
}
