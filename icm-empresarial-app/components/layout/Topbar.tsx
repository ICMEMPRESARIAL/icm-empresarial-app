import { Bell, Search } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/StatusPill";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";

type TopbarProps = {
  profile: ProfileWithEmpresa;
};

function roleLabel(profile: ProfileWithEmpresa) {
  return profile.rol === "profesora_admin"
    ? "Profesora administradora"
    : profile.empresa?.tipo ?? "Empresa";
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

export function Topbar({ profile }: TopbarProps) {
  const companyName = profile.empresa?.nombre ?? "Sin empresa asociada";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            alt={companyName}
            className="h-10 w-10 lg:hidden"
            color={profile.empresa?.color_marca}
            name={companyName}
            src={profile.empresa?.logo_url ?? profile.empresa?.logo}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {companyName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">{roleLabel(profile)}</span>
              <StatusPill
                label={profile.estado}
                status={estadoStatus(profile.estado)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs text-muted md:flex">
            <Search className="h-4 w-4" />
            Buscar en ICM
          </div>
          <button
            aria-label="Notificaciones"
            className="hidden h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-muted transition hover:bg-surface sm:flex"
            type="button"
          >
            <Bell className="h-4 w-4" />
          </button>
          <LogoutButton className="hidden sm:inline-flex" />
        </div>
      </div>
    </header>
  );
}
