import { redirect } from "next/navigation";
import { NuevaFacturaForm } from "@/components/facturas/NuevaFacturaForm";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDestinatariosFactura } from "@/lib/facturas/queries";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function NuevaFacturaPage() {
  const { profile } = await requireAuth();

  if (profile.estado !== "activo" || !profile.empresa_id) {
    redirect("/facturas");
  }

  const destinatarios = await getDestinatariosFactura();

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="La empresa emisora se toma automáticamente desde tu perfil."
          eyebrow="Facturación"
          title="Nueva factura simulada"
        />
        <NuevaFacturaForm destinatarios={destinatarios} />
      </div>
    </AppShell>
  );
}
