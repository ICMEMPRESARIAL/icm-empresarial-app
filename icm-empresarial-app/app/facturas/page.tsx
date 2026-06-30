import { ActionButton } from "@/components/ui/ActionButton";
import { AppShell } from "@/components/layout/AppShell";
import { FacturaList } from "@/components/facturas/FacturaList";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  getFacturasForCurrentUser,
  type FacturaFilter
} from "@/lib/facturas/queries";

type PageProps = {
  searchParams: Promise<{ filtro?: FacturaFilter }>;
};

const filtros: { href: string; label: string }[] = [
  { href: "/facturas", label: "Todas" },
  { href: "/facturas?filtro=emitidas", label: "Emitidas" },
  { href: "/facturas?filtro=recibidas", label: "Recibidas" },
  { href: "/facturas?filtro=pendientes_pago", label: "Pendientes de pago" },
  {
    href: "/facturas?filtro=pendientes_regisoft",
    label: "Pendiente Regisoft"
  }
];

export default async function FacturasPage({ searchParams }: PageProps) {
  const { profile } = await requireAuth();
  const { filtro = "todos" } = await searchParams;
  const facturas = await getFacturasForCurrentUser(filtro);

  return (
    <AppShell profile={profile}>
      <div className="space-y-6">
        <PageHeader
          actions={<ActionButton href="/facturas/nueva">Nueva factura</ActionButton>}
          description="Emití facturas simuladas, registrá pagos y marcá movimientos cargados en Regisoft."
          eyebrow="Facturación"
          title="Facturas y pagos"
        />
        <div className="flex flex-wrap gap-2">
          {filtros.map((item) => (
            <ActionButton href={item.href} key={item.href} variant="secondary">
              {item.label}
            </ActionButton>
          ))}
        </div>
        <SectionCard title="Facturas">
          <FacturaList facturas={facturas} />
        </SectionCard>
      </div>
    </AppShell>
  );
}
