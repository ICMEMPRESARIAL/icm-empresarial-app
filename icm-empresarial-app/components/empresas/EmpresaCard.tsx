import Link from "next/link";
import { ArrowRight, ClipboardCheck, Mail } from "lucide-react";
import { EmpresaAvatar } from "@/components/empresas/EmpresaAvatar";
import { EmpresaTypeBadge } from "@/components/empresas/EmpresaTypeBadge";
import { Badge } from "@/components/ui/Badge";
import type { Empresa } from "@/lib/empresas/types";

type EmpresaCardProps = {
  empresa: Empresa;
  href: string;
  showOrganismoActions?: boolean;
};

function figuraLabel(value: Empresa["figura_legal"]) {
  if (value === "monotributo") {
    return "Monotributo";
  }

  if (value === "sas") {
    return "SAS";
  }

  if (value === "organismo_publico") {
    return "Organismo público";
  }

  if (value === "banco") {
    return "Banco";
  }

  return "Sin figura legal";
}

export function EmpresaCard({
  empresa,
  href,
  showOrganismoActions = false
}: EmpresaCardProps) {
  return (
    <div className="group h-full overflow-hidden rounded-xl border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
      <Link className="block p-5" href={href}>
        <div className="flex items-start gap-4">
          <EmpresaAvatar empresa={empresa} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-ink">
                {empresa.nombre_comercial ?? empresa.nombre}
              </h2>
              <EmpresaTypeBadge tipo={empresa.tipo} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {empresa.rubro ?? "Rubro no informado"}
            </p>
          </div>
        </div>

        <p className="mt-4 line-clamp-3 min-h-16 text-sm leading-6 text-muted">
          {empresa.descripcion ?? "Sin descripción interna cargada."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="blue">{figuraLabel(empresa.figura_legal)}</Badge>
          {empresa.curso_anio && empresa.curso_division ? (
            <Badge tone="gray">
              {empresa.curso_anio}° {empresa.curso_division}
            </Badge>
          ) : null}
          <Badge tone={empresa.activo ? "green" : "red"}>
            {empresa.activo ? "Activa" : "Inactiva"}
          </Badge>
        </div>

        <div className="mt-5 flex items-center justify-between text-sm font-medium text-brand">
          Ver empresa
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </div>
      </Link>

      {showOrganismoActions ? (
        <div className="grid grid-cols-2 border-t border-border">
          <Link
            className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-ink transition hover:bg-surface"
            href={`${href}/tramites`}
          >
            <ClipboardCheck className="h-4 w-4" />
            Trámites
          </Link>
          <Link
            className="flex items-center justify-center gap-2 border-l border-border px-3 py-3 text-sm font-medium text-ink transition hover:bg-surface"
            href="/buzon/nuevo"
          >
            <Mail className="h-4 w-4" />
            Mensaje
          </Link>
        </div>
      ) : null}
    </div>
  );
}
