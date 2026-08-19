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
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (!configured) {
    throw new Error("Falta configurar NEXT_PUBLIC_APP_URL en Vercel.");
  }
  return configured.replace(/\/$/, "");
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
  const { user } = await requireProfessor();
  const empresaId = getString(formData, "empresa_id");
  const email = normalizeEmail(getString(formData, "contacto_email"));

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
    return {
      error: `No se pudo guardar el email: ${error.message}`,
      success: null
    };
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
}

export async function sendCompanyInviteAction(
  _state: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const { user } = await requireProfessor();
  const empresaId = getString(formData, "empresa_id");
  const submittedEmail = normalizeEmail(getString(formData, "contacto_email"));

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
      return {
        error: `No se pudo guardar el email: ${updateError.message}`,
        success: null
      };
    }
  }

  const email = submittedEmail;
  const nombre = empresa.nombre_comercial ?? empresa.nombre;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      empresa_id: empresa.id,
      empresa_nombre: nombre,
      icm_invite: true,
      icm_role: "empresa",
      nombre
    },
    redirectTo: `${getAppUrl()}/update-password?invite=1`
  });

  if (error) {
    return {
      error: `No se pudo enviar la invitación a ${email}: ${error.message}`,
      success: null
    };
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
}

export async function sendProfessorInviteAction(
  _state: InviteFormState,
  formData: FormData
): Promise<InviteFormState> {
  const { user } = await requireProfessor();
  const email = getString(formData, "email");
  const nombre = getString(formData, "nombre");

  if (!email || !nombre) {
    return { error: "Completá nombre y email.", success: null };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      icm_invite: true,
      icm_role: "profesora_admin",
      nombre
    },
    redirectTo: `${getAppUrl()}/update-password?invite=1`
  });

  if (error) {
    return {
      error: `No se pudo enviar la invitación: ${error.message}`,
      success: null
    };
  }

  await logAction({
    accion: "invitacion_profesora_enviada",
    actorId: user.id,
    detalle: { email, nombre },
    objeto: "auth_user_invite"
  });

  return { error: null, success: `Invitación enviada a ${email}.` };
}
