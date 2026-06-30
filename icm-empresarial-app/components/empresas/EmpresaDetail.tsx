import Link from "next/link";
import {
  ArrowLeft,
  AtSign,
  ClipboardCheck,
  ExternalLink,
  Mail
} from "lucide-react";
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
  if (value === "monotributo") return "Monotributo";
  if (value === "sas") return "SAS";
  if (value === "organismo_publico") return "Organismo público";
  if (value === "banco") return "Banco";
  return "Dato pendiente";
}

function DetailItem({
  label,
  value
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-ink">
        {value || "Este dato todavía no fue cargado."}
      </dd>
    </div>
  );
}

function normalizeExternalHref(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

export function EmpresaDetail({ empresa }: EmpresaDetailProps) {
  const displayName = empresa.nombre_comercial ?? empresa.nombre;
  const curso =
    empresa.curso_anio && empresa.curso_division
      ? `${empresa.curso_anio}° ${empresa.curso_division}`
      : null;
  const gradient = `linear-gradient(135deg, ${
    empresa.color_marca ?? "#1f4f8f"
  }, #0ea5e9 58%, #14b8a6)`;
  const sitioHref = empresa.sitio_web
    ? normalizeExternalHref(empresa.sitio_web)
    : null;
  const instagramHref = empresa.instagram
    ? normalizeExternalHref(
        empresa.instagram.startsWith("@")
          ? `instagram.com/${empresa.instagram.slice(1)}`
          : empresa.instagram
      )
    : null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
        <div
          className="relative min-h-72"
          style={{
            backgroundImage: empresa.banner_url
              ? `linear-gradient(90deg, rgba(15,23,42,0.78), rgba(15,23,42,0.22)), url(${empresa.banner_url})`
              : gradient,
            backgroundPosition: "center",
            backgroundSize: "cover"
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_30%)]" />
          <div className="relative flex min-h-72 flex-col justify-end p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <EmpresaAvatar
                  className="h-28 w-28 rounded-3xl border-4 border-white/80"
                  empresa={empresa}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <EmpresaTypeBadge tipo={empresa.tipo} />
                    <Badge tone="blue">{figuraLabel(empresa.figura_legal)}</Badge>
                    <Badge tone={empresa.activo ? "green" : "red"}>
                      {empresa.activo ? "Activa" : "Inactiva"}
                    </Badge>
                    {curso ? <Badge tone="gray">{curso}</Badge> : null}
                  </div>
                  <h1 className="mt-4 text-4xl font-semibold text-white">
                    {displayName}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                    {empresa.slogan ??
                      empresa.descripcion ??
                      "Empresa interna de la simulación ICM Empresarial."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
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
        </div>
      </section>

      <SectionCard title="Presentación interna">
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="whitespace-pre-line text-sm leading-7 text-muted">
              {empresa.descripcion ??
                "Esta empresa todavía no cargó una descripción interna."}
            </p>
          </div>
          <div className="grid gap-3">
            <DetailItem label="Rubro" value={empresa.rubro} />
            <DetailItem
              label="Actividad principal"
              value={empresa.actividad_principal}
            />
            <DetailItem label="Responsable" value={empresa.responsable} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Datos operativos">
        <dl className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Razón social" value={empresa.razon_social} />
          <DetailItem label="Nombre comercial" value={empresa.nombre_comercial} />
          <DetailItem label="Figura legal" value={figuraLabel(empresa.figura_legal)} />
          <DetailItem label="CUIT simulado" value={empresa.cuit_simulado} />
          <DetailItem label="Domicilio" value={empresa.domicilio} />
          <DetailItem
            label="Socio responsable"
            value={empresa.socio_responsable}
          />
          <DetailItem
            label="Persona jurídica"
            value={empresa.persona_juridica}
          />
          <DetailItem label="Curso y división" value={curso} />
          <DetailItem
            label="Contacto"
            value={empresa.contacto_email ?? empresa.contacto_telefono}
          />
        </dl>
      </SectionCard>

      <SectionCard title="Equipo">
        {empresa.integrantes.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {empresa.integrantes.map((integrante, index) => (
              <div
                className="rounded-2xl border border-border bg-white p-4 shadow-sm"
                key={`${integrante.nombre}-${index}`}
              >
                <p className="text-sm font-semibold text-ink">
                  {integrante.nombre}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {integrante.rol || "Rol pendiente"}
                </p>
                {integrante.email ? (
                  <p className="mt-3 text-xs text-muted">{integrante.email}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-muted">
            Aún no se cargaron integrantes.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Acciones">
        <div className="flex flex-wrap gap-3">
          <ActionButton
            href="/buzon/nuevo"
            icon={<Mail className="h-4 w-4" />}
          >
            Enviar mensaje
          </ActionButton>
          {empresa.tipo === "organismo" ? (
            <ActionButton
              href={`/organismos/${empresa.slug}/tramites`}
              icon={<ClipboardCheck className="h-4 w-4" />}
              variant="secondary"
            >
              Iniciar trámite
            </ActionButton>
          ) : null}
          <ActionButton
            href={empresa.tipo === "organismo" ? "/organismos" : "/empresas"}
            icon={<ArrowLeft className="h-4 w-4" />}
            variant="secondary"
          >
            Volver al directorio
          </ActionButton>
          {sitioHref ? (
            <ActionButton
              href={sitioHref}
              icon={<ExternalLink className="h-4 w-4" />}
              target="_blank"
              variant="secondary"
            >
              Sitio web
            </ActionButton>
          ) : null}
          {instagramHref ? (
            <ActionButton
              href={instagramHref}
              icon={<AtSign className="h-4 w-4" />}
              target="_blank"
              variant="secondary"
            >
              Instagram
            </ActionButton>
          ) : null}
        </div>
      </SectionCard>

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
