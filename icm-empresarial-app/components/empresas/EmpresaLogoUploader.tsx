"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EmpresaLogoUploaderProps = {
  currentUrl?: string | null;
  empresaId: string;
};

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
const maxFileSize = 2 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
}

export function EmpresaLogoUploader({
  currentUrl,
  empresaId
}: EmpresaLogoUploaderProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);

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

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);
    const supabase = createClient();
    const path = `${empresaId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setMessage(`No se pudo subir el logo: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("empresas")
      .update({ logo_url: data.publicUrl })
      .eq("id", empresaId);

    if (updateError) {
      setMessage(
        `El logo subió, pero no se pudo guardar en la empresa: ${updateError.message}`
      );
      setIsUploading(false);
      return;
    }

    setPreviewUrl(data.publicUrl);
    setMessage("Logo actualizado.");
    setIsUploading(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <Image
          alt="Preview del logo"
          className="h-20 w-20 rounded-2xl border border-border object-cover shadow-sm"
          height={160}
          src={previewUrl}
          unoptimized
          width={160}
        />
      ) : null}
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
      </label>
      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </div>
  );
}
