"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { upsertEmpresaWebAction } from "@/lib/empresa-site/actions";
import { Button } from "@/components/ui/Button";
import type { Empresa } from "@/lib/empresas/types";
import type { EmpresaWeb } from "@/lib/empresa-site/types";

type EmpresaWebEditorProps = {
  empresa: Empresa;
  web: EmpresaWeb | null;
};

const initialState = {
  error: null,
  success: null
};

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const textareaClass =
  "mt-2 min-h-32 w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

export function EmpresaWebEditor({ empresa, web }: EmpresaWebEditorProps) {
  const [state, formAction, isPending] = useActionState(
    upsertEmpresaWebAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <input name="empresa_id" type="hidden" value={empresa.id} />
      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          Slogan del sitio
          <input
            className={inputClass}
            defaultValue={web?.slogan ?? empresa.slogan ?? ""}
            name="slogan"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Banner URL
          <input
            className={inputClass}
            defaultValue={web?.banner_url ?? empresa.banner_url ?? ""}
            name="banner_url"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Email de contacto
          <input
            className={inputClass}
            defaultValue={web?.contacto_email ?? empresa.contacto_email ?? ""}
            name="contacto_email"
            type="email"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Teléfono de contacto
          <input
            className={inputClass}
            defaultValue={
              web?.contacto_telefono ?? empresa.contacto_telefono ?? ""
            }
            name="contacto_telefono"
          />
        </label>
      </div>
      <label className="block text-sm font-medium text-ink">
        Descripción de inicio
        <textarea
          className={textareaClass}
          defaultValue={web?.descripcion_inicio ?? empresa.descripcion ?? ""}
          name="descripcion_inicio"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Condiciones de contratación
        <textarea
          className={textareaClass}
          defaultValue={web?.condiciones_contratacion ?? ""}
          name="condiciones_contratacion"
        />
      </label>
      <div className="flex justify-end">
        <Button className="gap-2" disabled={isPending} type="submit">
          <Save className="h-4 w-4" />
          {isPending ? "Guardando..." : "Guardar sitio"}
        </Button>
      </div>
    </form>
  );
}
