"use client";

import { useActionState, useState } from "react";
import { FileUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createLegalDocumentAction } from "@/lib/empresa-site/actions";
import { validateUploadFile } from "@/lib/uploads/validation";
import {
  documentoLegalLabels,
  documentoLegalTipos
} from "@/lib/empresa-site/types";
import { Button } from "@/components/ui/Button";
import type { Empresa } from "@/lib/empresas/types";

type LegalDocumentUploaderProps = {
  empresa: Empresa;
};

const initialState = {
  error: null,
  success: null
};

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
}

export function LegalDocumentUploader({ empresa }: LegalDocumentUploaderProps) {
  const [state, formAction, isPending] = useActionState(
    createLegalDocumentAction,
    initialState
  );
  const [fileMeta, setFileMeta] = useState<{
    name: string;
    path: string;
    type: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setUploadError(null);

    if (!file) return;

    const validationError = validateUploadFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = `${empresa.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage
      .from("company-legal-documents")
      .upload(path, file, { upsert: true });

    if (error) {
      setUploadError(`No se pudo subir archivo: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("company-legal-documents")
      .getPublicUrl(path);
    setFileMeta({
      name: file.name,
      path: data.publicUrl,
      type: file.type
    });
    setUploading(false);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input name="empresa_id" type="hidden" value={empresa.id} />
      <input name="archivo_path" type="hidden" value={fileMeta?.path ?? ""} />
      <input name="archivo_nombre" type="hidden" value={fileMeta?.name ?? ""} />
      <input name="archivo_tipo" type="hidden" value={fileMeta?.type ?? ""} />
      {state.error || uploadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error ?? uploadError}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          Tipo de documento
          <select className={inputClass} name="tipo_documento" required>
            {documentoLegalTipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {documentoLegalLabels[tipo]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-ink">
          Título
          <input className={inputClass} name="titulo" required />
        </label>
        <label className="block text-sm font-medium text-ink">
          Categoría
          <input className={inputClass} name="categoria" placeholder="constancias, laboral, libros..." />
        </label>
        <label className="block text-sm font-medium text-ink">
          Archivo
          <input
            className="mt-2 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
            onChange={handleFileChange}
            type="file"
          />
          {fileMeta ? (
            <span className="mt-1 block text-xs text-muted">
              Archivo listo: {fileMeta.name}
            </span>
          ) : null}
          <span className="mt-1 block text-xs text-muted">
            PDF/Word hasta 25 MB, imágenes hasta 10 MB y video hasta 100 MB.
          </span>
        </label>
      </div>
      <label className="block text-sm font-medium text-ink">
        Descripción
        <textarea
          className="mt-2 min-h-24 w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          name="descripcion"
        />
      </label>
      <div className="flex justify-end">
        <Button className="gap-2" disabled={isPending || uploading} type="submit">
          <FileUp className="h-4 w-4" />
          {uploading ? "Subiendo..." : isPending ? "Guardando..." : "Cargar documento"}
        </Button>
      </div>
    </form>
  );
}
