"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  sendCompanyInviteAction,
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

export function InviteCompanyForm({ empresa }: InviteCompanyFormProps) {
  const [state, action, pending] = useActionState(
    sendCompanyInviteAction,
    initialState
  );

  return (
    <form action={action} className="rounded-xl border border-border bg-white p-4">
      <input name="empresa_id" type="hidden" value={empresa.id} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-ink">{empresa.nombre}</p>
          <p className="mt-1 text-sm text-muted">
            {empresa.contacto_email ?? "Sin email cargado"}
          </p>
        </div>
        <Button disabled={pending || !empresa.contacto_email} type="submit">
          {pending ? "Enviando..." : "Enviar invitación"}
        </Button>
      </div>
      {state.error ? (
        <p className="mt-3 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-3 text-sm text-emerald-700">{state.success}</p>
      ) : null}
    </form>
  );
}
