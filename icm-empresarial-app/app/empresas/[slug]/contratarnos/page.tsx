import { notFound } from "next/navigation";
import { Mail } from "lucide-react";
import { EmpresaSiteLayout } from "@/components/empresa-site/EmpresaSiteLayout";
import { AppShell } from "@/components/layout/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { SectionCard } from "@/components/ui/SectionCard";
import { getEmpresaSiteDataBySlug } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EmpresaContratarnosPage({ params }: PageProps) {
  const { profile } = await requireAuth();
  const { slug } = await params;
  const data = await getEmpresaSiteDataBySlug(slug, profile);

  if (!data) notFound();

  return (
    <AppShell profile={profile}>
      <EmpresaSiteLayout active="contratarnos" empresa={data.empresa} web={data.web}>
        <SectionCard title="Contratarnos">
          <p className="whitespace-pre-line text-sm leading-7 text-muted">
            {data.web?.condiciones_contratacion ??
              "Esta empresa todavía no cargó condiciones de contratación."}
          </p>
          <div className="mt-5">
            <ActionButton
              href={`/buzon/nuevo?destinatario=${data.empresa.id}`}
              icon={<Mail className="h-4 w-4" />}
            >
              Enviar mensaje
            </ActionButton>
          </div>
        </SectionCard>
      </EmpresaSiteLayout>
    </AppShell>
  );
}
