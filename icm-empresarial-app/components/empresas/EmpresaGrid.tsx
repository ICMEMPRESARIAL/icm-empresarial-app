import { EmpresaCard } from "@/components/empresas/EmpresaCard";
import type { Empresa } from "@/lib/empresas/types";

type EmpresaGridProps = {
  empresas: Empresa[];
  basePath: "/empresas" | "/organismos";
  emptyMessage: string;
};

export function EmpresaGrid({
  basePath,
  emptyMessage,
  empresas
}: EmpresaGridProps) {
  if (empresas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {empresas.map((empresa) => (
        <EmpresaCard
          empresa={empresa}
          href={`${basePath}/${empresa.slug}`}
          key={empresa.id}
        />
      ))}
    </div>
  );
}
