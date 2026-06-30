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
    q?: string;
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
  const search = params.q?.trim() ?? "";
  const items = await getAllCorrespondenciaForAdmin(filter, search);

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

        <form className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <input name="filter" type="hidden" value={filter} />
          <label className="block text-sm font-medium text-ink">
            Buscar
            <input
              className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              defaultValue={search}
              name="q"
              placeholder="Buscar por asunto, remitente o destinatario"
              type="search"
            />
          </label>
        </form>

        <AdminCorrespondenciaFilters activeFilter={filter} search={search} />
        <AdminCorrespondenciaList items={items} />
      </div>
    </AppShell>
  );
}
