import Link from "next/link";
import {
  Building2,
  ClipboardCheck,
  FileText,
  Landmark,
  Mail,
  ReceiptText,
  ShieldCheck,
  Store
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmpresaAvatar } from "@/components/empresas/EmpresaAvatar";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { getEmpresaById } from "@/lib/empresas/queries";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  getTramitesCountByEstadoForCurrentUser,
  getTramitesForCurrentUser
} from "@/lib/tramites/queries";
import { getCorrespondenciaForCurrentUser } from "@/lib/buzon/queries";

const profileHrefPlaceholder = "/perfil-empresa";

const accessCards = [
  {
    description: "Mensajes, pedidos y reclamos internos.",
    href: "/buzon",
    icon: Mail,
    title: "Buzón"
  },
  {
    description: "Expedientes ante organismos de la simulación.",
    href: "/tramites",
    icon: ClipboardCheck,
    title: "Trámites"
  },
  {
    description: "Facturación y pagos simulados.",
    href: "/facturas",
    icon: ReceiptText,
    title: "Facturas"
  },
  {
    description: "Directorio de empresas de bienes y servicios.",
    href: "/empresas",
    icon: Building2,
    title: "Empresas"
  },
  {
    description: "Organismos públicos internos.",
    href: "/organismos",
    icon: Landmark,
    title: "Organismos"
  },
  {
    description: "Datos, logo y presentación de la empresa.",
    href: "/perfil-empresa",
    icon: ShieldCheck,
    title: "Perfil de empresa"
  },
  {
    description: "Vista pública interna de la empresa.",
    href: profileHrefPlaceholder,
    icon: Store,
    title: "Sitio de empresa"
  },
  {
    description: "Documentación legal evaluable.",
    href: "/perfil-empresa",
    icon: FileText,
    title: "Información legal"
  }
] as const;

function statusLabel(status: string) {
  if (status === "activo") {
    return "Activo";
  }

  if (status === "pendiente") {
    return "Pendiente";
  }

  if (status === "suspendido") {
    return "Suspendido";
  }

  return "Dado de baja";
}

export default async function DashboardPage() {
  const { profile } = await requireAuth();
  const empresa = profile.empresa_id
    ? await getEmpresaById(profile.empresa_id, profile)
    : null;
  const [tramitesCount, tramites, mensajesRecibidos] = await Promise.all([
    getTramitesCountByEstadoForCurrentUser(),
    getTramitesForCurrentUser(),
    getCorrespondenciaForCurrentUser("recibidos")
  ]);

  const unreadMessages = mensajesRecibidos.filter(
    (mensaje) =>
      mensaje.estado === "enviado" &&
      mensaje.destinatario_empresa_id === profile.empresa_id
  ).length;
  const tramitesActivos = tramites.filter(
    (tramite) =>
      tramite.estado !== "finalizada" &&
      tramite.estado !== "aprobada" &&
      tramite.estado !== "rechazada"
  ).length;
  const latestMessages = mensajesRecibidos.slice(0, 3);
  const latestTramites = tramites.slice(0, 3);

  return (
    <AppShell profile={profile}>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div
            className="h-32 bg-brand"
            style={{
              backgroundColor: empresa?.color_marca ?? "#1f4f8f",
              backgroundImage: empresa?.banner_url
                ? `url(${empresa.banner_url})`
                : undefined,
              backgroundPosition: "center",
              backgroundSize: "cover"
            }}
          />
          <div className="px-5 pb-5">
            <div className="-mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                {empresa ? (
                  <EmpresaAvatar className="h-20 w-20 rounded-2xl" empresa={empresa} />
                ) : null}
                <div className="pb-1">
                  <h1 className="text-3xl font-semibold text-ink">
                    {empresa?.nombre_comercial ?? empresa?.nombre ?? profile.nombre}
                  </h1>
                  <p className="mt-1 text-sm text-muted">
                    {empresa?.slogan ??
                      "Operá tu empresa simulada dentro de ICM Empresarial."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pb-1">
                <StatusPill
                  label={statusLabel(profile.estado)}
                  status={profile.estado === "activo" ? "active" : "pending"}
                />
                {empresa?.figura_legal ? (
                  <StatusPill label={empresa.figura_legal} status="info" />
                ) : null}
              </div>
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="font-medium text-ink">Tipo</dt>
                <dd className="mt-1 text-muted">{empresa?.tipo ?? "No aplica"}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Rubro</dt>
                <dd className="mt-1 text-muted">
                  {empresa?.rubro ?? "Sin informar"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Curso</dt>
                <dd className="mt-1 text-muted">
                  {empresa?.curso_anio && empresa.curso_division
                    ? `${empresa.curso_anio}° ${empresa.curso_division}`
                    : "Sin informar"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink">CUIT simulado</dt>
                <dd className="mt-1 text-muted">
                  {empresa?.cuit_simulado ?? "Sin informar"}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Mail className="h-5 w-5" />}
            label="Mensajes no leídos"
            value={unreadMessages}
          />
          <StatCard
            icon={<ClipboardCheck className="h-5 w-5" />}
            label="Trámites activos"
            value={tramitesActivos}
          />
          <StatCard
            label="Trámites observados"
            value={
              tramitesCount.observada + tramitesCount.documentacion_requerida
            }
          />
          <StatCard label="Trámites aprobados" value={tramitesCount.aprobada} />
          <StatCard label="Facturas emitidas pendientes" value={0} />
          <StatCard label="Facturas recibidas pendientes" value={0} />
          <StatCard label="Pagos por confirmar" value={0} />
          <StatCard label="Pendiente Regisoft" value={0} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {accessCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link key={card.href + card.title} href={card.href}>
                <div className="h-full rounded-xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-lg bg-blue-50 p-2 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-brand">Abrir</span>
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-ink">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <SectionCard
            actions={<ActionButton href="/buzon" variant="secondary">Ver buzón</ActionButton>}
            title="Últimos mensajes"
          >
            {latestMessages.length === 0 ? (
              <EmptyState
                description="Los pedidos, reclamos y comunicaciones aparecerán acá."
                title="Sin mensajes recientes"
              />
            ) : (
              <div className="space-y-3">
                {latestMessages.map((mensaje) => (
                  <Link
                    className="block rounded-lg border border-border bg-surface p-3 transition hover:bg-white"
                    href={`/buzon/${mensaje.id}`}
                    key={mensaje.id}
                  >
                    <p className="text-sm font-semibold text-ink">
                      {mensaje.asunto}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {mensaje.remitente?.nombre ?? "Sin remitente"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            actions={<ActionButton href="/tramites" variant="secondary">Ver trámites</ActionButton>}
            title="Últimos trámites"
          >
            {latestTramites.length === 0 ? (
              <EmptyState
                description="Cuando inicies trámites ante organismos verás el seguimiento acá."
                title="Sin trámites recientes"
              />
            ) : (
              <div className="space-y-3">
                {latestTramites.map((tramite) => (
                  <Link
                    className="block rounded-lg border border-border bg-surface p-3 transition hover:bg-white"
                    href={`/tramites/${tramite.id}`}
                    key={tramite.id}
                  >
                    <p className="text-sm font-semibold text-ink">
                      {tramite.asunto}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {tramite.organismo?.nombre ?? "Organismo"} ·{" "}
                      {tramite.estado}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}
