"use client";

import { Upload } from "lucide-react";
import { useActionState, useState } from "react";
import { payFacturaAction } from "@/lib/facturas/actions";
import { mediosPago } from "@/lib/facturas/types";
import { createClient } from "@/lib/supabase/client";
import { validateUploadFile } from "@/lib/uploads/validation";
import { Button } from "@/components/ui/Button";
import type { FacturaDetail } from "@/lib/facturas/types";

const initialState = { error: null };
const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
}

export function PagoFacturaForm({ factura }: { factura: FacturaDetail }) {
  const [state, formAction, isPending] = useActionState(
    payFacturaAction,
    initialState
  );
  const [comprobantePath, setComprobantePath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    setUploading(true);
    const validationError = validateUploadFile(file);
    if (validationError) {
      setUploadError(validationError);
      setUploading(false);
      return;
    }

    const supabase = createClient();
    const path = `${factura.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage
      .from("payment-receipts")
      .upload(path, file, { upsert: true });

    if (error) {
      setUploadError(`No se pudo subir comprobante: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("payment-receipts").getPublicUrl(path);
    setComprobantePath(data.publicUrl);
    setUploading(false);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input name="factura_id" type="hidden" value={factura.id} />
      <input name="comprobante_path" type="hidden" value={comprobantePath} />
      {state.error || uploadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error ?? uploadError}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          Importe
          <input
            className={inputClass}
            defaultValue={factura.total}
            min="0"
            name="importe"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Fecha de pago
          <input
            className={inputClass}
            defaultValue={new Date().toISOString().slice(0, 10)}
            name="fecha_pago"
            required
            type="date"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Medio de pago
          <select className={inputClass} name="medio_pago" required>
            {mediosPago.map((medio) => (
              <option key={medio} value={medio}>
                {medio.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-ink">
          Número de operación
          <input className={inputClass} name="numero_operacion" />
        </label>
      </div>
      <label className="block text-sm font-medium text-ink">
        Comprobante
        <input
          className="mt-2 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink"
          onChange={handleUpload}
          type="file"
        />
        {comprobantePath ? (
          <span className="mt-1 block text-xs text-muted">Comprobante listo.</span>
        ) : null}
        <span className="mt-1 block text-xs text-muted">
          PDF/Word hasta 25 MB, imágenes hasta 10 MB y video hasta 100 MB.
        </span>
      </label>
      <label className="block text-sm font-medium text-ink">
        Observaciones
        <textarea
          className="mt-2 min-h-24 w-full rounded-lg border border-border bg-white px-3 py-3 text-sm text-ink"
          name="observaciones"
        />
      </label>
      <Button className="gap-2" disabled={isPending || uploading} type="submit">
        <Upload className="h-4 w-4" />
        {uploading ? "Subiendo..." : isPending ? "Enviando..." : "Enviar pago"}
      </Button>
    </form>
  );
}
