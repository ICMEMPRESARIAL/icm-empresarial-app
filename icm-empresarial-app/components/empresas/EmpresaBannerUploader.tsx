"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EmpresaBannerUploaderProps = {
  currentUrl?: string | null;
  empresaId: string;
};

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
const maxFileSize = 2 * 1024 * 1024;

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
    const { error: updateError } = await supabase
      .from("empresas")
      .update({ banner_url: data.publicUrl })
      .eq("id", empresaId);

    if (updateError) {
      setMessage(
        `El banner subió, pero no se pudo guardar en la empresa: ${updateError.message}`
      );
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
      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </div>
  );
}
