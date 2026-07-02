import { EmpresaAvatar } from "@/components/empresas/EmpresaAvatar";
import { EmpresaTypeBadge } from "@/components/empresas/EmpresaTypeBadge";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import type { Empresa } from "@/lib/empresas/types";
import type { EmpresaWeb } from "@/lib/empresa-site/types";

type EmpresaSiteLayoutProps = {
  active: "inicio" | "productos" | "contratarnos" | "legal" | "contacto";
  children: React.ReactNode;
  empresa: Empresa;
  web: EmpresaWeb | null;
};

function figuraLabel(value: Empresa["figura_legal"]) {
  if (value === "monotributo") return "Monotributo";
  if (value === "sas") return "SAS";
  if (value === "organismo_publico") return "Organismo público";
  if (value === "banco") return "Banco";
  return "Figura pendiente";
}

export function EmpresaSiteLayout({
  active,
  children,
  empresa,
  web
}: EmpresaSiteLayoutProps) {
  const displayName = empresa.nombre_comercial ?? empresa.nombre;
  const tabs = [
    { active: active === "inicio", href: `/empresas/${empresa.slug}`, label: "Inicio" },
    {
      active: active === "productos",
      href: `/empresas/${empresa.slug}/productos`,
      label: "Productos y servicios"
    },
    {
      active: active === "contratarnos",
      href: `/empresas/${empresa.slug}/contratarnos`,
      label: "Contratarnos"
    },
    {
      active: active === "legal",
      href: `/empresas/${empresa.slug}/informacion-legal`,
      label: "Información Legal"
    },
    {
      active: active === "contacto",
      href: `/empresas/${empresa.slug}/contacto`,
      label: "Contacto"
    }
  ];
  const gradient = `linear-gradient(135deg, ${
    empresa.color_marca ?? "#1f4f8f"
  }, #0ea5e9 58%, #14b8a6)`;
  const banner = web?.banner_url ?? empresa.banner_url;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
        <div
          className="relative min-h-80"
          style={{
            backgroundImage: banner
              ? `linear-gradient(90deg, rgba(15,23,42,0.78), rgba(15,23,42,0.22)), url(${banner})`
              : gradient,
            backgroundPosition: "center",
            backgroundSize: "cover"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
          <div className="relative flex min-h-80 flex-col justify-end p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <EmpresaAvatar
                  className="h-28 w-28 rounded-3xl border-4 border-white/80"
                  empresa={empresa}
                />
                <div>
                  <div className="flex flex-wrap gap-2">
                    <EmpresaTypeBadge tipo={empresa.tipo} />
                    <Badge tone="blue">{figuraLabel(empresa.figura_legal)}</Badge>
                    {empresa.curso_anio && empresa.curso_division ? (
                      <Badge tone="gray">
                        {empresa.curso_anio}° {empresa.curso_division}
                      </Badge>
                    ) : null}
                  </div>
                  <h1 className="mt-4 text-4xl font-semibold text-white">
                    {displayName}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                    {web?.slogan ?? empresa.slogan ?? empresa.rubro}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/80">
                    {empresa.domicilio ? (
                      <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                        {empresa.domicilio}
                      </span>
                    ) : null}
                    {empresa.contacto_email ? (
                      <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                        {empresa.contacto_email}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  href={`/buzon/nuevo?destinatario=${empresa.id}`}
                  variant="secondary"
                >
                  Enviar mensaje
                </ActionButton>
                <ActionButton href={`/empresas/${empresa.slug}/contratarnos`}>
                  Contratar
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Tabs items={tabs} />
      {children}
    </div>
  );
}
