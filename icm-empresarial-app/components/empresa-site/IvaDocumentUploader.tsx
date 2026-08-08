"use client";

import { useActionState, useState } from "react";
import { FileUp } from "lucide-react";
import { upsertIvaDocumentAction } from "@/lib/empresa-site/actions";
import { ivaMesLabels, type IvaMes, type IvaMovimiento } from "@/lib/empresa-site/types";
import { createClient } from "@/lib/supabase/client";
import { formatFileSize, uploadLimits } from "@/lib/uploads/validation";

type IvaDocumentUploaderProps = {
  empresaId: string;
  mes: IvaMes;
  movimiento: IvaMovimiento;
  periodoAnio: number;
};

const initialState = {
  error: null,
  success: null
};

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
}

export function IvaDocumentUploader({
  empresaId,
  mes,
  movimiento,
  periodoAnio
}: IvaDocumentUploaderProps) {
  const [state, formAction, isPending] = useActionState(
    upsertIvaDocumentAction,
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

    if (file.type !== "application/pdf") {
      setUploadError("Subí un archivo PDF exportado desde Regisoft.");
      return;
    }

    if (file.size > uploadLimits.document) {
      setUploadError(
        `El PDF supera el límite de ${formatFileSize(uploadLimits.document)}.`
      );
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = [
      empresaId,
      "iva",
      String(periodoAnio),
      `${mes}-${movimiento}-${Date.now()}-${sanitizeFileName(file.name)}`
    ].join("/");
    const { error } = await supabase.storage
      .from("company-legal-documents")
      .upload(path, file, { upsert: true });

    if (error) {
      setUploadError(`No se pudo subir PDF: ${error.message}`);
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
    <form action={formAction} className="mt-3 space-y-2">
      <input name="empresa_id" type="hidden" value={empresaId} />
      <input name="mes" type="hidden" value={mes} />
      <input name="periodo_anio" type="hidden" value={periodoAnio} />
      <input name="tipo_movimiento" type="hidden" value={movimiento} />
      <input name="archivo_path" type="hidden" value={fileMeta?.path ?? ""} />
      <input name="archivo_nombre" type="hidden" value={fileMeta?.name ?? ""} />
      <input name="archivo_tipo" type="hidden" value={fileMeta?.type ?? ""} />

      {state.error || uploadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error ?? uploadError}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-3 text-xs font-medium text-ink transition hover:bg-surface">
        <FileUp className="h-3.5 w-3.5" />
        {uploading ? "Subiendo..." : "Subir PDF"}
        <input
          accept="application/pdf"
          className="sr-only"
          disabled={uploading || isPending}
          onChange={handleFileChange}
          type="file"
        />
      </label>

      {fileMeta ? (
        <div className="flex flex-col gap-2">
          <p className="truncate text-xs text-muted">
            Listo para guardar: {fileMeta.name}
          </p>
          <button
            className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-3 text-xs font-medium text-white transition hover:bg-[#183f73] disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Guardando..." : `Guardar ${ivaMesLabels[mes]}`}
          </button>
        </div>
      ) : null}
    </form>
  );
}
