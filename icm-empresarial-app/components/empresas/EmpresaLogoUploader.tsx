"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveEmpresaLogoUrlAction } from "@/lib/empresas/media-actions";
import { validateUploadFile } from "@/lib/uploads/validation";

type EmpresaLogoUploaderProps = {
  currentUrl?: string | null;
  empresaId: string;
};

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

    const validationError = validateUploadFile(file);
    if (validationError) {
      setMessage(validationError);
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
    try {
      await saveEmpresaLogoUrlAction(empresaId, data.publicUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el logo.");
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
      <p className="text-xs text-muted">Imágenes hasta 10 MB.</p>
      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </div>
  );
}
