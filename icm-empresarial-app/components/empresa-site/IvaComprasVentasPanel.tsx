import { ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { IvaDocumentUploader } from "@/components/empresa-site/IvaDocumentUploader";
import {
  ivaMesLabels,
  ivaMeses,
  ivaMovimientoLabels,
  type EmpresaDocumentoLegal,
  type IvaMes,
  type IvaMovimiento
} from "@/lib/empresa-site/types";

type IvaComprasVentasPanelProps = {
  canUpload?: boolean;
  documentos: EmpresaDocumentoLegal[];
  empresaId: string;
  periodoAnio?: number;
};

const movimientos: IvaMovimiento[] = ["compra", "venta"];

function findDocumento(
  documentos: EmpresaDocumentoLegal[],
  mes: IvaMes,
  movimiento: IvaMovimiento,
  periodoAnio: number
) {
  return documentos.find(
    (documento) =>
      documento.categoria === "iva_compra_venta" &&
      documento.mes === mes &&
      documento.periodo_anio === periodoAnio &&
      documento.tipo_movimiento === movimiento
  );
}

export function IvaComprasVentasPanel({
  canUpload = false,
  documentos,
  empresaId,
  periodoAnio = new Date().getFullYear()
}: IvaComprasVentasPanelProps) {
  const ivaDocs = documentos.filter(
    (documento) => documento.categoria === "iva_compra_venta"
  );
  const presentados = ivaDocs.filter((documento) => documento.archivo_path).length;
  const totalEsperado = ivaMeses.length * movimientos.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            IVA Compras y Ventas {periodoAnio}
          </p>
          <p className="mt-1 text-sm text-muted">
            PDFs mensuales exportados desde Regisoft para revisión legal y
            contable.
          </p>
        </div>
        <Badge tone={presentados === totalEsperado ? "green" : "amber"}>
          {presentados}/{totalEsperado} presentados
        </Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {ivaMeses.map((mes) => (
          <article
            className="rounded-2xl border border-border bg-white p-4 shadow-sm"
            key={mes}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-ink">
                  {ivaMesLabels[mes]}
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Libro IVA Compras / Ventas
                </p>
              </div>
              <FileText className="h-5 w-5 text-brand" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {movimientos.map((movimiento) => {
                const documento = findDocumento(
                  documentos,
                  mes,
                  movimiento,
                  periodoAnio
                );

                return (
                  <div
                    className="rounded-xl border border-border bg-surface/60 p-3"
                    key={movimiento}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {ivaMovimientoLabels[movimiento]}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {documento?.emitido_por ?? "Regisoft"}
                        </p>
                      </div>
                      {documento?.archivo_path ? (
                        <Badge tone="green">Presentado</Badge>
                      ) : (
                        <Badge tone="amber">Pendiente</Badge>
                      )}
                    </div>

                    {documento?.archivo_path ? (
                      <a
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                        href={documento.archivo_path}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Ver PDF
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="mt-3 text-sm text-muted">Pendiente</p>
                    )}

                    {canUpload ? (
                      <IvaDocumentUploader
                        empresaId={empresaId}
                        mes={mes}
                        movimiento={movimiento}
                        periodoAnio={periodoAnio}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
