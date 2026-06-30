"use client";

import {
  BarChart3,
  Building2,
  ClipboardCheck,
  FileText,
  Gavel,
  Inbox,
  LayoutDashboard,
  Landmark,
  Mail,
  ScrollText,
  ShieldCheck,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/StatusPill";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";

type SidebarProps = {
  profile: ProfileWithEmpresa;
};

type SidebarItem = {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
};

const platformItems: SidebarItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/empresas", icon: Building2, label: "Empresas" },
  { href: "/organismos", icon: Landmark, label: "Organismos" },
  { href: "/perfil-empresa", icon: ShieldCheck, label: "Perfil" }
];

const operationItems: SidebarItem[] = [
  { href: "/buzon", icon: Mail, label: "Buzón" },
  { href: "/tramites", icon: ClipboardCheck, label: "Trámites" },
  { href: "/facturas", icon: FileText, label: "Facturas" }
];

const adminItems: SidebarItem[] = [
  { href: "/admin", icon: BarChart3, label: "Admin" },
  { href: "/admin/solicitudes", icon: Inbox, label: "Solicitudes" },
  { href: "/admin/usuarios", icon: Users, label: "Usuarios" },
  { href: "/admin/empresas", icon: Building2, label: "Empresas" },
  { href: "/admin/correspondencia", icon: Mail, label: "Correspondencia" },
  { href: "/admin/tramites", icon: ClipboardCheck, label: "Trámites" },
  { href: "/admin/facturas", icon: ScrollText, label: "Facturas/Pagos" },
  { href: "/admin/auditoria", icon: Gavel, label: "Auditoría" }
];

function estadoLabel(estado: ProfileWithEmpresa["estado"]) {
  if (estado === "activo") {
    return "Activo";
  }

  if (estado === "pendiente") {
    return "Pendiente";
  }

  if (estado === "suspendido") {
    return "Suspendido";
  }

  return "Dado de baja";
}

function estadoStatus(estado: ProfileWithEmpresa["estado"]) {
  if (estado === "activo") {
    return "active";
  }

  if (estado === "pendiente") {
    return "pending";
  }

  if (estado === "suspendido") {
    return "suspended";
  }

  return "inactive";
}

function SidebarNav({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            className={[
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-brand text-white shadow-sm"
                : "text-slate-700 hover:bg-surface hover:text-ink"
            ].join(" ")}
            href={item.href}
            key={item.href}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar({ profile }: SidebarProps) {
  const avatarName = profile.empresa?.nombre ?? profile.nombre;

  return (
    <aside className="hidden min-h-screen shrink-0 border-r border-border bg-white/95 lg:flex lg:w-80 lg:flex-col">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shadow-sm">
            ICM
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">ICM Empresarial</p>
            <p className="text-xs text-muted">Mundo empresarial simulado</p>
          </div>
        </div>
      </div>

      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <Avatar
            alt={avatarName}
            color={profile.empresa?.color_marca}
            name={avatarName}
            src={profile.empresa?.logo_url ?? profile.empresa?.logo}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {avatarName}
            </p>
            <p className="truncate text-xs text-muted">
              {profile.rol === "profesora_admin"
                ? "Profesora admin"
                : profile.empresa?.tipo ?? "Empresa"}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <StatusPill
            label={estadoLabel(profile.estado)}
            status={estadoStatus(profile.estado)}
          />
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Plataforma
          </p>
          <SidebarNav items={platformItems} />
        </div>

        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Operación
          </p>
          <SidebarNav items={operationItems} />
        </div>

        {profile.rol === "profesora_admin" ? (
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Administración
            </p>
            <SidebarNav items={adminItems} />
          </div>
        ) : null}
      </nav>

      <div className="border-t border-border px-5 py-5">
        <p className="mb-3 truncate text-xs text-muted">{profile.nombre}</p>
        <LogoutButton className="w-full" />
      </div>
    </aside>
  );
}
