"use client";

import { AlertCircle, Send } from "lucide-react";
import { useActionState } from "react";
import { type ReplyCorrespondenciaFormState } from "@/lib/buzon/actions";
import { replyModeratedCorrespondenciaAction } from "@/lib/buzon/moderated-actions";
import { Button } from "@/components/ui/Button";

type ReplyFormProps = {
  correspondenciaId: string;
  redirectTo?: string;
};

const initialState: ReplyCorrespondenciaFormState = {
  error: null,
  fieldErrors: {}
};

export function ReplyForm({ correspondenciaId, redirectTo }: ReplyFormProps) {
  const [state, formAction, isPending] = useActionState(
    replyModeratedCorrespondenciaAction,
    initialState
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-border bg-white p-4 shadow-sm"
    >
      <input name="correspondencia_id" type="hidden" value={correspondenciaId} />
      {redirectTo ? (
        <input name="redirect_to" type="hidden" value={redirectTo} />
      ) : null}
      {state.error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{state.error}</p>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-medium text-ink">
          Respuesta
          <textarea
            className="mt-2 min-h-24 w-full resize-y rounded-xl border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            minLength={5}
            name="contenido"
            placeholder="Escribir respuesta formal..."
            required
          />
          {state.fieldErrors.contenido ? (
            <span className="mt-1 block text-xs text-red-700">
              {state.fieldErrors.contenido}
            </span>
          ) : null}
        </label>
        <Button className="gap-2 sm:mb-0.5" disabled={isPending} type="submit">
          <Send className="h-4 w-4" />
          {isPending ? "Verificando..." : "Responder"}
        </Button>
      </div>
    </form>
  );
}
