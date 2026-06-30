import Link from "next/link";
import { EstadoFacturaBadge } from "@/components/facturas/EstadoFacturaBadge";
import { Badge } from "@/components/ui/Badge";
import type { Factura } from "@/lib/facturas/types";

function empresaName(empresa: Factura["emisor"]) {
  return empresa?.nombre_comercial ?? empresa?.nombre ?? "Sin empresa";
}

export function FacturaList({ facturas }: { facturas: Factura[] }) {
  if (facturas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <h2 className="text-base font-semibold text-ink">Sin facturas</h2>
        <p className="mt-2 text-sm text-muted">
          Las operaciones emitidas y recibidas aparecerán acá.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      {facturas.map((factura) => (
        <Link
          className="grid gap-3 border-b border-border px-4 py-4 transition last:border-b-0 hover:bg-surface md:grid-cols-[1fr_140px_130px]"
          href={`/facturas/${factura.id}`}
          key={factura.id}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <EstadoFacturaBadge estado={factura.estado} />
              {factura.registrado_en_regisoft ? (
                <Badge tone="green">Regisoft</Badge>
              ) : (
                <Badge tone="amber">Pendiente Regisoft</Badge>
              )}
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-ink">
              {factura.numero_factura} · {factura.concepto ?? "Factura simulada"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {empresaName(factura.emisor)} → {empresaName(factura.receptor)}
            </p>
          </div>
          <div className="text-sm text-muted">
            {new Date(factura.created_at).toLocaleDateString("es-AR")}
          </div>
          <div className="text-sm font-semibold text-ink">
            ${factura.total.toFixed(2)}
          </div>
        </Link>
      ))}
    </div>
  );
}
