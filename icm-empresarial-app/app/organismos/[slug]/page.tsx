import { notFound } from "next/navigation";
import { EmpresaDetail } from "@/components/empresas/EmpresaDetail";
import { AppShell } from "@/components/layout/AppShell";
import { getEmpresaBySlug } from "@/lib/empresas/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type OrganismoSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function OrganismoSlugPage({
  params
}: OrganismoSlugPageProps) {
  const { profile } = await requireAuth();
  const { slug } = await params;
  const organismo = await getEmpresaBySlug(slug, "organismo", profile);

  if (!organismo) {
    notFound();
  }

  return (
    <AppShell profile={profile}>
      <EmpresaDetail empresa={organismo} />
    </AppShell>
  );
}
