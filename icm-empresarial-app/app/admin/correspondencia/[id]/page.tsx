import { notFound, redirect } from "next/navigation";
import { AdminCorrespondenciaDetail } from "@/components/admin/correspondencia/AdminCorrespondenciaDetail";
import { AppShell } from "@/components/layout/AppShell";
import {
  getAuditLogsForCorrespondencia,
  getCorrespondenciaByIdForAdmin
} from "@/lib/admin/correspondencia/queries";
import { getCorrespondenciaRespuestas } from "@/lib/buzon/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type AdminCorrespondenciaDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminCorrespondenciaDetailPage({
  params
}: AdminCorrespondenciaDetailPageProps) {
  const { profile } = await requireAuth();

  if (profile.rol !== "profesora_admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const mensaje = await getCorrespondenciaByIdForAdmin(id);

  if (!mensaje) {
    notFound();
  }

  const [respuestas, auditoria] = await Promise.all([
    getCorrespondenciaRespuestas(id),
    getAuditLogsForCorrespondencia(id)
  ]);

  return (
    <AppShell profile={profile}>
      <AdminCorrespondenciaDetail
        auditoria={auditoria}
        mensaje={mensaje}
        respuestas={respuestas}
      />
    </AppShell>
  );
}
