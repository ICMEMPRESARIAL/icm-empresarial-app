import type { CorrespondenciaTipo } from "@/lib/buzon/types";

type MessageTypeBadgeProps = {
  tipo: CorrespondenciaTipo;
};

const labelByTipo: Record<CorrespondenciaTipo, string> = {
  consulta: "Consulta",
  factura_simulada: "Factura simulada",
  notificacion: "Notificación",
  oficio: "Oficio",
  pedido: "Pedido",
  reclamo: "Reclamo"
};

export function MessageTypeBadge({ tipo }: MessageTypeBadgeProps) {
  return (
    <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
      {labelByTipo[tipo]}
    </span>
  );
}
