import { redirect } from "next/navigation";
import { AdminUsersList } from "@/components/admin/usuarios/AdminUsersList";
import { AppShell } from "@/components/layout/AppShell";
import { getAdminUsers } from "@/lib/admin/usuarios/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function AdminUsuariosPage() {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  const users = await getAdminUsers();
  const suspendidos = users.filter((user) => user.estado === "suspendido").length;
  const reincidentes = users.filter(
    (user) => user.conducta_estado === "reincidente"
  ).length;

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section>
          <p className="text-sm font-medium text-brand">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            Gestión de usuarios
          </h1>
          <p className="mt-2 text-sm text-muted">
            Supervisá estados de cuenta, suspensiones y bajas sin eliminar
            historial.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs text-muted">Usuarios</p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {users.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs text-muted">Suspendidos</p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {suspendidos}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs text-muted">Reincidentes</p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {reincidentes}
              </p>
            </div>
          </div>
        </section>
        <AdminUsersList users={users} />
      </div>
    </AppShell>
  );
}
