"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  activateInviteAction,
  type ActivationFormState
} from "@/lib/activation/actions";

type ActivationFormProps = {
  token: string;
};

const initialState: ActivationFormState = { error: null };

export function ActivationForm({ token }: ActivationFormProps) {
  const [state, action, pending] = useActionState(
    activateInviteAction,
    initialState
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      <input name="token" type="hidden" value={token} />
      <Input
        autoComplete="new-password"
        label="Contraseña"
        minLength={8}
        name="password"
        required
        type="password"
      />
      <Input
        autoComplete="new-password"
        label="Repetir contraseña"
        minLength={8}
        name="confirm_password"
        required
        type="password"
      />
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Activando..." : "Activar cuenta"}
      </Button>
    </form>
  );
}
