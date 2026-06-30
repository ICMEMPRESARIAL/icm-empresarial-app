import { EstadoPagoBadge } from "@/components/facturas/EstadoPagoBadge";
import { RegisoftRegistroPanel } from "@/components/facturas/RegisoftRegistroPanel";
import { AppShell } from "@/components/layout/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { getPagosForCurrentUser } from "@/lib/facturas/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function PagosPage() {
  const { profile } = await requireAuth();
  const pagos = await getPagosForCurrentUser();

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Comprobantes enviados, cobros confirmados y registro manual en Regisoft."
          eyebrow="Pagos"
          title="Pagos"
        />
        <SectionCard title="Pagos registrados">
          {pagos.length === 0 ? (
            <p className="text-sm text-muted">Todavía no hay pagos.</p>
          ) : (
            <div className="space-y-4">
              {pagos.map((pago) => (
                <div className="rounded-xl border border-border bg-white p-4" key={pago.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <EstadoPagoBadge estado={pago.estado} />
                      <p className="mt-2 text-sm font-semibold text-ink">
                        ${pago.importe.toFixed(2)} · factura{" "}
                        {pago.factura?.numero_factura ?? "sin número"}
                      </p>
                    </div>
                    <ActionButton href={`/facturas/${pago.factura_id}`} variant="secondary">
                      Ver factura
                    </ActionButton>
                  </div>
                  <div className="mt-4">
                    <RegisoftRegistroPanel
                      id={pago.id}
                      referencia={pago.referencia_regisoft}
                      registrado={pago.registrado_en_regisoft}
                      tipo="pago"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
