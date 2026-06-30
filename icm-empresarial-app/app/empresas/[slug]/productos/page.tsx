import { notFound } from "next/navigation";
import { EmpresaProductoCard } from "@/components/empresa-site/EmpresaProductoCard";
import { EmpresaSiteLayout } from "@/components/empresa-site/EmpresaSiteLayout";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { getEmpresaSiteDataBySlug } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EmpresaProductosPage({ params }: PageProps) {
  const { profile } = await requireAuth();
  const { slug } = await params;
  const data = await getEmpresaSiteDataBySlug(slug, profile);

  if (!data) notFound();

  return (
    <AppShell profile={profile}>
      <EmpresaSiteLayout active="productos" empresa={data.empresa} web={data.web}>
        <SectionCard
          description="Productos y servicios activos publicados por la empresa."
          title="Productos y servicios"
        >
          {data.productos.length === 0 ? (
            <p className="text-sm text-muted">
              Esta empresa todavía no publicó productos o servicios.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.productos.map((producto) => (
                <EmpresaProductoCard
                  empresaSlug={data.empresa.slug}
                  key={producto.id}
                  producto={producto}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </EmpresaSiteLayout>
    </AppShell>
  );
}
