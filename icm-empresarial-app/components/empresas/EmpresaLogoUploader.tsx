"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EmpresaLogoUploaderProps = {
  empresaId: string;
};

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
const maxFileSize = 2 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
}

export function EmpresaLogoUploader({ empresaId }: EmpresaLogoUploaderProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setMessage(null);

    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setMessage("Usá PNG, JPG o WebP.");
      return;
    }

    if (file.size > maxFileSize) {
      setMessage("El archivo debe pesar hasta 2 MB.");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const path = `${empresaId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setMessage("No se pudo subir el logo.");
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
    const { error: updateError } = await supabase.rpc(
      "update_empresa_visual_profile",
      {
        new_logo_url: data.publicUrl,
        target_empresa_id: empresaId
      }
    );

    if (updateError) {
      setMessage("El logo subió, pero no se pudo guardar en la empresa.");
      setIsUploading(false);
      return;
    }

    setMessage("Logo actualizado.");
    setIsUploading(false);
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface">
      <Upload className="h-4 w-4" />
      {isUploading ? "Subiendo..." : "Cambiar logo"}
      <input
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={isUploading}
        onChange={handleChange}
        type="file"
      />
      {message ? <span className="sr-only">{message}</span> : null}
    </label>
  );
}
