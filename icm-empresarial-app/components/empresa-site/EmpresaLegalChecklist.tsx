import { Badge } from "@/components/ui/Badge";
import {
  documentoLegalLabels,
  documentoLegalTipos,
  type EmpresaDocumentoLegal
} from "@/lib/empresa-site/types";

type EmpresaLegalChecklistProps = {
  documentos: EmpresaDocumentoLegal[];
};

const toneByEstado = {
  aprobado: "green",
  observado: "orange",
  pendiente: "amber",
  presentado: "blue",
  rechazado: "red"
} as const;

export function EmpresaLegalChecklist({
  documentos
}: EmpresaLegalChecklistProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {documentoLegalTipos.map((tipo) => {
        const documento = documentos.find((item) => item.tipo_documento === tipo);
        const estado = documento?.estado ?? "pendiente";

        return (
          <div
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4"
            key={tipo}
          >
            <div>
              <p className="text-sm font-semibold text-ink">
                {documentoLegalLabels[tipo]}
              </p>
              <p className="mt-1 text-xs text-muted">
                {documento?.titulo ?? "Aún no presentado"}
              </p>
            </div>
            <Badge tone={toneByEstado[estado]}>{estado}</Badge>
          </div>
        );
      })}
    </div>
  );
}
