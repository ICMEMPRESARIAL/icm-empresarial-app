import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/Badge";
import type { FacturaEstado } from "@/lib/facturas/types";

const toneByEstado: Record<FacturaEstado, ComponentProps<typeof Badge>["tone"]> = {
  anulada: "gray",
  borrador: "gray",
  emitida: "blue",
  observada: "amber",
  pagada: "green",
  pago_enviado: "violet",
  pendiente_pago: "orange",
  recibida: "blue",
  rechazada: "red",
  vencida: "red"
};

export function EstadoFacturaBadge({ estado }: { estado: FacturaEstado }) {
  return <Badge tone={toneByEstado[estado]}>{estado.replaceAll("_", " ")}</Badge>;
}
