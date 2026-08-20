type ErrorRecord = Record<string, unknown>;

export type SafeAuthErrorDetails = {
  code?: string;
  message: string;
  name?: string;
  status?: number;
};

function asRecord(value: unknown): ErrorRecord | null {
  return value && typeof value === "object" ? (value as ErrorRecord) : null;
}

function getStringProp(value: ErrorRecord, key: string) {
  const prop = value[key];
  return typeof prop === "string" && prop.trim().length > 0
    ? prop.trim()
    : null;
}

function getNumberProp(value: ErrorRecord, key: string) {
  const prop = value[key];
  if (typeof prop === "number") {
    return prop;
  }
  if (typeof prop === "string" && /^\d+$/.test(prop)) {
    return Number(prop);
  }
  return null;
}

export function getSafeAuthErrorDetails(
  error: unknown,
  fallbackMessage = "Supabase no devolvio detalle publico del error."
): SafeAuthErrorDetails {
  if (typeof error === "string") {
    return { message: error };
  }

  const record = asRecord(error);
  const messageFromError = error instanceof Error ? error.message : null;
  const nameFromError = error instanceof Error ? error.name : null;

  if (!record) {
    return {
      message: messageFromError ?? fallbackMessage,
      name: nameFromError ?? undefined
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
      fallbackMessage,
    name: nameFromError ?? getStringProp(record, "name") ?? undefined,
    status:
      getNumberProp(record, "status") ??
      getNumberProp(record, "statusCode") ??
      undefined
  };
}

export function formatSafeAuthErrorDetails(details: SafeAuthErrorDetails) {
  const meta = [
    details.code ? `codigo ${details.code}` : null,
    details.status ? `status ${details.status}` : null
  ].filter(Boolean);

  return meta.length > 0
    ? `${details.message} (${meta.join(", ")})`
    : details.message;
}
