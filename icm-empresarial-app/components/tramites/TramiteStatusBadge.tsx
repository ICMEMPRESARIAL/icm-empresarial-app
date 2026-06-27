import {
  tramiteEstadoLabels,
  type TramiteEstado
} from "@/lib/tramites/types";

type TramiteStatusBadgeProps = {
  estado: TramiteEstado;
};

const classByEstado: Record<TramiteEstado, string> = {
  aprobada: "bg-emerald-100 text-emerald-800",
  documentacion_enviada: "bg-blue-100 text-blue-800",
  documentacion_requerida: "bg-amber-100 text-amber-800",
  en_revision: "bg-indigo-100 text-indigo-800",
  finalizada: "bg-slate-200 text-slate-800",
  observada: "bg-orange-100 text-orange-800",
  recibida_por_organismo: "bg-cyan-100 text-cyan-800",
  rechazada: "bg-red-100 text-red-800",
  solicitud_enviada: "bg-slate-100 text-slate-700"
};

export function TramiteStatusBadge({ estado }: TramiteStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-md px-2 py-1 text-xs font-medium",
        classByEstado[estado]
      ].join(" ")}
    >
      {tramiteEstadoLabels[estado]}
    </span>
  );
}
