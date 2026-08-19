import { redirect } from "next/navigation";
import { toggleProductoActivoAction } from "@/lib/empresa-site/actions";
import { ProductoEditor } from "@/components/empresa-site/ProductoEditor";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { getCurrentEmpresaSiteData } from "@/lib/empresa-site/queries";
import { requireAuth } from "@/lib/auth/require-auth";
import { redirectEmpresaFromOperationalRoute } from "@/lib/auth/route-access";

export default async function PerfilEmpresaProductosPage() {
  const { profile } = await requireAuth();
  redirectEmpresaFromOperationalRoute(profile);

  const data = await getCurrentEmpresaSiteData();

  if (!data) {
    redirect("/perfil-empresa");
  }

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          description="Publicá productos y servicios para que otras empresas puedan consultar o contratar."
          eyebrow="Perfil de empresa"
          title="Productos y servicios"
        />
        <SectionCard title="Nuevo producto o servicio">
          <ProductoEditor empresa={data.empresa} />
        </SectionCard>
        <SectionCard title="Publicaciones actuales">
          {data.productos.length === 0 ? (
            <p className="text-sm text-muted">Todavía no hay productos o servicios.</p>
          ) : (
            <div className="space-y-3">
              {data.productos.map((producto) => (
                <div
                  className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={producto.id}
                >
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={producto.tipo === "producto" ? "blue" : "green"}>
                        {producto.tipo}
                      </Badge>
                      <Badge tone={producto.activo ? "green" : "gray"}>
                        {producto.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {producto.nombre}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {producto.categoria ?? "Sin categoría"}
                    </p>
                  </div>
                  <form action={toggleProductoActivoAction}>
                    <input name="empresa_id" type="hidden" value={data.empresa.id} />
                    <input name="producto_id" type="hidden" value={producto.id} />
                    <input
                      name="activo"
                      type="hidden"
                      value={producto.activo ? "false" : "true"}
                    />
                    <Button type="submit" variant="secondary">
                      {producto.activo ? "Desactivar" : "Activar"}
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
