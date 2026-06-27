import type { ProfileEstado } from "@/lib/auth/get-user-profile";

type UserStatusBadgeProps = {
  estado: ProfileEstado;
};

const labelByEstado: Record<ProfileEstado, string> = {
  activo: "Activo",
  dado_de_baja: "Dado de baja",
  pendiente: "Pendiente",
  suspendido: "Suspendido"
};

const classByEstado: Record<ProfileEstado, string> = {
  activo: "bg-emerald-100 text-emerald-800",
  dado_de_baja: "bg-slate-200 text-slate-800",
  pendiente: "bg-amber-100 text-amber-800",
  suspendido: "bg-red-100 text-red-800"
};

export function UserStatusBadge({ estado }: UserStatusBadgeProps) {
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
