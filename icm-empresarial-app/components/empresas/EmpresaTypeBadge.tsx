import type { EmpresaTipo } from "@/lib/empresas/types";

type EmpresaTypeBadgeProps = {
  tipo: EmpresaTipo;
};

const labelByTipo: Record<EmpresaTipo, string> = {
  bien: "Bienes",
  organismo: "Organismo",
  servicio: "Servicios"
};

export function EmpresaTypeBadge({ tipo }: EmpresaTypeBadgeProps) {
  return (
    <span className="inline-flex rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-muted">
      {labelByTipo[tipo]}
    </span>
  );
}
