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
  showOperationalActions: boolean;
  web: EmpresaWeb | null;
};

function figuraLabel(value: Empresa["figura_legal"]) {
  if (value === "monotributo") return "Monotributo";
  if (value === "sas") return "SAS";
  if (value === "organismo_publico") return "Organismo público";
  if (value === "banco") return "Banco";
  return "Figura pendiente";
}

function normalizeExternalHref(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

export function EmpresaSiteLayout({
  active,
  children,
  empresa,
  showOperationalActions,
  web
}: EmpresaSiteLayoutProps) {
  const displayName = empresa.nombre_comercial ?? empresa.nombre;
  const tabs = [
    {
      active: active === "inicio",
      href: `/empresas/${empresa.slug}`,
      label: "Inicio"
    },
    ...(showOperationalActions
      ? [
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
          }
        ]
      : []),
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
  const sitioWeb = empresa.sitio_web ?? empresa.sitio_externo;
  const sitioHref = sitioWeb ? normalizeExternalHref(sitioWeb) : null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
        <div
          className="relative min-h-72"
          style={{
            backgroundImage: banner
              ? `linear-gradient(90deg, rgba(15,23,42,0.78), rgba(15,23,42,0.22)), url(${banner})`
              : gradient,
            backgroundPosition: "center",
            backgroundSize: "cover"
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_30%)]" />
          <div className="relative flex min-h-72 flex-col justify-end p-6 text-white sm:p-8">
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
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {sitioHref ? (
                  <ActionButton
                    href={sitioHref}
                    rel="noopener noreferrer"
                    target="_blank"
                    variant="secondary"
                  >
                    Sitio web
                  </ActionButton>
                ) : null}
                <ActionButton
                  href={`/buzon/nuevo?destinatario=${empresa.id}`}
                  variant="secondary"
                >
                  Enviar mensaje
                </ActionButton>
                {showOperationalActions ? (
                  <ActionButton href={`/empresas/${empresa.slug}/contratarnos`}>
                    Contratar
                  </ActionButton>
                ) : null}
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
