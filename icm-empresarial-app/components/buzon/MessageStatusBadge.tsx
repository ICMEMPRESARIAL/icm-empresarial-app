import type { CorrespondenciaEstado } from "@/lib/buzon/types";

type MessageStatusBadgeProps = {
  estado: CorrespondenciaEstado;
  reportado?: boolean;
};

const labelByEstado: Record<CorrespondenciaEstado, string> = {
  archivado: "Archivado",
  enviado: "Enviado",
  leido: "Leído",
  respondido: "Respondido"
};

const classByEstado: Record<CorrespondenciaEstado, string> = {
  archivado: "bg-slate-100 text-slate-600",
  enviado: "bg-blue-50 text-blue-700",
  leido: "bg-emerald-50 text-emerald-700",
  respondido: "bg-violet-50 text-violet-700"
};

export function MessageStatusBadge({
  estado,
  reportado = false
}: MessageStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-md px-2 py-1 text-xs font-medium",
        reportado ? "bg-red-50 text-red-700" : classByEstado[estado]
      ].join(" ")}
    >
      {reportado ? "Reportado" : labelByEstado[estado]}
    </span>
  );
}
