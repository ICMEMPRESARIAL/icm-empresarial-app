"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  sendCompanyInviteAction,
  updateCompanyInviteEmailAction,
  type InviteFormState
} from "@/lib/admin/invitaciones/actions";

type InviteCompanyFormProps = {
  empresa: {
    id: string;
    nombre: string;
    contacto_email: string | null;
  };
};

const initialState: InviteFormState = { error: null, success: null };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getStateMessage(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return "Ocurrió un error inesperado. Revisá los logs de producción para ver el detalle técnico.";
}

export function InviteCompanyForm({ empresa }: InviteCompanyFormProps) {
  const [email, setEmail] = useState(empresa.contacto_email ?? "");
  const normalizedInitialEmail = (empresa.contacto_email ?? "")
    .trim()
    .toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const emailIsEmpty = normalizedEmail.length === 0;
  const emailIsValid = useMemo(
    () => normalizedEmail.length <= 254 && emailPattern.test(normalizedEmail),
    [normalizedEmail]
  );
  const emailChanged = normalizedEmail !== normalizedInitialEmail;
  const canSave = emailChanged && (emailIsEmpty || emailIsValid);
  const canInvite = emailIsValid;
  const [saveState, saveAction, saving] = useActionState(
    updateCompanyInviteEmailAction,
    initialState
  );
  const [inviteState, inviteAction, inviting] = useActionState(
    sendCompanyInviteAction,
    initialState
  );
  const pending = saving || inviting;
  const state = inviteState.error || inviteState.success ? inviteState : saveState;
  const errorMessage = getStateMessage(state.error);
  const successMessage = getStateMessage(state.success);

  return (
    <form action={saveAction} className="rounded-xl border border-border bg-white p-4">
      <input name="empresa_id" type="hidden" value={empresa.id} />
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(260px,360px)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{empresa.nombre}</p>
          <p className="mt-1 text-sm text-muted">
            {empresa.contacto_email
              ? "Email cargado para invitación"
              : "Sin email cargado"}
          </p>
        </div>
        <label className="block text-sm font-medium text-ink">
          Email de contacto
          <input
            className={[
              "mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:ring-2",
              !emailIsEmpty && !emailIsValid
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-border focus:border-brand focus:ring-brand/15"
            ].join(" ")}
            name="contacto_email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            placeholder="empresa@ejemplo.com"
            type="email"
            value={email}
          />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <Button
            disabled={pending || !canSave}
            formAction={saveAction}
            type="submit"
            variant="secondary"
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
          <Button
            disabled={pending || !canInvite}
            formAction={inviteAction}
            type="submit"
          >
            {inviting ? "Enviando..." : "Enviar invitación"}
          </Button>
        </div>
      </div>
      {!emailIsEmpty && !emailIsValid ? (
        <p className="mt-3 text-sm text-red-700">
          Ingresá un email válido para habilitar el envío.
        </p>
      ) : null}
      {emailChanged && !emailIsEmpty && emailIsValid ? (
        <p className="mt-3 text-sm text-amber-700">
          Si enviás la invitación ahora, también se guardará este email.
        </p>
      ) : null}
      {emailIsEmpty ? (
        <p className="mt-3 text-sm text-muted">
          Podés guardar el campo vacío, pero no se podrá enviar la invitación.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="mt-3 text-sm text-emerald-700">{successMessage}</p>
      ) : null}
    </form>
  );
}
