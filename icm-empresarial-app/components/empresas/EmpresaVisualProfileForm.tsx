"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { Empresa } from "@/lib/empresas/types";

type EmpresaVisualProfileFormProps = {
  empresa: Empresa;
};

export function EmpresaVisualProfileForm({
  empresa
}: EmpresaVisualProfileFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.rpc("update_empresa_visual_profile", {
      new_actividad_principal: String(
        formData.get("actividad_principal") ?? ""
      ).trim(),
      new_color_marca: String(formData.get("color_marca") ?? "").trim(),
      new_contacto_email: String(formData.get("contacto_email") ?? "").trim(),
      new_contacto_telefono: String(
        formData.get("contacto_telefono") ?? ""
      ).trim(),
      new_descripcion: String(formData.get("descripcion") ?? "").trim(),
      new_domicilio: String(formData.get("domicilio") ?? "").trim(),
      new_nombre_comercial: String(
        formData.get("nombre_comercial") ?? ""
      ).trim(),
      new_rubro: String(formData.get("rubro") ?? "").trim(),
      new_slogan: String(formData.get("slogan") ?? "").trim(),
      target_empresa_id: empresa.id
    });

    setMessage(error ? "No se pudieron guardar los cambios." : "Cambios guardados.");
    setIsSaving(false);
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-ink">
        Nombre comercial
        <input
          className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          defaultValue={empresa.nombre_comercial ?? ""}
          name="nombre_comercial"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Color de marca
        <input
          className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          defaultValue={empresa.color_marca ?? "#1f4f8f"}
          name="color_marca"
          type="color"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Slogan
        <input
          className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          defaultValue={empresa.slogan ?? ""}
          name="slogan"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Rubro
        <input
          className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          defaultValue={empresa.rubro ?? ""}
          name="rubro"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Domicilio
        <input
          className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          defaultValue={empresa.domicilio ?? ""}
          name="domicilio"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Actividad principal
        <input
          className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          defaultValue={empresa.actividad_principal ?? ""}
          name="actividad_principal"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Email de contacto
        <input
          className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          defaultValue={empresa.contacto_email ?? ""}
          name="contacto_email"
          type="email"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Teléfono de contacto
        <input
          className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          defaultValue={empresa.contacto_telefono ?? ""}
          name="contacto_telefono"
        />
      </label>
      <label className="block text-sm font-medium text-ink md:col-span-2">
        Descripción
        <textarea
          className="mt-2 min-h-28 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          defaultValue={empresa.descripcion ?? ""}
          name="descripcion"
        />
      </label>
      <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        {message ? <p className="text-sm text-muted">{message}</p> : <span />}
        <Button className="gap-2" disabled={isSaving} type="submit">
          <Save className="h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar perfil"}
        </Button>
      </div>
    </form>
  );
}
