import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";

type AppShellProps = {
  children: React.ReactNode;
  profile: ProfileWithEmpresa;
};

export function AppShell({ children, profile }: AppShellProps) {
  return (
    <div className="min-h-screen bg-surface lg:flex">
      <Sidebar profile={profile} />
      <div className="min-w-0 flex-1">
        <Topbar profile={profile} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
