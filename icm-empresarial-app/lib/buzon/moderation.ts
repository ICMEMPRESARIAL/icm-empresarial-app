import "server-only";

export type MessageModerationResult = {
  allowed: boolean;
  categories: Record<string, boolean>;
  source: string;
  reason: string | null;
};

const localBlockedPatterns = [
  /\bpelotud[oa]s?\b/i,
  /\bbolud[oa]s?\b/i,
  /\bforr[oa]s?\b/i,
  /\bidiot(a|as|a?s?)\b/i,
  /\bimb[eé]cil(es)?\b/i,
  /\bput[oa]s?\b/i,
  /\bhdp\b/i,
  /\bhijo(?:s)? de puta\b/i,
  /\bmierda\b/i,
  /\bmog[oó]lic[oa]s?\b/i,
  /\bretardad[oa]s?\b/i,
  /\bte voy a (?:matar|cagar a trompadas|pegar)\b/i,
  /\blos voy a (?:matar|cagar a trompadas|pegar)\b/i
];

function normalizeText(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function localModeration(text: string): MessageModerationResult | null {
  const normalized = normalizeText(text);
  const matched = localBlockedPatterns.some((pattern) => pattern.test(normalized));

  if (!matched) {
    return null;
  }

  return {
    allowed: false,
    categories: { lenguaje_agresivo_local: true },
    reason:
      "El mensaje contiene lenguaje agresivo o inapropiado para un ámbito educativo.",
    source: "local"
  };
}

type OpenAIModerationResponse = {
  results?: Array<{
    flagged?: boolean;
    categories?: Record<string, boolean>;
  }>;
};

export async function moderateEducationalMessage(
  text: string
): Promise<MessageModerationResult> {
  const localResult = localModeration(text);

  if (localResult) {
    return localResult;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "La moderación automática no está configurada. No se enviará el mensaje sin revisión de seguridad."
    );
  }

  const response = await fetch("https://api.openai.com/v1/moderations", {
    body: JSON.stringify({
      input: text,
      model: "omni-moderation-latest"
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      "No se pudo verificar el mensaje con el sistema de moderación. Intentá nuevamente."
    );
  }

  const data = (await response.json()) as OpenAIModerationResponse;
  const result = data.results?.[0];

  if (!result) {
    throw new Error("La respuesta del sistema de moderación no fue válida.");
  }

  const categories = result.categories ?? {};
  const blocked = Boolean(result.flagged);

  return {
    allowed: !blocked,
    categories,
    reason: blocked
      ? "El mensaje fue bloqueado porque contiene contenido incompatible con las normas de convivencia."
      : null,
    source: "openai"
  };
}
