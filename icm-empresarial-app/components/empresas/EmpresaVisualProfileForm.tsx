"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import {
  updateEmpresaProfileAction,
  type UpdateEmpresaProfileState
} from "@/lib/empresas/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Empresa, EmpresaIntegrante } from "@/lib/empresas/types";

type EmpresaVisualProfileFormProps = {
  empresa: Empresa;
};

const initialState: UpdateEmpresaProfileState = {
  error: null,
  success: null
};

function emptyIntegrante(): EmpresaIntegrante {
  return {
    email: "",
    nombre: "",
    rol: ""
  };
}

function figuraLabel(value: Empresa["figura_legal"]) {
  if (value === "monotributo") return "Monotributo";
  if (value === "sas") return "SAS";
  if (value === "organismo_publico") return "Organismo público";
  if (value === "banco") return "Banco";
  return "Dato pendiente";
}

function readonlyValue(value: string | null) {
  return value && value.trim() ? value : "Este dato queda bajo revisión docente.";
}

function Field({
  children,
  label
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";
const textareaClass =
  "mt-2 min-h-32 w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

export function EmpresaVisualProfileForm({
  empresa
}: EmpresaVisualProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateEmpresaProfileAction,
    initialState
  );
  const [integrantes, setIntegrantes] = useState<EmpresaIntegrante[]>(
    empresa.integrantes.length > 0 ? empresa.integrantes : [emptyIntegrante()]
  );

  function updateIntegrante(
    index: number,
    field: keyof EmpresaIntegrante,
    value: string
  ) {
    setIntegrantes((current) =>
      current.map((integrante, itemIndex) =>
        itemIndex === index ? { ...integrante, [field]: value } : integrante
      )
    );
  }

  function removeIntegrante(index: number) {
    setIntegrantes((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [emptyIntegrante()];
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      <input name="empresa_id" type="hidden" value={empresa.id} />
      <input
        name="integrantes"
        type="hidden"
        value={JSON.stringify(integrantes)}
      />

      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {state.success}
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface/60 p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink">Identidad visual</h2>
          <p className="mt-1 text-sm text-muted">
            Estos datos definen cómo se ve la empresa en el directorio y ficha
            pública interna.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre comercial">
            <input
              className={inputClass}
              defaultValue={empresa.nombre_comercial ?? ""}
              name="nombre_comercial"
            />
          </Field>
          <Field label="Color de marca">
            <input
              className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-2 py-1"
              defaultValue={empresa.color_marca ?? "#1f4f8f"}
              name="color_marca"
              type="color"
            />
          </Field>
          <Field label="Slogan">
            <input
              className={inputClass}
              defaultValue={empresa.slogan ?? ""}
              name="slogan"
            />
          </Field>
          <Field label="Rubro">
            <input
              className={inputClass}
              defaultValue={empresa.rubro ?? ""}
              name="rubro"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink">
            Presentación comercial
          </h2>
          <p className="mt-1 text-sm text-muted">
            Explicá qué hace la empresa y cómo participa en la simulación.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Actividad principal">
            <input
              className={inputClass}
              defaultValue={empresa.actividad_principal ?? ""}
              name="actividad_principal"
            />
          </Field>
          <Field label="Responsable visible">
            <input
              className={inputClass}
              defaultValue={empresa.responsable ?? ""}
              name="responsable"
            />
          </Field>
          <label className="block text-sm font-medium text-ink md:col-span-2">
            Descripción
            <textarea
              className={textareaClass}
              defaultValue={empresa.descripcion ?? ""}
              name="descripcion"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink">Contacto</h2>
          <p className="mt-1 text-sm text-muted">
            Canales internos de referencia para otras empresas y organismos.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Email de contacto">
            <input
              className={inputClass}
              defaultValue={empresa.contacto_email ?? ""}
              name="contacto_email"
              type="email"
            />
          </Field>
          <Field label="Teléfono">
            <input
              className={inputClass}
              defaultValue={empresa.contacto_telefono ?? ""}
              name="contacto_telefono"
            />
          </Field>
          <Field label="Sitio web o referencia interna">
            <input
              className={inputClass}
              defaultValue={empresa.sitio_web ?? ""}
              name="sitio_web"
            />
          </Field>
          <Field label="Instagram">
            <input
              className={inputClass}
              defaultValue={empresa.instagram ?? ""}
              name="instagram"
            />
          </Field>
          <label className="block text-sm font-medium text-ink md:col-span-2">
            Domicilio
            <input
              className={inputClass}
              defaultValue={empresa.domicilio ?? ""}
              name="domicilio"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Equipo e integrantes
            </h2>
            <p className="mt-1 text-sm text-muted">
              Cargá quienes participan en la empresa y su rol.
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setIntegrantes((current) => [...current, emptyIntegrante()]);
            }}
            type="button"
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
            Agregar integrante
          </Button>
        </div>

        <div className="space-y-3">
          {integrantes.map((integrante, index) => (
            <div
              className="grid gap-3 rounded-xl border border-border bg-surface/60 p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
              key={index}
            >
              <input
                className={inputClass}
                onChange={(event) => {
                  updateIntegrante(index, "nombre", event.target.value);
                }}
                placeholder="Nombre"
                value={integrante.nombre}
              />
              <input
                className={inputClass}
                onChange={(event) => {
                  updateIntegrante(index, "rol", event.target.value);
                }}
                placeholder="Rol o cargo"
                value={integrante.rol ?? ""}
              />
              <input
                className={inputClass}
                onChange={(event) => {
                  updateIntegrante(index, "email", event.target.value);
                }}
                placeholder="Email opcional"
                type="email"
                value={integrante.email ?? ""}
              />
              <button
                aria-label="Quitar integrante"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-3 text-muted transition hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  removeIntegrante(index);
                }}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-slate-50 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-ink">
            Datos legales y escolares
          </h2>
          <Badge tone="amber">Solo lectura</Badge>
        </div>
        <p className="mb-4 text-sm text-muted">
          Estos datos quedan bajo revisión docente.
        </p>
        <dl className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="font-medium text-ink">Razón social</dt>
            <dd className="mt-1 text-muted">
              {readonlyValue(empresa.razon_social)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Figura legal</dt>
            <dd className="mt-1 text-muted">{figuraLabel(empresa.figura_legal)}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">CUIT simulado</dt>
            <dd className="mt-1 text-muted">
              {readonlyValue(empresa.cuit_simulado)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Curso y división</dt>
            <dd className="mt-1 text-muted">
              {empresa.curso_anio && empresa.curso_division
                ? `${empresa.curso_anio}° ${empresa.curso_division}`
                : "Este dato queda bajo revisión docente."}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Socio responsable</dt>
            <dd className="mt-1 text-muted">
              {readonlyValue(empresa.socio_responsable)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Persona jurídica</dt>
            <dd className="mt-1 text-muted">
              {readonlyValue(empresa.persona_juridica)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Los cambios se reflejan en directorio y ficha pública.
        </p>
        <Button className="gap-2" disabled={isPending} type="submit">
          <Save className="h-4 w-4" />
          {isPending ? "Guardando..." : "Guardar perfil"}
        </Button>
      </div>
    </form>
  );
}
