import { EmpresaCard } from "@/components/empresas/EmpresaCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Empresa } from "@/lib/empresas/types";

type EmpresaGridProps = {
  empresas: Empresa[];
  basePath: "/empresas" | "/organismos";
  emptyMessage: string;
  showOperationalActions?: boolean;
};

export function EmpresaGrid({
  basePath,
  emptyMessage,
  empresas,
  showOperationalActions = false
}: EmpresaGridProps) {
  if (empresas.length === 0) {
    return <EmptyState description={emptyMessage} title="Sin resultados" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {empresas.map((empresa) => (
        <EmpresaCard
          empresa={empresa}
          href={`${basePath}/${empresa.slug}`}
          key={empresa.id}
          showOrganismoActions={basePath === "/organismos" && showOperationalActions}
        />
      ))}
    </div>
  );
}
