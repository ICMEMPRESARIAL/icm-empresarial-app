import { redirect } from "next/navigation";
import { SolicitudesList } from "@/components/admin/solicitudes/SolicitudesList";
import { AppShell } from "@/components/layout/AppShell";
import { getSolicitudesRegistro } from "@/lib/admin/solicitudes/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function AdminSolicitudesPage() {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  const solicitudes = await getSolicitudesRegistro();

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section>
          <p className="text-sm font-medium text-brand">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            Solicitudes de registro
          </h1>
          <p className="mt-2 text-sm text-muted">
            Revisá altas de alumnos y activá empresas, organismos o bancos
            internos.
          </p>
        </section>
        <SolicitudesList solicitudes={solicitudes} />
      </div>
    </AppShell>
  );
}
