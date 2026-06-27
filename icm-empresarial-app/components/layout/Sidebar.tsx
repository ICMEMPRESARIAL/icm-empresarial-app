import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";

type SidebarProps = {
  profile: ProfileWithEmpresa;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/empresas", label: "Empresas" },
  { href: "/organismos", label: "Organismos" },
  { href: "/tramites", label: "Trámites" },
  { href: "/buzon", label: "Buzón" },
  { href: "/perfil-empresa", label: "Perfil de empresa" }
] as const;

const adminItems = [
  { href: "/admin", label: "Admin" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/correspondencia", label: "Correspondencia" },
  { href: "/admin/tramites", label: "Trámites" },
  { href: "/admin/empresas", label: "Empresas" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/auditoria", label: "Auditoría" }
] as const;

export function Sidebar({ profile }: SidebarProps) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-border bg-white lg:flex lg:flex-col">
      <div className="border-b border-border px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white">
            ICM
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">ICM Empresarial</p>
            <p className="truncate text-xs text-muted">
              {profile.empresa?.nombre ?? profile.nombre}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 px-4 py-5">
        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Plataforma
          </p>
        {navItems.map((item) => (
          <Link
            className="block rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
        </div>

        {profile.rol === "profesora_admin" ? (
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Admin
            </p>
            {adminItems.map((item) => (
              <Link
                className="block rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
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
