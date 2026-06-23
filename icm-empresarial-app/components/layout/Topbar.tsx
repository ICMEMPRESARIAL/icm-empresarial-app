import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";

type TopbarProps = {
  profile: ProfileWithEmpresa;
};

export function Topbar({ profile }: TopbarProps) {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      <div>
        <p className="text-sm font-medium text-ink">{profile.nombre}</p>
        <p className="text-xs text-muted">{profile.rol}</p>
      </div>
      <div className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted">
        {profile.empresa?.nombre ?? "Sin empresa"}
      </div>
    </header>
  );
}
