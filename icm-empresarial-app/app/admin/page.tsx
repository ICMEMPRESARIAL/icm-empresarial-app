import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  ClipboardCheck,
  FileText,
  Inbox,
  Mail,
  ShieldAlert,
  Users
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { getSolicitudesRegistro } from "@/lib/admin/solicitudes/queries";
import { getAdminUsers } from "@/lib/admin/usuarios/queries";
import { getAllCorrespondenciaForAdmin } from "@/lib/admin/correspondencia/queries";
import { getAllTramitesForAdmin } from "@/lib/tramites/queries";
import { getAllFacturasForAdmin, getAllPagosForAdmin } from "@/lib/facturas/queries";
import { requireAuth } from "@/lib/auth/require-auth";

const adminCards = [
  {
    description: "Aprobación de alumnos y creación de entidades internas.",
    href: "/admin/solicitudes",
    icon: Inbox,
    title: "Solicitudes"
  },
  {
    description: "Usuarios, perfiles, estados y moderación.",
    href: "/admin/usuarios",
    icon: Users,
    title: "Usuarios"
  },
  {
    description: "Empresas, organismos y bancos simulados.",
    href: "/admin/empresas",
    icon: Building2,
    title: "Empresas"
  },
  {
    description: "Supervisión y moderación de mensajes internos.",
    href: "/admin/correspondencia",
    icon: Mail,
    title: "Correspondencia"
  },
  {
    description: "Seguimiento global de expedientes y organismos.",
    href: "/admin/tramites",
    icon: ClipboardCheck,
    title: "Trámites"
  },
  {
    description: "Facturas, pagos, comprobantes y seguimiento Regisoft.",
    href: "/admin/facturas",
    icon: FileText,
    title: "Facturas/Pagos"
  }
] as const;

export default async function AdminPage() {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  const [solicitudes, users, correspondencia, tramites, facturas, pagos] =
    await Promise.all([
    getSolicitudesRegistro(),
    getAdminUsers(),
    getAllCorrespondenciaForAdmin("todos"),
    getAllTramitesForAdmin(),
    getAllFacturasForAdmin(),
    getAllPagosForAdmin()
  ]);
  const solicitudesPendientes = solicitudes.filter(
    (solicitud) => solicitud.estado === "pendiente"
  ).length;
  const usuariosActivos = users.filter((user) => user.estado === "activo").length;
  const usuariosSuspendidos = users.filter(
    (user) => user.estado === "suspendido"
  ).length;
  const mensajesReportados = correspondencia.filter(
    (mensaje) => mensaje.reportado
  ).length;
  const tramitesObservados = tramites.filter(
    (tramite) =>
      tramite.estado === "observada" ||
      tramite.estado === "documentacion_requerida"
  ).length;
  const tramitesPendientes = tramites.filter(
    (tramite) =>
      tramite.estado === "solicitud_enviada" ||
      tramite.estado === "recibida_por_organismo" ||
      tramite.estado === "en_revision"
  ).length;
  const facturasPendientes = facturas.filter(
    (factura) => factura.estado !== "pagada" && factura.estado !== "anulada"
  ).length;
  const pendienteRegisoft =
    facturas.filter((factura) => !factura.registrado_en_regisoft).length +
    pagos.filter((pago) => !pago.registrado_en_regisoft).length;

  return (
    <AppShell profile={profile}>
      <div className="space-y-8">
        <PageHeader
          description="Supervisá solicitudes, usuarios, mensajes, trámites y actividad general del mundo simulado."
          eyebrow="Administración"
          title="Panel de profesora administradora"
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Inbox className="h-5 w-5" />}
            label="Solicitudes pendientes"
            value={solicitudesPendientes}
          />
          <StatCard label="Usuarios activos" value={usuariosActivos} />
          <StatCard
            icon={<ShieldAlert className="h-5 w-5" />}
            label="Usuarios suspendidos"
            value={usuariosSuspendidos}
          />
          <StatCard label="Mensajes reportados" value={mensajesReportados} />
          <StatCard label="Trámites pendientes" value={tramitesPendientes} />
          <StatCard label="Trámites observados" value={tramitesObservados} />
          <StatCard label="Facturas pendientes" value={facturasPendientes} />
          <StatCard label="Pendiente Regisoft" value={pendienteRegisoft} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link key={card.href} href={card.href}>
                <div className="h-full rounded-xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
                  <div className="rounded-lg bg-blue-50 p-2 text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-ink">
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

        <SectionCard title="Última actividad">
          <EmptyState
            description="La vista de auditoría enriquecida se trabajará en una fase posterior."
            title="Actividad resumida pendiente"
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
