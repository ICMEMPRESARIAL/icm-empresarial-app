"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveEmpresaBannerUrlAction } from "@/lib/empresas/media-actions";
import { validateUploadFile } from "@/lib/uploads/validation";

type EmpresaBannerUploaderProps = {
  currentUrl?: string | null;
  empresaId: string;
};

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
}

export function EmpresaBannerUploader({
  currentUrl,
  empresaId
}: EmpresaBannerUploaderProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
      .from("company-banners")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setMessage(`No se pudo subir el banner: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("company-banners")
      .getPublicUrl(path);
    try {
      await saveEmpresaBannerUrlAction(empresaId, data.publicUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el banner.");
      setIsUploading(false);
      return;
    }

    setPreviewUrl(data.publicUrl);
    setMessage("Banner actualizado.");
    setIsUploading(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <Image
          alt="Preview del banner"
          className="h-24 w-full rounded-2xl border border-border object-cover shadow-sm"
          height={240}
          src={previewUrl}
          unoptimized
          width={640}
        />
      ) : null}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface">
        <ImageUp className="h-4 w-4" />
        {isUploading ? "Subiendo..." : "Cambiar banner"}
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
