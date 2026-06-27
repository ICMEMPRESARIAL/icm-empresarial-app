"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type TipoEntidad = "bien" | "servicio" | "organismo" | "banco";
type FiguraLegal = "monotributo" | "sas" | "organismo_publico" | "banco";

const figuraByTipo: Record<TipoEntidad, FiguraLegal> = {
  banco: "banco",
  bien: "monotributo",
  organismo: "organismo_publico",
  servicio: "sas"
};

const labelByFigura: Record<FiguraLegal, string> = {
  banco: "Banco",
  monotributo: "Monotributo",
  organismo_publico: "Organismo público",
  sas: "SAS"
};

export function RegistroForm() {
  const router = useRouter();
  const [tipoEntidad, setTipoEntidad] = useState<TipoEntidad>("bien");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const figuraLegal = useMemo(() => figuraByTipo[tipoEntidad], [tipoEntidad]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nombreAlumno = String(formData.get("nombre_alumno") ?? "").trim();
    const nombreEntidad = String(formData.get("nombre_entidad") ?? "").trim();
    const responsable = String(formData.get("responsable") ?? "").trim();
    const socioMayor = String(formData.get("socio_mayor") ?? "").trim();
    const cargoResponsable = String(
      formData.get("cargo_responsable") ?? ""
    ).trim();

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      setIsSubmitting(false);
      return;
    }

    if (!nombreAlumno || !email || !nombreEntidad) {
      setErrorMessage("Completá los datos obligatorios.");
      setIsSubmitting(false);
      return;
    }

    if (tipoEntidad === "bien" && !socioMayor) {
      setErrorMessage("Para empresas de bienes indicá el socio mayor.");
      setIsSubmitting(false);
      return;
    }

    if (tipoEntidad === "servicio" && !responsable) {
      setErrorMessage("Para empresas de servicios indicá el responsable.");
      setIsSubmitting(false);
      return;
    }

    if (
      (tipoEntidad === "organismo" || tipoEntidad === "banco") &&
      (!responsable || !cargoResponsable)
    ) {
      setErrorMessage("Indicá responsable y cargo para organismos o bancos.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      options: {
        data: {
          actividad_principal: String(
            formData.get("actividad_principal") ?? ""
          ).trim(),
          cargo_responsable: cargoResponsable,
          cuit_simulado: String(formData.get("cuit_simulado") ?? "").trim(),
          curso: String(formData.get("curso") ?? "").trim(),
          descripcion: String(formData.get("descripcion") ?? "").trim(),
          domicilio: String(formData.get("domicilio") ?? "").trim(),
          email,
          figura_legal: figuraLegal,
          nombre_alumno: nombreAlumno,
          nombre_entidad: nombreEntidad,
          responsable,
          rubro: String(formData.get("rubro") ?? "").trim(),
          socio_mayor: socioMayor,
          telefono: String(formData.get("telefono") ?? "").trim(),
          tipo_entidad: tipoEntidad
        }
      },
      password
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/pendiente-aprobacion");
    router.refresh();
  }

  return (
    <Card>
      <form className="space-y-8" onSubmit={handleSubmit}>
        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-brand">Datos del alumno</p>
            <p className="mt-1 text-sm text-muted">
              Usá tu Gmail y una contraseña propia para entrar a la plataforma.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre y apellido" name="nombre_alumno" required />
            <Input label="Gmail" name="email" required type="email" />
            <Input label="Contraseña" name="password" required type="password" />
            <Input label="Curso" name="curso" />
            <Input label="Teléfono" name="telefono" />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-brand">Entidad simulada</p>
            <p className="mt-1 text-sm text-muted">
              La profesora revisará estos datos antes de activar la cuenta.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre de empresa u organismo" name="nombre_entidad" required />
            <label className="block text-sm font-medium text-ink">
              Tipo
              <select
                className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                name="tipo_entidad"
                onChange={(event) =>
                  setTipoEntidad(event.target.value as TipoEntidad)
                }
                value={tipoEntidad}
              >
                <option value="bien">Empresa de bienes</option>
                <option value="servicio">Empresa de servicios</option>
                <option value="organismo">Organismo gubernamental</option>
                <option value="banco">Banco</option>
              </select>
            </label>
            <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
              <p className="font-medium text-ink">Figura legal</p>
              <p className="mt-1 text-muted">{labelByFigura[figuraLegal]}</p>
            </div>
            <Input
              label={tipoEntidad === "organismo" || tipoEntidad === "banco" ? "Área / rubro" : "Rubro"}
              name="rubro"
            />
          </div>
          <label className="block text-sm font-medium text-ink">
            Descripción
            <textarea
              className="mt-2 min-h-28 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              name="descripcion"
            />
          </label>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {tipoEntidad === "bien" ? (
            <Input label="Socio mayor" name="socio_mayor" required />
          ) : null}
          {tipoEntidad === "servicio" ||
          tipoEntidad === "organismo" ||
          tipoEntidad === "banco" ? (
            <Input label="Responsable" name="responsable" required />
          ) : null}
          {tipoEntidad === "organismo" || tipoEntidad === "banco" ? (
            <Input label="Cargo del responsable" name="cargo_responsable" required />
          ) : null}
          {tipoEntidad === "bien" || tipoEntidad === "servicio" ? (
            <>
              <Input label="CUIT simulado" name="cuit_simulado" />
              <Input label="Domicilio" name="domicilio" />
              <Input label="Actividad principal" name="actividad_principal" />
            </>
          ) : null}
        </section>

        {errorMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>
    </Card>
  );
}
