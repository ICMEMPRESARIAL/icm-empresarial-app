import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/Badge";
import type { PagoEstado } from "@/lib/facturas/types";

const toneByEstado: Record<PagoEstado, ComponentProps<typeof Badge>["tone"]> = {
  confirmado: "green",
  enviado: "blue",
  observado: "amber",
  rechazado: "red"
};

export function EstadoPagoBadge({ estado }: { estado: PagoEstado }) {
  return <Badge tone={toneByEstado[estado]}>{estado}</Badge>;
}
