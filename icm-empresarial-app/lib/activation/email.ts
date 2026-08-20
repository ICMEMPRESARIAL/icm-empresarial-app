import "server-only";
import type { ActivationRole } from "@/lib/activation/invites";

type SendActivationEmailInput = {
  activationUrl: string;
  email: string;
  expiresAt: string;
  name: string;
  role: ActivationRole;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta configurar ${name} para enviar emails de activacion.`);
  }
  return value;
}

function getSender() {
  return {
    email: requiredEnv("BREVO_SENDER_EMAIL"),
    name: process.env.BREVO_SENDER_NAME?.trim() || "ICM Empresarial"
  };
}

function getReplyTo() {
  const email = process.env.BREVO_REPLY_TO_EMAIL?.trim();
  if (!email) {
    return undefined;
  }

  return {
    email,
    name: process.env.BREVO_REPLY_TO_NAME?.trim() || "ICM Empresarial"
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires"
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function roleLabel(role: ActivationRole) {
  return role === "profesora_admin" ? "docente" : "empresa";
}

function htmlBody(input: SendActivationEmailInput) {
  const safeName = escapeHtml(input.name);
  const safeUrl = escapeHtml(input.activationUrl);
  const expiresAt = escapeHtml(formatDate(input.expiresAt));

  return `
    <div style="margin:0;padding:24px;background:#f7f9fc;font-family:Arial,sans-serif;color:#13233a">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dde5ef;border-radius:12px;padding:28px">
        <p style="margin:0 0 10px;color:#1f5d99;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">ICM Empresarial</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#13233a">Activá tu cuenta</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569">Hola, ${safeName}. Recibiste esta invitación para ingresar a la plataforma ICM Empresarial como ${roleLabel(input.role)}.</p>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#475569">Usá este enlace para crear tu contraseña y entrar con la cuenta ya asignada:</p>
        <p style="margin:0 0 22px">
          <a href="${safeUrl}" style="display:inline-block;background:#1f5d99;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;padding:12px 18px">Activar cuenta</a>
        </p>
        <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#64748b">El enlace vence el ${expiresAt} y solo puede usarse una vez.</p>
        <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b">Si el botón no funciona, copiá y pegá este enlace en el navegador:<br><span style="word-break:break-all">${safeUrl}</span></p>
      </div>
    </div>
  `;
}

function textBody(input: SendActivationEmailInput) {
  return [
    "ICM Empresarial",
    "",
    `Hola, ${input.name}.`,
    `Recibiste esta invitacion para ingresar como ${roleLabel(input.role)}.`,
    "",
    "Activá tu cuenta desde este enlace:",
    input.activationUrl,
    "",
    `El enlace vence el ${formatDate(input.expiresAt)} y solo puede usarse una vez.`
  ].join("\n");
}

export async function sendActivationEmail(input: SendActivationEmailInput) {
  const apiKey = requiredEnv("BREVO_API_KEY");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    body: JSON.stringify({
      htmlContent: htmlBody(input),
      replyTo: getReplyTo(),
      sender: getSender(),
      subject: "Activá tu cuenta de ICM Empresarial",
      textContent: textBody(input),
      to: [{ email: input.email, name: input.name }]
    }),
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Brevo no acepto el email (${response.status}). ${detail.slice(0, 500)}`
    );
  }
}
