import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";

type AppShellProps = {
  children: React.ReactNode;
  profile: ProfileWithEmpresa;
};

function formatSuspensionUntil(value: string | null) {
  if (!value) {
    return "sin fecha de finalización";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function AppShell({ children, profile }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f7fb] lg:flex">
      <Sidebar profile={profile} />
      <div className="min-w-0 flex-1">
        <Topbar profile={profile} />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          {profile.estado === "suspendido" ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm">
              Usuario suspendido: podés consultar información, pero no podés
              enviar mensajes, responder, iniciar trámites, editar datos ni
              operar facturas. Motivo:{" "}
              {profile.suspendido_motivo ?? "sin motivo informado"}. Vigencia:{" "}
              {formatSuspensionUntil(profile.suspendido_hasta)}.
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
