export function FacturaTotalsBox({
  iva,
  subtotal,
  total
}: {
  iva: number;
  subtotal: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-sm">
      <div className="flex justify-between py-1">
        <span className="text-muted">Subtotal</span>
        <strong className="text-ink">${subtotal.toFixed(2)}</strong>
      </div>
      <div className="flex justify-between py-1">
        <span className="text-muted">IVA simulado 21%</span>
        <strong className="text-ink">${iva.toFixed(2)}</strong>
      </div>
      <div className="mt-2 flex justify-between border-t border-border pt-3 text-base">
        <span className="font-semibold text-ink">Total</span>
        <strong className="text-ink">${total.toFixed(2)}</strong>
      </div>
    </div>
  );
}
