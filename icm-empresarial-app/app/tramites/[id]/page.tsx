import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TramiteDetail } from "@/components/tramites/TramiteDetail";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  getTramiteAdjuntos,
  getTramiteById,
  getTramiteComentarios,
  getTramiteEventos
} from "@/lib/tramites/queries";

type TramiteDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TramiteDetailPage({
  params
}: TramiteDetailPageProps) {
  const { profile } = await requireAuth();
  const { id } = await params;
  const tramite = await getTramiteById(id);

  if (!tramite) {
    notFound();
  }

  const [eventos, comentarios, adjuntos] = await Promise.all([
    getTramiteEventos(id),
    getTramiteComentarios(id),
    getTramiteAdjuntos(id)
  ]);

  return (
    <AppShell profile={profile}>
      <TramiteDetail
        adjuntos={adjuntos}
        comentarios={comentarios}
        eventos={eventos}
        profile={profile}
        tramite={tramite}
      />
    </AppShell>
  );
}
