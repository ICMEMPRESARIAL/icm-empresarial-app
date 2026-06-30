"use client";

import { AlertCircle, Send } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import {
  createCorrespondenciaAction,
  type CreateCorrespondenciaFormState
} from "@/lib/buzon/actions";
import { correspondenciaTipos } from "@/lib/buzon/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Empresa } from "@/lib/empresas/types";

type NewMessageFormProps = {
  destinatarios: Empresa[];
};

const labelByTipo = {
  consulta: "Consulta",
  factura_simulada: "Factura simulada",
  notificacion: "Notificación",
  oficio: "Oficio",
  pedido: "Pedido",
  reclamo: "Reclamo"
} as const;

const initialState: CreateCorrespondenciaFormState = {
  error: null,
  fieldErrors: {}
};

export function NewMessageForm({ destinatarios }: NewMessageFormProps) {
  const [state, formAction, isPending] = useActionState(
    createCorrespondenciaAction,
    initialState
  );
  const [selectedDestinatarioId, setSelectedDestinatarioId] = useState("");
  const selectedDestinatario = useMemo(
    () =>
      destinatarios.find(
        (destinatario) => destinatario.id === selectedDestinatarioId
      ) ?? null,
    [destinatarios, selectedDestinatarioId]
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border bg-surface px-5 py-4">
        <h2 className="text-lg font-semibold text-ink">
          Correspondencia formal
        </h2>
        <p className="mt-1 text-sm text-muted">
          Elegí un destinatario activo y redactá el mensaje dentro de la
          plataforma.
        </p>
      </div>

      <form action={formAction} className="space-y-5 p-5">
        {state.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{state.error}</p>
            </div>
          </div>
        ) : null}

        <label className="block text-sm font-medium text-ink">
          Destinatario
          <select
            className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            name="destinatario_empresa_id"
            onChange={(event) => {
              setSelectedDestinatarioId(event.target.value);
            }}
            required
            value={selectedDestinatarioId}
          >
            <option value="">Seleccionar destinatario</option>
            {destinatarios.map((destinatario) => (
              <option key={destinatario.id} value={destinatario.id}>
                {destinatario.nombre_comercial ?? destinatario.nombre} ·{" "}
                {destinatario.tipo}
              </option>
            ))}
          </select>
          {state.fieldErrors.destinatario_empresa_id ? (
            <span className="mt-1 block text-xs text-red-700">
              {state.fieldErrors.destinatario_empresa_id}
            </span>
          ) : null}
        </label>

        {selectedDestinatario ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Enviarás este mensaje a{" "}
            <strong>
              {selectedDestinatario.nombre_comercial ??
                selectedDestinatario.nombre}
            </strong>
            {selectedDestinatario.rubro ? ` (${selectedDestinatario.rubro})` : ""}.
          </div>
        ) : null}

        <label className="block text-sm font-medium text-ink">
          Tipo
          <select
            className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            name="tipo"
            required
          >
            <option value="">Seleccionar tipo</option>
            {correspondenciaTipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {labelByTipo[tipo]}
              </option>
            ))}
          </select>
          {state.fieldErrors.tipo ? (
            <span className="mt-1 block text-xs text-red-700">
              {state.fieldErrors.tipo}
            </span>
          ) : null}
        </label>

        <label className="block text-sm font-medium text-ink">
          Asunto
          <input
            className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            minLength={3}
            name="asunto"
            required
            type="text"
          />
          {state.fieldErrors.asunto ? (
            <span className="mt-1 block text-xs text-red-700">
              {state.fieldErrors.asunto}
            </span>
          ) : null}
        </label>

        <label className="block text-sm font-medium text-ink">
          Contenido
          <textarea
            className="mt-2 min-h-44 w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            minLength={5}
            name="contenido"
            required
          />
          {state.fieldErrors.contenido ? (
            <span className="mt-1 block text-xs text-red-700">
              {state.fieldErrors.contenido}
            </span>
          ) : null}
        </label>

        <div className="flex justify-end">
          <Button className="gap-2" disabled={isPending} type="submit">
            <Send className="h-4 w-4" />
            {isPending ? "Enviando..." : "Enviar mensaje"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
