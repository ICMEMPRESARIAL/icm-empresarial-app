"use client";

import { AlertCircle, CheckCircle2, FileUp, Landmark } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  createTramiteAction,
  type CreateTramiteFormState
} from "@/lib/tramites/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TipoTramite } from "@/lib/tramites/types";

type NuevoTramiteFormProps = {
  initialOrganismoSlug: string | null;
  initialTipoSlug: string | null;
  tipos: TipoTramite[];
};

const initialState: CreateTramiteFormState = {
  error: null,
  fieldErrors: {}
};

export function NuevoTramiteForm({
  initialOrganismoSlug,
  initialTipoSlug,
  tipos
}: NuevoTramiteFormProps) {
  const organismos = useMemo(() => {
    const map = new Map<
      string,
      {
        nombre: string;
        slug: string;
      }
    >();

    tipos.forEach((tipo) => {
      map.set(tipo.organismo_slug, {
        nombre: tipo.organismo?.nombre ?? tipo.organismo_slug,
        slug: tipo.organismo_slug
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }, [tipos]);
  const [organismoSlug, setOrganismoSlug] = useState(initialOrganismoSlug ?? "");
  const [selectedTipoId, setSelectedTipoId] = useState(() => {
    const selectedBySlug = tipos.find((tipo) => tipo.slug === initialTipoSlug);
    return selectedBySlug?.id ?? "";
  });
  const [state, formAction, isPending] = useActionState(
    createTramiteAction,
    initialState
  );
  const tiposFiltrados = useMemo(
    () =>
      organismoSlug
        ? tipos.filter((tipo) => tipo.organismo_slug === organismoSlug)
        : [],
    [organismoSlug, tipos]
  );
  const selectedTipo =
    tipos.find((tipo) => tipo.id === selectedTipoId) ?? null;
  const selectedOrganismo =
    organismos.find((organismo) => organismo.slug === organismoSlug) ?? null;

  useEffect(() => {
    if (
      selectedTipoId &&
      !tiposFiltrados.some((tipo) => tipo.id === selectedTipoId)
    ) {
      setSelectedTipoId("");
    }
  }, [selectedTipoId, tiposFiltrados]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border bg-surface px-5 py-4">
        <h2 className="text-lg font-semibold text-ink">Datos del trámite</h2>
        <p className="mt-1 text-sm text-muted">
          Elegí el organismo y el tipo de trámite. El expediente se enviará a la
          bandeja interna del organismo correspondiente.
        </p>
      </div>

      <form action={formAction} className="space-y-5 p-5">
        {state.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{state.error}</p>
            </div>
          </div>
        ) : null}

        {selectedOrganismo ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                  Organismo seleccionado
                </p>
                <p className="text-sm font-semibold text-ink">
                  {selectedOrganismo.nombre}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <label className="block text-sm font-medium text-ink">
          Organismo
          <select
            className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            onChange={(event) => {
              setOrganismoSlug(event.target.value);
            }}
            value={organismoSlug}
          >
            <option value="">Seleccionar organismo</option>
            {organismos.map((organismo) => (
              <option key={organismo.slug} value={organismo.slug}>
                {organismo.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-ink">
          Trámite
          <select
            className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            disabled={!organismoSlug}
            name="tipo_tramite_id"
            onChange={(event) => {
              setSelectedTipoId(event.target.value);
            }}
            required
            value={selectedTipoId}
          >
            <option value="">
              {organismoSlug
                ? "Seleccionar trámite"
                : "Primero seleccioná un organismo"}
            </option>
            {tiposFiltrados.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
          {state.fieldErrors.tipo_tramite_id ? (
            <span className="mt-1 block text-xs text-red-700">
              {state.fieldErrors.tipo_tramite_id}
            </span>
          ) : null}
        </label>

        {selectedTipo ? (
          <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 text-sm text-muted md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Descripción
              </p>
              <p className="mt-1 text-ink">
                {selectedTipo.descripcion ?? "Sin descripción cargada."}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Categoría
              </p>
              <p className="mt-1 text-ink">
                {selectedTipo.categoria ?? "General"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Documentación
              </p>
              <div className="mt-1 flex items-start gap-2 text-ink">
                <FileUp className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <p>
                  {selectedTipo.documentacion_esperada ??
                    (selectedTipo.requiere_adjunto
                      ? "Requiere documentación adjunta."
                      : "No requiere adjuntos iniciales.")}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Estado inicial
              </p>
              <div className="mt-1 flex items-center gap-2 text-ink">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Solicitud enviada</span>
              </div>
            </div>
          </div>
        ) : null}

        <label className="block text-sm font-medium text-ink">
          Asunto
          <input
            className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
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
          Descripción del trámite
          <textarea
            className="mt-2 min-h-36 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            minLength={8}
            name="descripcion"
            required
          />
          {state.fieldErrors.descripcion ? (
            <span className="mt-1 block text-xs text-red-700">
              {state.fieldErrors.descripcion}
            </span>
          ) : null}
        </label>

        <div className="flex justify-end">
          <Button disabled={isPending} type="submit">
            {isPending ? "Iniciando..." : "Iniciar trámite"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
