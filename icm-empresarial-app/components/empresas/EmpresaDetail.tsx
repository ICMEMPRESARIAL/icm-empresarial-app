import { Card } from "@/components/ui/Card";
import { EmpresaTypeBadge } from "@/components/empresas/EmpresaTypeBadge";
import type { Empresa } from "@/lib/empresas/types";

type EmpresaDetailProps = {
  empresa: Empresa;
};

export function EmpresaDetail({ empresa }: EmpresaDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand">Ficha interna</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">
              {empresa.nombre}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {empresa.rubro ?? "Rubro no informado"}
            </p>
          </div>
          <EmpresaTypeBadge tipo={empresa.tipo} />
        </div>

        <div
          className="mt-6 h-2 rounded-full"
          style={{ backgroundColor: empresa.color_marca ?? "#1f4f8f" }}
        />
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Informacion interna</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
          {empresa.descripcion ?? "Sin descripcion interna cargada."}
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-ink">Datos operativos</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-ink">Slug</dt>
            <dd className="mt-1 text-muted">{empresa.slug}</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Estado</dt>
            <dd className="mt-1 text-muted">
              {empresa.activo ? "Activa" : "Inactiva"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Visible en directorio</dt>
            <dd className="mt-1 text-muted">
              {empresa.visible_en_directorio ? "Si" : "No"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Sitio externo</dt>
            <dd className="mt-1 text-muted">
              {empresa.sitio_externo ?? "Solo referencia interna"}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
