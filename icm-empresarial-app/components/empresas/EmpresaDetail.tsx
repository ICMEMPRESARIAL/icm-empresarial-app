import Link from "next/link";
import { ClipboardCheck, Mail } from "lucide-react";
import { EmpresaAvatar } from "@/components/empresas/EmpresaAvatar";
import { EmpresaTypeBadge } from "@/components/empresas/EmpresaTypeBadge";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { SectionCard } from "@/components/ui/SectionCard";
import type { Empresa } from "@/lib/empresas/types";

type EmpresaDetailProps = {
  empresa: Empresa;
};

function figuraLabel(value: Empresa["figura_legal"]) {
  if (value === "monotributo") {
    return "Monotributo";
  }

  if (value === "sas") {
    return "SAS";
  }

  if (value === "organismo_publico") {
    return "Organismo público";
  }

  if (value === "banco") {
    return "Banco";
  }

  return "Sin figura legal";
}

function DetailItem({
  label,
  value
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-ink">{label}</dt>
      <dd className="mt-1 text-sm text-muted">{value || "Sin informar"}</dd>
    </div>
  );
}

export function EmpresaDetail({ empresa }: EmpresaDetailProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div
          className="h-44 bg-brand"
          style={{
            backgroundColor: empresa.color_marca ?? "#1f4f8f",
            backgroundImage: empresa.banner_url
              ? `url(${empresa.banner_url})`
              : undefined,
            backgroundPosition: "center",
            backgroundSize: "cover"
          }}
        />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <EmpresaAvatar className="h-24 w-24 rounded-2xl" empresa={empresa} />
              <div className="pb-1">
                <div className="flex flex-wrap gap-2">
                  <EmpresaTypeBadge tipo={empresa.tipo} />
                  <Badge tone="blue">{figuraLabel(empresa.figura_legal)}</Badge>
                  <Badge tone={empresa.activo ? "green" : "red"}>
                    {empresa.activo ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <h1 className="mt-3 text-3xl font-semibold text-ink">
                  {empresa.nombre_comercial ?? empresa.nombre}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {empresa.slogan ?? empresa.rubro ?? "Ficha interna"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              {empresa.tipo === "organismo" ? (
                <ActionButton
                  href={`/organismos/${empresa.slug}/tramites`}
                  icon={<ClipboardCheck className="h-4 w-4" />}
                >
                  Ver trámites
                </ActionButton>
              ) : null}
              <ActionButton
                href="/buzon/nuevo"
                icon={<Mail className="h-4 w-4" />}
                variant="secondary"
              >
                Enviar mensaje
              </ActionButton>
            </div>
          </div>
        </div>
      </section>

      <SectionCard title="Presentación interna">
        <p className="whitespace-pre-line text-sm leading-6 text-muted">
          {empresa.descripcion ?? "Sin descripción interna cargada."}
        </p>
      </SectionCard>

      <SectionCard title="Datos operativos">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Razón social" value={empresa.razon_social} />
          <DetailItem label="Nombre comercial" value={empresa.nombre_comercial} />
          <DetailItem label="Rubro" value={empresa.rubro} />
          <DetailItem label="Figura legal" value={figuraLabel(empresa.figura_legal)} />
          <DetailItem label="CUIT simulado" value={empresa.cuit_simulado} />
          <DetailItem label="Domicilio" value={empresa.domicilio} />
          <DetailItem
            label="Actividad principal"
            value={empresa.actividad_principal}
          />
          <DetailItem label="Responsable" value={empresa.responsable} />
          <DetailItem
            label="Socio responsable"
            value={empresa.socio_responsable}
          />
          <DetailItem
            label="Persona jurídica"
            value={empresa.persona_juridica}
          />
          <DetailItem
            label="Curso y división"
            value={
              empresa.curso_anio && empresa.curso_division
                ? `${empresa.curso_anio}° ${empresa.curso_division}`
                : null
            }
          />
          <DetailItem
            label="Contacto"
            value={empresa.contacto_email ?? empresa.contacto_telefono}
          />
        </dl>
      </SectionCard>

      {empresa.integrantes.length > 0 ? (
        <SectionCard title="Integrantes">
          <div className="grid gap-3 md:grid-cols-2">
            {empresa.integrantes.map((integrante, index) => (
              <div
                className="rounded-lg border border-border bg-surface p-3"
                key={`${integrante.nombre}-${index}`}
              >
                <p className="text-sm font-semibold text-ink">
                  {integrante.nombre}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {integrante.rol || "Rol no informado"}
                </p>
                {integrante.email ? (
                  <p className="mt-1 text-xs text-muted">{integrante.email}</p>
                ) : null}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {empresa.sitio_externo ? (
        <SectionCard title="Referencia externa">
          <p className="text-sm text-muted">
            El sitio externo queda solo como referencia histórica. La operación
            principal sucede dentro de ICM Empresarial.
          </p>
          <Link
            className="mt-3 inline-flex text-sm font-medium text-brand hover:underline"
            href={empresa.sitio_externo}
          >
            Ver referencia
          </Link>
        </SectionCard>
      ) : null}
    </div>
  );
}
