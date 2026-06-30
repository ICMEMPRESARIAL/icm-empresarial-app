import {
  markFacturaRegistradaEnRegisoftAction,
  markPagoRegistradoEnRegisoftAction
} from "@/lib/facturas/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function RegisoftRegistroPanel({
  id,
  registrado,
  referencia,
  tipo
}: {
  id: string;
  registrado: boolean;
  referencia: string | null;
  tipo: "factura" | "pago";
}) {
  const action =
    tipo === "factura"
      ? markFacturaRegistradaEnRegisoftAction
      : markPagoRegistradoEnRegisoftAction;

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Registro en Regisoft</h3>
          <p className="mt-1 text-xs text-muted">
            ICM registra la operación; Regisoft se usa para cargar el asiento
            contable manualmente.
          </p>
        </div>
        <Badge tone={registrado ? "green" : "amber"}>
          {registrado ? "Registrado" : "Pendiente"}
        </Badge>
      </div>
      {registrado ? (
        <p className="mt-3 text-sm text-muted">
          Referencia: {referencia ?? "sin referencia cargada"}
        </p>
      ) : (
        <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            name={tipo === "factura" ? "factura_id" : "pago_id"}
            type="hidden"
            value={id}
          />
          <input
            className="h-10 flex-1 rounded-lg border border-border bg-white px-3 text-sm"
            name="referencia_regisoft"
            placeholder="Referencia opcional"
          />
          <Button type="submit">Marcar registrado</Button>
        </form>
      )}
    </div>
  );
}
