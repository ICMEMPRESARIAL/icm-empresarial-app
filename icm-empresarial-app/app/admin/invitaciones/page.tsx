import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BulkCompanyInvitesForm } from "@/components/admin/invitaciones/BulkCompanyInvitesForm";
import { InviteCompanyForm } from "@/components/admin/invitaciones/InviteCompanyForm";
import { InviteProfessorForm } from "@/components/admin/invitaciones/InviteProfessorForm";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  getCompanyInviteSummaries,
  isValidActivationEmail,
  normalizeActivationEmail,
  type InviteSummary
} from "@/lib/activation/invites";
import { createClient } from "@/lib/supabase/server";

export default async function AdminInvitacionesPage() {
  const { profile } = await requireAuth();
  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: empresas, error } = await supabase
    .from("empresas")
    .select("id,nombre,nombre_comercial,contacto_email,activo")
    .eq("activo", true)
    .order("nombre");

  if (error) {
    throw new Error(`No se pudieron cargar las empresas: ${error.message}`);
  }

  const inviteSummaries = await getCompanyInviteSummaries();
  const latestInviteByEmpresa = new Map<string, InviteSummary>();
  inviteSummaries
    .filter((invite) => invite.rol === "empresa")
    .forEach((invite) => {
      if (invite.empresa_id && !latestInviteByEmpresa.has(invite.empresa_id)) {
        latestInviteByEmpresa.set(invite.empresa_id, invite);
      }
    });
  const rows = (empresas ?? []).map((empresa) => {
    const latestInvite = latestInviteByEmpresa.get(empresa.id as string);
    return {
      contacto_email: empresa.contacto_email as string | null,
      id: empresa.id as string,
      invite_sent_at: latestInvite?.sent_at ?? null,
      invite_status: latestInvite?.send_status ?? null,
      invite_used_at: latestInvite?.used_at ?? null,
      nombre:
        (empresa.nombre_comercial as string | null) ?? (empresa.nombre as string)
    };
  });
  const readyCount = rows.filter((empresa) =>
    isValidActivationEmail(
      empresa.contacto_email
        ? normalizeActivationEmail(empresa.contacto_email)
        : null
    )
  ).length;

  return (
    <AppShell profile={profile}>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-medium text-brand">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Invitaciones</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Las invitaciones usan enlaces propios de ICM. El usuario crea su
            contraseña desde /activar y entra con sesión normal de email y clave.
          </p>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">Invitar profesora</h2>
            <p className="mt-1 text-sm text-muted">
              Para sumar otra cuenta docente con acceso administrativo.
            </p>
          </div>
          <InviteProfessorForm />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">Empresas</h2>
            <p className="mt-1 text-sm text-muted">
              Primero probá con una empresa de prueba. Después enviá el lote
              cuando Preview esté verde.
            </p>
          </div>
          <BulkCompanyInvitesForm readyCount={readyCount} totalCount={rows.length} />
          <div className="space-y-3">
            {rows.map((empresa) => (
              <InviteCompanyForm empresa={empresa} key={empresa.id} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
