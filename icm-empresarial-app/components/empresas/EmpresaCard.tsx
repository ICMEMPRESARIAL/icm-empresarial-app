import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmpresaTypeBadge } from "@/components/empresas/EmpresaTypeBadge";
import type { Empresa } from "@/lib/empresas/types";

type EmpresaCardProps = {
  empresa: Empresa;
  href: string;
};

export function EmpresaCard({ empresa, href }: EmpresaCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full transition hover:border-brand hover:shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink">{empresa.nombre}</h2>
            <p className="mt-1 text-sm text-muted">
              {empresa.rubro ?? "Rubro no informado"}
            </p>
          </div>
          <EmpresaTypeBadge tipo={empresa.tipo} />
        </div>
        <p className="mt-4 line-clamp-3 text-sm text-muted">
          {empresa.descripcion ?? "Sin descripcion interna cargada."}
        </p>
      </Card>
    </Link>
  );
}
