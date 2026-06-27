import type { SolicitudRegistroEstado } from "@/lib/admin/solicitudes/queries";

type SolicitudStatusBadgeProps = {
  estado: SolicitudRegistroEstado;
};

const labelByEstado: Record<SolicitudRegistroEstado, string> = {
  aprobada: "Aprobada",
  pendiente: "Pendiente",
  rechazada: "Rechazada"
};

const classByEstado: Record<SolicitudRegistroEstado, string> = {
  aprobada: "bg-emerald-100 text-emerald-800",
  pendiente: "bg-amber-100 text-amber-800",
  rechazada: "bg-red-100 text-red-800"
};

export function SolicitudStatusBadge({ estado }: SolicitudStatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-md px-2 py-1 text-xs font-medium",
        classByEstado[estado]
      ].join(" ")}
    >
      {labelByEstado[estado]}
    </span>
  );
}
