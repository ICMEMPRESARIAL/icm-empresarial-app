import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ChatThread } from "@/components/buzon/ChatThread";
import {
  getCorrespondenciaById,
  getCorrespondenciaRespuestas
} from "@/lib/buzon/queries";
import { markCorrespondenciaAsReadOnOpen } from "@/lib/buzon/read-status";
import { requireAuth } from "@/lib/auth/require-auth";

type BuzonDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BuzonDetailPage({
  params
}: BuzonDetailPageProps) {
  const { profile } = await requireAuth();

  if (
    profile.rol !== "profesora_admin" &&
    profile.empresa &&
    !profile.empresa.onboarding_completo
  ) {
    redirect("/onboarding");
  }

  const { id } = await params;
  let mensaje = await getCorrespondenciaById(id);

  if (!mensaje) {
    notFound();
  }

  const isDestinatario = mensaje.destinatario_empresa_id === profile.empresa_id;

  if (
    mensaje.estado === "enviado" &&
    (isDestinatario || profile.rol === "profesora_admin")
  ) {
    const wasMarked = await markCorrespondenciaAsReadOnOpen(mensaje.id);

    if (wasMarked) {
      mensaje = {
        ...mensaje,
        estado: "leido",
        read_at: new Date().toISOString()
      };
    }
  }

  const respuestas = await getCorrespondenciaRespuestas(mensaje.id);

  return (
    <AppShell profile={profile}>
      <ChatThread mensaje={mensaje} profile={profile} respuestas={respuestas} />
    </AppShell>
  );
}
