"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type Integrante = {
  nombre: string;
  email: string;
  rol: string;
};

type OnboardingFormProps = {
  empresaId: string;
  empresaNombre: string;
  tipo: "servicio" | "bien" | "organismo";
  subtipoEntidad: string | null;
  initialEmail: string | null;
  initialTelefono: string | null;
  initialResponsable: string | null;
  initialSocioResponsable: string | null;
  initialCursoAnio: string | null;
  initialCursoDivision: string | null;
  initialIntegrantes: Integrante[];
  initialLogoUrl: string | null;
};

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
const maxFileSize = 5 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
}

function labelTipo(tipo: string, subtipo: string | null) {
  if (subtipo === "empresa_bienes") return "Empresa de bienes";
  if (subtipo === "empresa_servicios") return "Empresa de servicios";
  if (subtipo === "arca") return "ARCA";
  if (subtipo === "arba") return "ARBA";
  if (subtipo === "banco") return "Banco";
  if (subtipo === "municipalidad") return "Municipalidad";
  if (subtipo === "sindicato") return "Sindicato";
  if (subtipo === "dppj") return "DPPJ";
  if (subtipo === "secretaria_trabajo") return "Secretaría de Trabajo";
  if (subtipo === "administracion_icm") return "Administración ICM";
  if (tipo === "bien") return "Empresa de bienes";
  if (tipo === "servicio") return "Empresa de servicios";
  return "Organismo";
}

export function OnboardingForm(props: OnboardingFormProps) {
  const router = useRouter();
  const escolar = props.tipo === "bien" || props.tipo === "servicio";
  const [integrantes, setIntegrantes] = useState<Integrante[]>(
    props.initialIntegrantes.length
      ? props.initialIntegrantes
      : [{ nombre: "", email: "", rol: "" }]
  );
  const [logoUrl, setLogoUrl] = useState(props.initialLogoUrl ?? "");
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateIntegrante(index: number, field: keyof Integrante, value: string) {
    setIntegrantes((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  async function uploadLogo(file: File) {
    setLogoMessage(null);
    if (!allowedTypes.includes(file.type)) {
      setLogoMessage("Usá PNG, JPG o WebP.");
      return;
    }
    if (file.size > maxFileSize) {
      setLogoMessage("El logo debe pesar hasta 5 MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = `${props.empresaId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setLogoMessage(`No se pudo subir el logo: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setLogoMessage("Logo listo para guardar.");
    setUploading(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanIntegrantes = integrantes.map((item) => ({
      nombre: item.nombre.trim(),
      email: item.email.trim().toLowerCase(),
      rol: item.rol.trim()
    }));

    if (
      cleanIntegrantes.length < 1 ||
      cleanIntegrantes.some((item) => !item.nombre || !item.email || !item.rol)
    ) {
      setError("Completá nombre, email y rol de todos los integrantes.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const contactoEmail = String(form.get("contacto_email") ?? "").trim();
    const cursoAnio = String(form.get("curso_anio") ?? "").trim();
    const cursoDivision = String(form.get("curso_division") ?? "").trim();

    if (!contactoEmail) {
      setError("Ingresá un email de contacto.");
      return;
    }
    if (escolar && (!cursoAnio || !cursoDivision)) {
      setError("Año y división son obligatorios para empresas de bienes y servicios.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("completar_mi_onboarding", {
      p_integrantes: cleanIntegrantes,
      p_curso_anio: escolar ? cursoAnio : null,
      p_curso_division: escolar ? cursoDivision : null,
      p_contacto_email: contactoEmail,
      p_contacto_telefono: String(form.get("contacto_telefono") ?? "").trim() || null,
      p_responsable: String(form.get("responsable") ?? "").trim() || null,
      p_socio_responsable: String(form.get("socio_responsable") ?? "").trim() || null,
      p_logo_url: logoUrl || null
    });

    if (rpcError) {
      setError(rpcError.message);
      setSubmitting(false);
      return;
    }

    router.replace("/bienvenida");
    router.refresh();
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-border bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">Entidad asignada</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">{props.empresaNombre}</h2>
        <p className="mt-1 text-sm text-muted">{labelTipo(props.tipo, props.subtipoEntidad)}</p>
        <p className="mt-3 text-xs text-muted">El tipo de entidad viene definido por ICM Empresarial y no puede cambiarse desde esta pantalla.</p>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Identidad visual</h2>
        <p className="mt-1 text-sm text-muted">Subí el logo que identificará a tu entidad dentro del buzón.</p>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`Logo de ${props.empresaNombre}`} className="mt-4 h-24 w-24 rounded-2xl border border-border object-cover" src={logoUrl} />
        ) : null}
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface">
          <Upload className="h-4 w-4" />
          {uploading ? "Subiendo..." : "Subir logo"}
          <input
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadLogo(file);
            }}
            type="file"
          />
        </label>
        {logoMessage ? <p className="mt-2 text-xs text-muted">{logoMessage}</p> : null}
      </section>

      <section className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Integrantes</h2>
            <p className="mt-1 text-sm text-muted">Cargá a todas las personas que integran la entidad.</p>
          </div>
          <Button
            onClick={() => setIntegrantes((items) => [...items, { nombre: "", email: "", rol: "" }])}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />Agregar
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          {integrantes.map((integrante, index) => (
            <div className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-[1fr_1fr_1fr_auto]" key={index}>
              <input className="h-11 rounded-lg border border-border px-3 text-sm" onChange={(e) => updateIntegrante(index, "nombre", e.target.value)} placeholder="Nombre y apellido" required value={integrante.nombre} />
              <input className="h-11 rounded-lg border border-border px-3 text-sm" onChange={(e) => updateIntegrante(index, "email", e.target.value)} placeholder="Email" required type="email" value={integrante.email} />
              <input className="h-11 rounded-lg border border-border px-3 text-sm" onChange={(e) => updateIntegrante(index, "rol", e.target.value)} placeholder="Rol o cargo" required value={integrante.rol} />
              <button
                aria-label="Eliminar integrante"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface disabled:opacity-40"
                disabled={integrantes.length === 1}
                onClick={() => setIntegrantes((items) => items.filter((_, i) => i !== index))}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Datos de contacto</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-ink">Email de contacto
            <input className="mt-2 h-11 w-full rounded-lg border border-border px-3 text-sm" defaultValue={props.initialEmail ?? ""} name="contacto_email" required type="email" />
          </label>
          <label className="text-sm font-medium text-ink">Teléfono
            <input className="mt-2 h-11 w-full rounded-lg border border-border px-3 text-sm" defaultValue={props.initialTelefono ?? ""} name="contacto_telefono" type="tel" />
          </label>
          <label className="text-sm font-medium text-ink">Responsable
            <input className="mt-2 h-11 w-full rounded-lg border border-border px-3 text-sm" defaultValue={props.initialResponsable ?? ""} name="responsable" />
          </label>
          <label className="text-sm font-medium text-ink">Socio responsable
            <input className="mt-2 h-11 w-full rounded-lg border border-border px-3 text-sm" defaultValue={props.initialSocioResponsable ?? ""} name="socio_responsable" />
          </label>
        </div>
      </section>

      {escolar ? (
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Curso</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-ink">Año
              <select className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm" defaultValue={props.initialCursoAnio ?? ""} name="curso_anio" required>
                <option value="">Seleccionar</option>
                <option value="4">4°</option>
                <option value="5">5°</option>
                <option value="6">6°</option>
              </select>
            </label>
            <label className="text-sm font-medium text-ink">División
              <select className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm" defaultValue={props.initialCursoDivision ?? ""} name="curso_division" required>
                <option value="">Seleccionar</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </label>
          </div>
        </section>
      ) : null}

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

      <div className="flex justify-end">
        <Button disabled={submitting || uploading} type="submit">
          {submitting ? "Guardando..." : "Finalizar configuración"}
        </Button>
      </div>
    </form>
  );
}
