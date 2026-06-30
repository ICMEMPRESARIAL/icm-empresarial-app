"use client";

import { useState } from "react";
import { ImageUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EmpresaBannerUploaderProps = {
  empresaId: string;
};

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
const maxFileSize = 2 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
}

export function EmpresaBannerUploader({
  empresaId
}: EmpresaBannerUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !allowedTypes.includes(file.type) || file.size > maxFileSize) {
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const path = `${empresaId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("company-banners")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data } = supabase.storage
        .from("company-banners")
        .getPublicUrl(path);
      await supabase.rpc("update_empresa_visual_profile", {
        new_banner_url: data.publicUrl,
        target_empresa_id: empresaId
      });
    }

    setIsUploading(false);
  }

  return (
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
  );
}
