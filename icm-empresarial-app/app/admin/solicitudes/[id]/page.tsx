import { notFound, redirect } from "next/navigation";
import { SolicitudDetail } from "@/components/admin/solicitudes/SolicitudDetail";
import { AppShell } from "@/components/layout/AppShell";
import { getSolicitudRegistroById } from "@/lib/admin/solicitudes/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type AdminSolicitudDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminSolicitudDetailPage({
  params
}: AdminSolicitudDetailPageProps) {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const solicitud = await getSolicitudRegistroById(id);

  if (!solicitud) {
    notFound();
  }

  return (
    <AppShell profile={profile}>
      <SolicitudDetail solicitud={solicitud} />
    </AppShell>
  );
}
