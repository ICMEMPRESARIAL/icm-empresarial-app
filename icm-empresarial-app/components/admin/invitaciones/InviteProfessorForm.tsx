"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  sendProfessorInviteAction,
  type InviteFormState
} from "@/lib/admin/invitaciones/actions";

const initialState: InviteFormState = { error: null, success: null };

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

export function InviteProfessorForm() {
  const [state, action, pending] = useActionState(
    sendProfessorInviteAction,
    initialState
  );
  const errorMessage = getStateMessage(state.error);
  const successMessage = getStateMessage(state.success);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre de la profesora" name="nombre" required />
        <Input label="Email" name="email" required type="email" />
      </div>
      {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
      {successMessage ? (
        <p className="text-sm text-emerald-700">{successMessage}</p>
      ) : null}
      <Button disabled={pending} type="submit">
        {pending ? "Enviando..." : "Enviar invitación docente"}
      </Button>
    </form>
  );
}
