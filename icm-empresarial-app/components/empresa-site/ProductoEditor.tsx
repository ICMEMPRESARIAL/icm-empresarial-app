"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createProductoAction } from "@/lib/empresa-site/actions";
import { Button } from "@/components/ui/Button";
import type { Empresa } from "@/lib/empresas/types";

type ProductoEditorProps = {
  empresa: Empresa;
};

const initialState = {
  error: null,
  success: null
};

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

export function ProductoEditor({ empresa }: ProductoEditorProps) {
  const [state, formAction, isPending] = useActionState(
    createProductoAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
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
          Nombre
          <input className={inputClass} name="nombre" required />
        </label>
        <label className="block text-sm font-medium text-ink">
          Tipo
          <select className={inputClass} name="tipo" required>
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-ink">
          Categoría
          <input className={inputClass} name="categoria" />
        </label>
        <label className="block text-sm font-medium text-ink">
          Precio simulado
          <input className={inputClass} min="0" name="precio_simulado" step="0.01" type="number" />
        </label>
        <label className="block text-sm font-medium text-ink">
          Modalidad
          <select className={inputClass} name="modalidad">
            <option value="unica">Única</option>
            <option value="mensual">Mensual</option>
            <option value="bimestral">Bimestral</option>
            <option value="trimestral">Trimestral</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-ink">
          Imagen URL
          <input className={inputClass} name="imagen_url" />
        </label>
      </div>
      <label className="block text-sm font-medium text-ink">
        Descripción
        <textarea
          className="mt-2 min-h-28 w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          name="descripcion"
        />
      </label>
      <div className="flex justify-end">
        <Button className="gap-2" disabled={isPending} type="submit">
          <Plus className="h-4 w-4" />
          {isPending ? "Creando..." : "Agregar producto/servicio"}
        </Button>
      </div>
    </form>
  );
}
