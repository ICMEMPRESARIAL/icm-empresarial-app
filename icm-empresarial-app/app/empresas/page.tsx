import Link from "next/link";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmpresaGrid } from "@/components/empresas/EmpresaGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { getEmpresasByTipos } from "@/lib/empresas/queries";
import { requireAuth } from "@/lib/auth/require-auth";
import type { EmpresaTipo } from "@/lib/empresas/types";

type EmpresasPageProps = {
  searchParams: Promise<{
    q?: string;
    tipo?: string;
  }>;
};

function normalizeTipo(value: string | undefined): "todas" | EmpresaTipo {
  if (value === "bien" || value === "servicio") {
    return value;
  }

  return "todas";
}

export default async function EmpresasPage({ searchParams }: EmpresasPageProps) {
  const { profile } = await requireAuth();
  const params = await searchParams;
  const tipo = normalizeTipo(params.tipo);
  const q = params.q?.trim().toLowerCase() ?? "";
  const tipos: EmpresaTipo[] =
    tipo === "todas" ? ["servicio", "bien"] : [tipo];
  const empresas = (await getEmpresasByTipos(tipos, profile)).filter(
    (empresa) =>
      !q ||
      empresa.nombre.toLowerCase().includes(q) ||
      empresa.nombre_comercial?.toLowerCase().includes(q) ||
      empresa.rubro?.toLowerCase().includes(q)
  );

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Empresas simuladas de bienes y servicios disponibles dentro de ICM Empresarial."
          eyebrow="Empresas"
          title="Directorio interno de empresas"
        />

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <form className="flex h-11 items-center gap-2 rounded-lg border border-border bg-white px-3 shadow-sm">
            <Search className="h-4 w-4 text-muted" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              defaultValue={params.q ?? ""}
              name="q"
              placeholder="Buscar por nombre o rubro"
            />
            {tipo !== "todas" ? (
              <input name="tipo" type="hidden" value={tipo} />
            ) : null}
          </form>
          <Tabs
            items={[
              { active: tipo === "todas", href: "/empresas", label: "Todas" },
              {
                active: tipo === "bien",
                href: "/empresas?tipo=bien",
                label: "Bienes"
              },
              {
                active: tipo === "servicio",
                href: "/empresas?tipo=servicio",
                label: "Servicios"
              }
            ]}
          />
        </div>

        {q ? (
          <p className="text-sm text-muted">
            Resultados para “{params.q}”.{" "}
            <Link className="font-medium text-brand hover:underline" href="/empresas">
              Limpiar búsqueda
            </Link>
          </p>
        ) : null}

        <EmpresaGrid
          basePath="/empresas"
          emptyMessage="No hay empresas visibles para mostrar con esos filtros."
          empresas={empresas}
        />
      </div>
    </AppShell>
  );
}
