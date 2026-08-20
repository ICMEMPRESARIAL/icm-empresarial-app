"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  sendBulkCompanyInvitesAction,
  type InviteFormState
} from "@/lib/admin/invitaciones/actions";

type BulkCompanyInvitesFormProps = {
  readyCount: number;
  totalCount: number;
};

const initialState: InviteFormState = { error: null, success: null };

function statusClass(status: string) {
  if (status === "enviado") {
    return "text-emerald-700";
  }
  if (status === "fallido") {
    return "text-red-700";
  }
  return "text-amber-700";
}

export function BulkCompanyInvitesForm({
  readyCount,
  totalCount
}: BulkCompanyInvitesFormProps) {
  const [state, action, pending] = useActionState(
    sendBulkCompanyInvitesAction,
    initialState
  );

  return (
    <form action={action} className="rounded-lg border border-border bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ink">Envío masivo</h3>
          <p className="mt-1 text-sm text-muted">
            Vista previa: {readyCount} de {totalCount} empresas activas tienen email válido.
          </p>
        </div>
        <Button disabled={pending || readyCount === 0} type="submit">
          {pending ? "Procesando..." : "Enviar lote"}
        </Button>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-ink sm:grid-cols-2">
        <label className="flex gap-2">
          <input className="mt-1" name="preview_green" type="checkbox" />
          <span>Preview de Vercel verde.</span>
        </label>
        <label className="flex gap-2">
          <input className="mt-1" name="demo_ok" type="checkbox" />
          <span>Empresa demo probada de punta a punta.</span>
        </label>
      </div>

      {state.error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}
      {state.results?.length ? (
        <div className="mt-4 max-h-72 overflow-auto rounded-md border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface text-ink">
              <tr>
                <th className="px-3 py-2 font-semibold">Empresa</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {state.results.map((result) => (
                <tr className="border-t border-border" key={`${result.empresa}-${result.email}`}>
                  <td className="px-3 py-2">{result.empresa}</td>
                  <td className="px-3 py-2 text-muted">{result.email || "Sin email"}</td>
                  <td className={`px-3 py-2 ${statusClass(result.status)}`}>
                    {result.status}: {result.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </form>
  );
}
