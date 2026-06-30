import { Badge } from "@/components/ui/Badge";
import type { EmpresaDocumentoLegal } from "@/lib/empresa-site/types";

type EmpresaLegalDocumentCardProps = {
  documento: EmpresaDocumentoLegal;
};

const toneByEstado = {
  aprobado: "green",
  observado: "orange",
  pendiente: "amber",
  presentado: "blue",
  rechazado: "red"
} as const;

export function EmpresaLegalDocumentCard({
  documento
}: EmpresaLegalDocumentCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">{documento.titulo}</h3>
          <p className="mt-1 text-xs text-muted">{documento.tipo_documento}</p>
        </div>
        <Badge tone={toneByEstado[documento.estado]}>{documento.estado}</Badge>
      </div>
      {documento.descripcion ? (
        <p className="mt-3 text-sm leading-6 text-muted">
          {documento.descripcion}
        </p>
      ) : null}
      {documento.observacion ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {documento.observacion}
        </p>
      ) : null}
      {documento.archivo_path ? (
        <a
          className="mt-4 inline-flex text-sm font-medium text-brand hover:underline"
          href={documento.archivo_path}
          rel="noreferrer"
          target="_blank"
        >
          Ver archivo
        </a>
      ) : null}
    </article>
  );
}
