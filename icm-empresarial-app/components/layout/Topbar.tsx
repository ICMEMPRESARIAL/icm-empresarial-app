import { LogoutButton } from "@/components/auth/LogoutButton";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";

type TopbarProps = {
  profile: ProfileWithEmpresa;
};

export function Topbar({ profile }: TopbarProps) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border bg-white px-4 sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">
          {profile.nombre}
        </p>
        <p className="text-xs text-muted">
          {profile.rol === "profesora_admin" ? "Profesora admin" : "Empresa"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted sm:block">
          {profile.empresa?.nombre ?? "Sin empresa"}
        </div>
        <LogoutButton className="hidden sm:inline-flex" />
      </div>
    </header>
  );
}
