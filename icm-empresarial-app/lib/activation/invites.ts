import "server-only";
import { createHash, randomBytes } from "crypto";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActivationRole = "empresa" | "profesora_admin";

export type ActivationInviteRow = {
  id: string;
  token_hash: string;
  empresa_id: string | null;
  email: string;
  rol: ActivationRole;
  metadata: Record<string, unknown>;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  revoked_at: string | null;
  sent_at: string | null;
  last_send_attempt_at: string | null;
  send_count: number;
  send_status: "pendiente" | "enviado" | "fallido" | "omitido";
  send_error: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivationInviteStatus =
  | "valid"
  | "missing"
  | "invalid"
  | "expired"
  | "used";

export type PublicActivationInvite = {
  id: string;
  email: string;
  rol: ActivationRole;
  empresaId: string | null;
  empresaNombre: string | null;
  expiresAt: string;
};

export type InviteSummary = {
  empresa_id: string | null;
  email: string;
  expires_at: string;
  id: string;
  rol: ActivationRole;
  send_count: number;
  send_error: string | null;
  send_status: ActivationInviteRow["send_status"];
  sent_at: string | null;
  used_at: string | null;
};

type EmpresaInviteInfo = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  contacto_email: string | null;
  activo: boolean;
};

type CreateInviteInput = {
  email: string;
  empresa?: EmpresaInviteInfo | null;
  metadata?: Record<string, unknown>;
  role: ActivationRole;
  createdBy: string;
};

type CreateInviteResult = {
  invite: ActivationInviteRow;
  token: string;
  activationUrl: string;
};

const TOKEN_BYTES = 32;
const INVITE_TTL_DAYS = 14;
const RESEND_COOLDOWN_HOURS = 6;

export function normalizeActivationEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidActivationEmail(email: string | null): email is string {
  return Boolean(
    email && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

export function hashActivationToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateActivationToken() {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function getAppUrl() {
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
  const url = new URL(withProtocol);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("La URL publica de la app no es valida.");
  }

  return url.origin;
}

export function buildActivationUrl(token: string) {
  const url = new URL("/activar", getAppUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

function expiresAtDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);
  return expiresAt;
}

function resendCooldownDate() {
  const date = new Date();
  date.setHours(date.getHours() - RESEND_COOLDOWN_HOURS);
  return date;
}

function publicInviteFromRow(
  invite: ActivationInviteRow,
  empresaNombre: string | null
): PublicActivationInvite {
  return {
    email: invite.email,
    empresaId: invite.empresa_id,
    empresaNombre,
    expiresAt: invite.expires_at,
    id: invite.id,
    rol: invite.rol
  };
}

async function revokeReusableInvites(
  admin: SupabaseClient,
  input: CreateInviteInput
) {
  let query = admin
    .from("user_activation_invites")
    .update({ revoked_at: new Date().toISOString(), send_status: "omitido" })
    .eq("rol", input.role)
    .eq("email", input.email)
    .is("used_at", null)
    .is("revoked_at", null);

  if (input.role === "empresa" && input.empresa) {
    query = query.eq("empresa_id", input.empresa.id);
  } else {
    query = query.is("empresa_id", null);
  }

  await query;
}

export async function getRecentActiveInvite(
  admin: SupabaseClient,
  input: CreateInviteInput
) {
  let query = admin
    .from("user_activation_invites")
    .select("*")
    .eq("rol", input.role)
    .eq("email", input.email)
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (input.role === "empresa" && input.empresa) {
    query = query.eq("empresa_id", input.empresa.id);
  } else {
    query = query.is("empresa_id", null);
  }

  const { data, error } = await query.maybeSingle<ActivationInviteRow>();

  if (error) {
    throw new Error(`No se pudo revisar invitaciones previas: ${error.message}`);
  }

  if (!data?.sent_at) {
    return null;
  }

  const sentAt = new Date(data.sent_at);
  return sentAt > resendCooldownDate() ? data : null;
}

export async function createActivationInvite(
  input: CreateInviteInput
): Promise<CreateInviteResult> {
  const admin = createAdminClient();

  await revokeReusableInvites(admin, input);

  const token = generateActivationToken();
  const tokenHash = hashActivationToken(token);
  const { data, error } = await admin
    .from("user_activation_invites")
    .insert({
      email: input.email,
      empresa_id: input.empresa?.id ?? null,
      expires_at: expiresAtDate().toISOString(),
      metadata: input.metadata ?? {},
      rol: input.role,
      token_hash: tokenHash,
      created_by: input.createdBy
    })
    .select("*")
    .single<ActivationInviteRow>();

  if (error || !data) {
    throw new Error(
      `No se pudo crear el token de activacion: ${error?.message ?? "sin datos"}`
    );
  }

  return {
    activationUrl: buildActivationUrl(token),
    invite: data,
    token
  };
}

export async function markInviteSendAttempt(
  inviteId: string,
  status: ActivationInviteRow["send_status"],
  errorMessage?: string | null
) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: current } = await admin
    .from("user_activation_invites")
    .select("send_count")
    .eq("id", inviteId)
    .maybeSingle<{ send_count: number }>();

  const update: Record<string, string | number | null> = {
    last_send_attempt_at: now,
    send_count: (current?.send_count ?? 0) + 1,
    send_error: errorMessage ?? null,
    send_status: status
  };

  if (status === "enviado") {
    update.sent_at = now;
  }

  const { error } = await admin
    .from("user_activation_invites")
    .update(update)
    .eq("id", inviteId);

  if (error) {
    throw new Error(`No se pudo actualizar el estado de envio: ${error.message}`);
  }
}

export async function getActivationInviteByToken(token: string | null) {
  if (!token) {
    return { invite: null, status: "missing" as ActivationInviteStatus };
  }

  const cleanToken = token.trim();
  if (cleanToken.length < 32 || cleanToken.length > 200) {
    return { invite: null, status: "invalid" as ActivationInviteStatus };
  }

  const admin = createAdminClient();
  const { data: invite, error } = await admin
    .from("user_activation_invites")
    .select("*")
    .eq("token_hash", hashActivationToken(cleanToken))
    .maybeSingle<ActivationInviteRow>();

  if (error || !invite || invite.revoked_at) {
    return { invite: null, status: "invalid" as ActivationInviteStatus };
  }

  if (invite.used_at) {
    return { invite: null, status: "used" as ActivationInviteStatus };
  }

  if (new Date(invite.expires_at) <= new Date()) {
    return { invite: null, status: "expired" as ActivationInviteStatus };
  }

  let empresaNombre: string | null = null;
  if (invite.empresa_id) {
    const { data: empresa } = await admin
      .from("empresas")
      .select("nombre,nombre_comercial,activo")
      .eq("id", invite.empresa_id)
      .maybeSingle<{
        nombre: string;
        nombre_comercial: string | null;
        activo: boolean;
      }>();

    if (!empresa?.activo) {
      return { invite: null, status: "invalid" as ActivationInviteStatus };
    }

    empresaNombre = empresa.nombre_comercial ?? empresa.nombre;
  }

  return {
    invite: publicInviteFromRow(invite, empresaNombre),
    row: invite,
    status: "valid" as ActivationInviteStatus
  };
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = createAdminClient();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000
    });

    if (error) {
      throw new Error(`No se pudo buscar el usuario existente: ${error.message}`);
    }

    const match =
      data.users.find(
        (user) => user.email?.toLowerCase() === email.toLowerCase()
      ) ?? null;

    if (match || data.users.length < 1000) {
      return match;
    }

    page += 1;
  }

  throw new Error("Hay demasiados usuarios para buscar por email en el admin API.");
}

export async function getCompanyInviteSummaries(): Promise<InviteSummary[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_activation_invites")
    .select(
      "id,empresa_id,email,rol,expires_at,used_at,sent_at,send_count,send_status,send_error"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("ICM activation invite summary failure", error);
    return [];
  }

  return (data ?? []) as InviteSummary[];
}
