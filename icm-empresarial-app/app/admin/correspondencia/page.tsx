import { redirect } from "next/navigation";
import { AdminCorrespondenciaFilters } from "@/components/admin/correspondencia/AdminCorrespondenciaFilters";
import { AdminCorrespondenciaList } from "@/components/admin/correspondencia/AdminCorrespondenciaList";
import { AppShell } from "@/components/layout/AppShell";
import {
  getAllCorrespondenciaForAdmin,
  normalizeAdminCorrespondenciaFilter
} from "@/lib/admin/correspondencia/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type AdminCorrespondenciaPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

export default async function AdminCorrespondenciaPage({
  searchParams
}: AdminCorrespondenciaPageProps) {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const filter = normalizeAdminCorrespondenciaFilter(params.filter);
  const items = await getAllCorrespondenciaForAdmin(filter);

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <section>
          <p className="text-sm font-medium text-brand">Administración</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            Correspondencia
          </h1>
          <p className="mt-2 text-sm text-muted">
            Supervisión global de mensajes, reportes y contenido oculto.
          </p>
        </section>

        <AdminCorrespondenciaFilters activeFilter={filter} />
        <AdminCorrespondenciaList items={items} />
      </div>
    </AppShell>
  );
}
