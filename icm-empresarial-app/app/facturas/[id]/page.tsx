import { notFound } from "next/navigation";
import { updatePagoEstadoAction } from "@/lib/facturas/actions";
import { EstadoFacturaBadge } from "@/components/facturas/EstadoFacturaBadge";
import { EstadoPagoBadge } from "@/components/facturas/EstadoPagoBadge";
import { FacturaTimeline } from "@/components/facturas/FacturaTimeline";
import { FacturaTotalsBox } from "@/components/facturas/FacturaTotalsBox";
import { PagoFacturaForm } from "@/components/facturas/PagoFacturaForm";
import { RegisoftRegistroPanel } from "@/components/facturas/RegisoftRegistroPanel";
import { AppShell } from "@/components/layout/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { getFacturaById } from "@/lib/facturas/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

function empresaName(empresa: { nombre: string; nombre_comercial: string | null } | null) {
  return empresa?.nombre_comercial ?? empresa?.nombre ?? "Sin empresa";
}

export default async function FacturaDetailPage({ params }: PageProps) {
  const { profile } = await requireAuth();
  const { id } = await params;
  const factura = await getFacturaById(id);

  if (!factura) {
    notFound();
  }

  const puedePagar =
    profile.estado === "activo" &&
    profile.empresa_id === factura.receptor_empresa_id &&
    factura.estado !== "pagada";
  const puedeRevisarPago =
    profile.rol === "profesora_admin" ||
    profile.empresa_id === factura.emisor_empresa_id;

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          actions={<ActionButton href="/facturas" variant="secondary">Volver</ActionButton>}
          description={`${empresaName(factura.emisor)} → ${empresaName(factura.receptor)}`}
          eyebrow="Factura"
          title={factura.numero_factura}
        />
        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <SectionCard title="Detalle de factura">
            <div className="mb-4 flex flex-wrap gap-2">
              <EstadoFacturaBadge estado={factura.estado} />
              <Badge tone={factura.registrado_en_regisoft ? "green" : "amber"}>
                {factura.registrado_en_regisoft
                  ? "Registrada en Regisoft"
                  : "Pendiente Regisoft"}
              </Badge>
            </div>
            <p className="text-sm font-semibold text-ink">
              {factura.concepto ?? "Factura simulada"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {factura.observaciones ?? "Sin observaciones."}
            </p>
            <div className="mt-5 overflow-hidden rounded-xl border border-border">
              {factura.items.map((item) => (
                <div
                  className="grid gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 md:grid-cols-[1fr_90px_120px_120px]"
                  key={item.id}
                >
                  <span className="font-medium text-ink">{item.descripcion}</span>
                  <span>{item.cantidad}</span>
                  <span>${item.precio_unitario.toFixed(2)}</span>
                  <span className="font-semibold">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
          <div className="space-y-4">
            <FacturaTotalsBox
              iva={factura.iva}
              subtotal={factura.subtotal}
              total={factura.total}
            />
            <RegisoftRegistroPanel
              id={factura.id}
              referencia={factura.referencia_regisoft}
              registrado={factura.registrado_en_regisoft}
              tipo="factura"
            />
          </div>
        </section>

        {puedePagar ? (
          <SectionCard title="Pagar factura">
            <PagoFacturaForm factura={factura} />
          </SectionCard>
        ) : null}

        <SectionCard title="Pagos">
          {factura.pagos.length === 0 ? (
            <p className="text-sm text-muted">Todavía no hay pagos enviados.</p>
          ) : (
            <div className="space-y-4">
              {factura.pagos.map((pago) => (
                <div
                  className="rounded-xl border border-border bg-white p-4"
                  key={pago.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <EstadoPagoBadge estado={pago.estado} />
                      <p className="mt-2 text-sm font-semibold text-ink">
                        ${pago.importe.toFixed(2)} ·{" "}
                        {pago.medio_pago.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {pago.numero_operacion ?? "Sin número de operación"}
                      </p>
                    </div>
                    {pago.comprobante_path ? (
                      <ActionButton href={pago.comprobante_path} variant="secondary">
                        Ver comprobante
                      </ActionButton>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <RegisoftRegistroPanel
                      id={pago.id}
                      referencia={pago.referencia_regisoft}
                      registrado={pago.registrado_en_regisoft}
                      tipo="pago"
                    />
                  </div>
                  {puedeRevisarPago && pago.estado === "enviado" ? (
                    <form action={updatePagoEstadoAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_150px_150px]">
                      <input name="pago_id" type="hidden" value={pago.id} />
                      <input
                        className="h-10 rounded-lg border border-border px-3 text-sm"
                        name="observaciones"
                        placeholder="Observación opcional"
                      />
                      <button
                        className="rounded-md border border-border bg-white px-4 text-sm font-medium"
                        name="estado"
                        type="submit"
                        value="observado"
                      >
                        Observar
                      </button>
                      <button
                        className="rounded-md bg-brand px-4 text-sm font-medium text-white"
                        name="estado"
                        type="submit"
                        value="confirmado"
                      >
                        Confirmar cobro
                      </button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Sugerencia Regisoft">
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="font-semibold text-ink">Empresa emisora</h3>
              <p className="mt-2 text-muted">
                Registrar venta a {empresaName(factura.receptor)} por $
                {factura.total.toFixed(2)}. Cuentas sugeridas: Ventas /
                Clientes.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <h3 className="font-semibold text-ink">Empresa receptora</h3>
              <p className="mt-2 text-muted">
                Registrar compra o gasto a {empresaName(factura.emisor)} por $
                {factura.total.toFixed(2)}. Cuentas sugeridas: Compras /
                Proveedores.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Timeline">
          <FacturaTimeline eventos={factura.eventos} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
