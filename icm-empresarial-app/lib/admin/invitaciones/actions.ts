"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/require-auth";
import { logAction } from "@/lib/audit/log-action";
import { sendActivationEmail } from "@/lib/activation/email";
import {
  createActivationInvite,
  getRecentActiveInvite,
  isValidActivationEmail,
  markInviteSendAttempt,
  normalizeActivationEmail,
  type ActivationRole
} from "@/lib/activation/invites";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InviteSendResult = {
  email: string;
  empresa: string;
  status: "enviado" | "omitido" | "fallido";
  message: string;
};

export type InviteFormState = {
  error: string | null;
  success: string | null;
  results?: InviteSendResult[];
};

type EmpresaInvite = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  contacto_email: string | null;
  activo: boolean;
};

const initialResult: InviteFormState = { error: null, success: null };

function getString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string) {
  const clean = normalizeActivationEmail(value);
  return clean.length > 0 ? clean : null;
}

function getCheckbox(formData: FormData, field: string) {
  return formData.get(field) === "on";
}

function inviteFailureState(
  error: unknown,
  fallbackMessage: string,
  context: Record<string, string | null>
): InviteFormState {
  const message = error instanceof Error ? error.message : String(error);
  console.error("ICM activation invite failure", {
    ...context,
    message
  });

  return {
    error: `${fallbackMessage} Detalle: ${message}`,
    success: null
  };
}

async function requireProfessor() {
  const session = await requireAuth();
  if (session.profile.rol !== "profesora_admin") {
    throw new Error("Solo la profesora administradora puede enviar invitaciones.");
  }
  return session;
}

async function getInviteEmpresa(empresaId: string) {
  const supabase = await createClient();
  const { data: empresa, error: empresaError } = await supabase
    .from("empresas")
    .select("id,nombre,nombre_comercial,contacto_email,activo")
    .eq("id", empresaId)
    .maybeSingle<EmpresaInvite>();

  if (empresaError || !empresa) {
    return { empresa: null, error: "No se pudo cargar la empresa." };
  }

  if (!empresa.activo) {
    return {
      empresa: null,
      error: "La empresa está inactiva y no puede ser invitada."
    };
  }

  return { empresa, error: null };
}

async function updateCompanyInviteEmail(empresaId: string, email: string | null) {
  const supabase = await createClient();
  return supabase.rpc("actualizar_contacto_email_empresa_admin", {
    p_contacto_email: email,
    p_empresa_id: empresaId
  });
}

function displayEmpresaName(empresa: Pick<EmpresaInvite, "nombre" | "nombre_comercial">) {
  return empresa.nombre_comercial ?? empresa.nombre;
}

async function sendActivationInvite({
  createdBy,
  email,
  empresa,
  nombre,
  role
}: {
  createdBy: string;
  email: string;
  empresa: EmpresaInvite | null;
  nombre: string;
  role: ActivationRole;
}): Promise<InviteSendResult> {
  const admin = createAdminClient();
  const recent = await getRecentActiveInvite(admin, {
    createdBy,
    email,
    empresa,
    metadata: { nombre },
    role
  });

  if (recent) {
    return {
      email,
      empresa: nombre,
      message: "Ya tenía una invitación enviada recientemente; no se duplicó.",
      status: "omitido"
    };
  }

  const { activationUrl, invite } = await createActivationInvite({
    createdBy,
    email,
    empresa,
    metadata: {
      empresa_id: empresa?.id ?? null,
      empresa_nombre: empresa ? displayEmpresaName(empresa) : null,
      icm_role: role,
      nombre
    },
    role
  });

  try {
    await sendActivationEmail({
      activationUrl,
      email,
      expiresAt: invite.expires_at,
      name: nombre,
      role
    });
    await markInviteSendAttempt(invite.id, "enviado");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markInviteSendAttempt(invite.id, "fallido", message);
    throw error;
  }

  return {
    email,
    empresa: nombre,
    message: "Invitación enviada con enlace propio de activación.",
    status: "enviado"
  };
}

export async function updateCompanyInviteEmailAction(
  _state: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const empresaId = getString(formData, "empresa_id");
  const email = normalizeEmail(getString(formData, "contacto_email"));

  try {
    const { user } = await requireProfessor();

    if (!empresaId) {
      return { error: "Falta seleccionar la empresa.", success: null };
    }

    if (email && !isValidActivationEmail(email)) {
      return { error: "Ingresá un email válido.", success: null };
    }

    const { empresa, error: empresaError } = await getInviteEmpresa(empresaId);
    if (!empresa) {
      return { error: empresaError, success: null };
    }

    const { error } = await updateCompanyInviteEmail(empresa.id, email);
    if (error) {
      return inviteFailureState(error, "No se pudo guardar el email.", {
        action: "update_company_invite_email",
        email,
        empresaId: empresa.id
      });
    }

    await logAction({
      accion: "empresa_contacto_email_actualizado_para_invitacion",
      actorId: user.id,
      detalle: { email, empresa_id: empresa.id },
      objeto: "empresas"
    });

    revalidatePath("/admin/invitaciones");
    return {
      error: null,
      success: email
        ? `Email guardado para ${displayEmpresaName(empresa)}.`
        : `Email eliminado para ${displayEmpresaName(empresa)}.`
    };
  } catch (error) {
    return inviteFailureState(error, "No se pudo guardar el email.", {
      action: "update_company_invite_email",
      email,
      empresaId
    });
  }
}

export async function sendCompanyInviteAction(
  _state: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const empresaId = getString(formData, "empresa_id");
  const submittedEmail = normalizeEmail(getString(formData, "contacto_email"));
  const fallbackMessage = submittedEmail
    ? `No se pudo enviar la invitacion a ${submittedEmail}.`
    : "No se pudo enviar la invitacion.";

  try {
    const { user } = await requireProfessor();

    if (!empresaId) {
      return { error: "Falta seleccionar la empresa.", success: null };
    }

    if (!isValidActivationEmail(submittedEmail)) {
      return {
        error: "Cargá un email válido antes de enviar la invitación.",
        success: null
      };
    }

    const { empresa, error: empresaError } = await getInviteEmpresa(empresaId);
    if (!empresa) {
      return { error: empresaError, success: null };
    }

    const currentEmail = normalizeEmail(empresa.contacto_email ?? "");
    if (submittedEmail !== currentEmail) {
      const { error: updateError } = await updateCompanyInviteEmail(
        empresa.id,
        submittedEmail
      );

      if (updateError) {
        return inviteFailureState(
          updateError,
          "No se pudo guardar el email antes de enviar la invitacion.",
          {
            action: "send_company_invite_update_email",
            email: submittedEmail,
            empresaId: empresa.id
          }
        );
      }
    }

    const nombre = displayEmpresaName(empresa);
    const result = await sendActivationInvite({
      createdBy: user.id,
      email: submittedEmail,
      empresa,
      nombre,
      role: "empresa"
    });

    await logAction({
      accion: "activacion_empresa_enviada",
      actorId: user.id,
      detalle: { email: submittedEmail, empresa_id: empresa.id },
      objeto: "user_activation_invites"
    });

    revalidatePath("/admin/invitaciones");
    return {
      error: null,
      results: [result],
      success: `${result.message} ${nombre} (${submittedEmail}).`
    };
  } catch (error) {
    return inviteFailureState(error, fallbackMessage, {
      action: "send_company_activation_invite",
      email: submittedEmail,
      empresaId
    });
  }
}

export async function sendProfessorInviteAction(
  _state: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const email = normalizeEmail(getString(formData, "email"));
  const nombre = getString(formData, "nombre");

  try {
    const { user } = await requireProfessor();

    if (!email || !nombre) {
      return { error: "Completá nombre y email.", success: null };
    }

    if (!isValidActivationEmail(email)) {
      return { error: "Ingresá un email válido.", success: null };
    }

    const result = await sendActivationInvite({
      createdBy: user.id,
      email,
      empresa: null,
      nombre,
      role: "profesora_admin"
    });

    await logAction({
      accion: "activacion_profesora_enviada",
      actorId: user.id,
      detalle: { email, nombre },
      objeto: "user_activation_invites"
    });

    revalidatePath("/admin/invitaciones");
    return { error: null, results: [result], success: result.message };
  } catch (error) {
    return inviteFailureState(error, "No se pudo enviar la invitacion.", {
      action: "send_professor_activation_invite",
      email,
      empresaId: null
    });
  }
}

export async function sendBulkCompanyInvitesAction(
  _state: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  if (!getCheckbox(formData, "preview_green") || !getCheckbox(formData, "demo_ok")) {
    return {
      error: "Confirmá Preview verde y prueba demo exitosa antes de enviar el lote.",
      success: null
    };
  }

  try {
    const { user } = await requireProfessor();
    const supabase = await createClient();
    const { data: empresas, error } = await supabase
      .from("empresas")
      .select("id,nombre,nombre_comercial,contacto_email,activo")
      .eq("activo", true)
      .order("nombre");

    if (error) {
      throw new Error(error.message);
    }

    const results: InviteSendResult[] = [];

    for (const empresa of (empresas ?? []) as EmpresaInvite[]) {
      const nombre = displayEmpresaName(empresa);
      const email = normalizeEmail(empresa.contacto_email ?? "");

      if (!isValidActivationEmail(email)) {
        results.push({
          email: email ?? "",
          empresa: nombre,
          message: "Sin email válido cargado.",
          status: "omitido"
        });
        continue;
      }

      try {
        const result = await sendActivationInvite({
          createdBy: user.id,
          email,
          empresa,
          nombre,
          role: "empresa"
        });
        results.push(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({
          email,
          empresa: nombre,
          message,
          status: "fallido"
        });
      }
    }

    const sent = results.filter((result) => result.status === "enviado").length;
    const skipped = results.filter((result) => result.status === "omitido").length;
    const failed = results.filter((result) => result.status === "fallido").length;

    await logAction({
      accion: "activacion_empresas_lote",
      actorId: user.id,
      detalle: { empresas: results.length, enviadas: sent, fallidas: failed },
      objeto: "user_activation_invites"
    });

    revalidatePath("/admin/invitaciones");
    return {
      ...initialResult,
      results,
      success: `Lote procesado: ${sent} enviadas, ${skipped} omitidas, ${failed} fallidas.`
    };
  } catch (error) {
    return inviteFailureState(error, "No se pudo procesar el lote.", {
      action: "send_bulk_company_activation_invites",
      email: null,
      empresaId: null
    });
  }
}
