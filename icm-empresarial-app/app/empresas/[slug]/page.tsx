import { notFound } from "next/navigation";
import { EmpresaDetail } from "@/components/empresas/EmpresaDetail";
import { AppShell } from "@/components/layout/AppShell";
import { getEmpresaBySlug } from "@/lib/empresas/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type EmpresaSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EmpresaSlugPage({ params }: EmpresaSlugPageProps) {
  const { profile } = await requireAuth();
  const { slug } = await params;
  const empresa = await getEmpresaBySlug(slug, ["servicio", "bien"], profile);

  if (!empresa) {
    notFound();
  }

  return (
    <AppShell profile={profile}>
      <EmpresaDetail empresa={empresa} />
    </AppShell>
  );
}
