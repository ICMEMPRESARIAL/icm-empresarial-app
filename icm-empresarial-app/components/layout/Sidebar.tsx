import Link from "next/link";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";

type SidebarProps = {
  profile: ProfileWithEmpresa;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/empresas", label: "Empresas" },
  { href: "/organismos", label: "Organismos" },
  { href: "/buzon", label: "Buzón" },
  { href: "/perfil-empresa", label: "Perfil de empresa" }
] as const;

export function Sidebar({ profile }: SidebarProps) {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-border bg-white px-4 py-6 lg:block">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          ICM Empresarial
        </p>
        <p className="mt-2 text-sm text-muted">
          {profile.empresa?.nombre ?? "Administración"}
        </p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            className="block rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}

        {profile.rol === "profesora_admin" ? (
          <Link
            className="block rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            href="/admin"
          >
            Admin
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}
