"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/require-auth";
import { logAction } from "@/lib/audit/log-action";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InviteFormState = {
  error: string | null;
  success: string | null;
};

type InviteErrorContext = {
  action: string;
  email?: string | null;
  empresaId?: string | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string) {
  const clean = value.trim().toLowerCase();
  return clean.length > 0 ? clean : null;
}

function isValidEmail(value: string | null): value is string {
  return Boolean(value && value.length <= 254 && emailPattern.test(value));
}

async function requireProfessor() {
  const session = await requireAuth();
  if (session.profile.rol !== "profesora_admin") {
    throw new Error("Solo la profesora administradora puede enviar invitaciones.");
  }
  return session;
}

function getAppUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  if (!configured) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_APP_URL o NEXT_PUBLIC_SITE_URL en Vercel."
    );
  }

  const withProtocol = /^https?:\/\//i.test(configured)
    ? configured
    : `https://${configured}`;

  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Protocolo invalido.");
    }

    return url.origin;
  } catch {
    throw new Error(
      "La URL publica de la app no es valida para enviar invitaciones."
    );
  }
}

function getInviteRedirectTo() {
  return `${getAppUrl()}/update-password?invite=1`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function getStringProp(value: Record<string, unknown>, key: string) {
  const prop = value[key];
  return typeof prop === "string" && prop.trim().length > 0
    ? prop.trim()
    : null;
}

function getNumberProp(value: Record<string, unknown>, key: string) {
  const prop = value[key];
  if (typeof prop === "number") {
    return prop;
  }
  if (typeof prop === "string" && /^\d+$/.test(prop)) {
    return Number(prop);
  }
  return null;
}

function getSafeErrorDetails(error: unknown) {
  if (typeof error === "string") {
    return { message: error };
  }

  const record = asRecord(error);
  const messageFromError = error instanceof Error ? error.message : null;
  const nameFromError = error instanceof Error ? error.name : null;

  if (!record) {
    return {
      message: messageFromError ?? "Error desconocido."
    };
  }

  return {
    code:
      getStringProp(record, "code") ??
      getStringProp(record, "error_code") ??
      undefined,
    message:
      messageFromError ??
      getStringProp(record, "message") ??
      getStringProp(record, "msg") ??
      getStringProp(record, "error_description") ??
      getStringProp(record, "error") ??
      "Supabase no devolvio detalle publico del error.",
    name: nameFromError ?? getStringProp(record, "name") ?? undefined,
    status: getNumberProp(record, "status") ?? undefined
  };
}

function userMessageForInviteFailure(
  error: unknown,
  fallbackMessage: string
) {
  const details = getSafeErrorDetails(error);
  const rawMessage = details.message;
  const lowerMessage = rawMessage.toLowerCase();

  if (
    lowerMessage.includes("next_public_app_url") ||
    lowerMessage.includes("next_public_site_url") ||
    lowerMessage.includes("url publica")
  ) {
    return `${fallbackMessage} Falta configurar la URL publica de la app para armar el enlace de invitacion.`;
  }

  if (
    lowerMessage.includes("redirect") ||
    lowerMessage.includes("not allowed") ||
    lowerMessage.includes("invalid url")
  ) {
    return `${fallbackMessage} La URL de redireccion no esta permitida en Supabase Auth.`;
  }

  if (
    lowerMessage.includes("already") ||
    lowerMessage.includes("registered") ||
    lowerMessage.includes("exists")
  ) {
    return `${fallbackMessage} Ya existe una cuenta registrada con ese email.`;
  }

  if (details.status === 429 || lowerMessage.includes("rate limit")) {
    return `${fallbackMessage} Supabase limito temporalmente los envios. Probá de nuevo en unos minutos.`;
  }

  if (
    lowerMessage.includes("smtp") ||
    lowerMessage.includes("email") ||
    lowerMessage.includes("mail")
  ) {
    return `${fallbackMessage} Supabase no pudo entregar el email de invitacion.`;
  }

  const suffix = rawMessage && rawMessage !== "{}" ? ` Detalle: ${rawMessage}` : "";
  return `${fallbackMessage}${suffix}`;
}

function inviteFailureState(
  error: unknown,
  fallbackMessage: string,
  context: InviteErrorContext
): InviteFormState {
  const details = getSafeErrorDetails(error);

  console.error("ICM invite failure", {
    ...context,
    ...details
  });

  return {
    error: userMessageForInviteFailure(error, fallbackMessage),
    success: null
  };
}

async function getInviteEmpresa(empresaId: string) {
  const supabase = await createClient();
  const { data: empresa, error: empresaError } = await supabase
    .from("empresas")
    .select("id,nombre,nombre_comercial,contacto_email,activo")
    .eq("id", empresaId)
    .maybeSingle<{
      id: string;
      nombre: string;
      nombre_comercial: string | null;
      contacto_email: string | null;
      activo: boolean;
    }>();

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

    if (email && !isValidEmail(email)) {
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
        ? `Email guardado para ${empresa.nombre_comercial ?? empresa.nombre}.`
        : `Email eliminado para ${empresa.nombre_comercial ?? empresa.nombre}.`
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

    if (!isValidEmail(submittedEmail)) {
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

    const email = submittedEmail;
    const nombre = empresa.nombre_comercial ?? empresa.nombre;
    const redirectTo = getInviteRedirectTo();
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        empresa_id: empresa.id,
        empresa_nombre: nombre,
        icm_invite: true,
        icm_role: "empresa",
        nombre
      },
      redirectTo
    });

    if (error) {
      return inviteFailureState(error, fallbackMessage, {
        action: "send_company_invite",
        email,
        empresaId: empresa.id
      });
    }

    await logAction({
      accion: "invitacion_empresa_enviada",
      actorId: user.id,
      detalle: { email, empresa_id: empresa.id },
      objeto: "auth_user_invite"
    });

    revalidatePath("/admin/invitaciones");
    return {
      error: null,
      success: `Invitación enviada a ${nombre} (${email}).`
    };
  } catch (error) {
    return inviteFailureState(error, fallbackMessage, {
      action: "send_company_invite",
      email: submittedEmail,
      empresaId
    });
  }
}

export async function sendProfessorInviteAction(
  _state: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const email = getString(formData, "email");
  const nombre = getString(formData, "nombre");

  try {
    const { user } = await requireProfessor();

    if (!email || !nombre) {
      return { error: "Completá nombre y email.", success: null };
    }

    if (!isValidEmail(normalizeEmail(email))) {
      return { error: "Ingresá un email válido.", success: null };
    }

    const redirectTo = getInviteRedirectTo();
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        icm_invite: true,
        icm_role: "profesora_admin",
        nombre
      },
      redirectTo
    });

    if (error) {
      return inviteFailureState(error, "No se pudo enviar la invitacion.", {
        action: "send_professor_invite",
        email
      });
    }

    await logAction({
      accion: "invitacion_profesora_enviada",
      actorId: user.id,
      detalle: { email, nombre },
      objeto: "auth_user_invite"
    });

    return { error: null, success: `Invitación enviada a ${email}.` };
  } catch (error) {
    return inviteFailureState(error, "No se pudo enviar la invitacion.", {
      action: "send_professor_invite",
      email
    });
  }
}
