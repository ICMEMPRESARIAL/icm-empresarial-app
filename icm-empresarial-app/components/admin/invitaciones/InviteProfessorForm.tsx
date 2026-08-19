"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  sendProfessorInviteAction,
  type InviteFormState
} from "@/lib/admin/invitaciones/actions";

const initialState: InviteFormState = { error: null, success: null };

export function InviteProfessorForm() {
  const [state, action, pending] = useActionState(
    sendProfessorInviteAction,
    initialState
  );

  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre de la profesora" name="nombre" required />
        <Input label="Email" name="email" required type="email" />
      </div>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-emerald-700">{state.success}</p>
      ) : null}
      <Button disabled={pending} type="submit">
        {pending ? "Enviando..." : "Enviar invitación docente"}
      </Button>
    </form>
  );
}
