"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type CursoAnio = "4" | "5" | "6";
type CursoDivision = "A" | "B" | "C";
type TipoEntidad = "bien" | "servicio" | "organismo" | "banco";
type FiguraLegal = "monotributo" | "sas" | "organismo_publico" | "banco";

type Integrante = {
  email: string;
  nombre: string;
  rol: string;
};

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

const emptyIntegrante: Integrante = {
  email: "",
  nombre: "",
  rol: ""
};

export function RegistroForm() {
  const router = useRouter();
  const [cursoAnio, setCursoAnio] = useState<CursoAnio>("4");
  const [cursoDivision, setCursoDivision] = useState<CursoDivision>("A");
  const [tipoEntidad, setTipoEntidad] = useState<TipoEntidad>("bien");
  const [integrantes, setIntegrantes] = useState<Integrante[]>([
    emptyIntegrante
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const figuraLegal = useMemo(() => figuraByTipo[tipoEntidad], [tipoEntidad]);

  function updateIntegrante(
    index: number,
    field: keyof Integrante,
    value: string
  ) {
    setIntegrantes((current) =>
      current.map((integrante, currentIndex) =>
        currentIndex === index ? { ...integrante, [field]: value } : integrante
      )
    );
  }

  function addIntegrante() {
    setIntegrantes((current) => [...current, { ...emptyIntegrante }]);
  }

  function removeIntegrante(index: number) {
    setIntegrantes((current) =>
      current.length === 1
        ? current
        : current.filter((_, currentIndex) => currentIndex !== index)
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");
    const nombreAlumno = String(formData.get("nombre_alumno") ?? "").trim();
    const nombreEntidad = String(formData.get("nombre_entidad") ?? "").trim();
    const socioResponsable = String(
      formData.get("socio_responsable") ?? ""
    ).trim();
    const personaJuridica = String(
      formData.get("persona_juridica") ?? ""
    ).trim();
    const integrantesLimpios = integrantes
      .map((integrante) => ({
        email: integrante.email.trim(),
        nombre: integrante.nombre.trim(),
        rol: integrante.rol.trim()
      }))
      .filter((integrante) => integrante.nombre.length > 0);

    if (!email || !password || !nombreAlumno || !nombreEntidad) {
      setErrorMessage("Completá los datos obligatorios.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      setIsSubmitting(false);
      return;
    }

    if (integrantesLimpios.length < 1) {
      setErrorMessage("Agregá al menos un integrante del equipo.");
      setIsSubmitting(false);
      return;
    }

    if (cursoAnio === "4" && !socioResponsable) {
      setErrorMessage("Para 4° año indicá el socio responsable.");
      setIsSubmitting(false);
      return;
    }

    if (cursoAnio === "5" && !personaJuridica) {
      setErrorMessage("Para 5° año indicá la persona jurídica.");
      setIsSubmitting(false);
      return;
    }

    const curso = `${cursoAnio}${cursoDivision}`;
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      options: {
        data: {
          actividad_principal: String(
            formData.get("actividad_principal") ?? ""
          ).trim(),
          cargo_responsable: "",
          cuit_simulado: String(formData.get("cuit_simulado") ?? "").trim(),
          curso,
          curso_anio: cursoAnio,
          curso_division: cursoDivision,
          descripcion: String(formData.get("descripcion") ?? "").trim(),
          domicilio: String(formData.get("domicilio") ?? "").trim(),
          email,
          figura_legal: figuraLegal,
          integrantes: integrantesLimpios,
          nombre_alumno: nombreAlumno,
          nombre_entidad: nombreEntidad,
          persona_juridica: personaJuridica,
          responsable: "",
          rubro: String(formData.get("rubro") ?? "").trim(),
          socio_mayor: socioResponsable,
          socio_responsable: socioResponsable,
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
            <p className="text-sm font-semibold text-brand">Datos de acceso</p>
            <p className="mt-1 text-sm text-muted">
              El alumno que crea la cuenta será el responsable de acceso del
              equipo.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Gmail del responsable" name="email" required type="email" />
            <Input label="Contraseña" name="password" required type="password" />
            <Input
              label="Confirmar contraseña"
              name="confirm_password"
              required
              type="password"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-brand">
              Alumno responsable
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre y apellido" name="nombre_alumno" required />
            <Input label="Teléfono" name="telefono" />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-brand">Curso</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-ink">
              Año
              <select
                className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                name="curso_anio"
                onChange={(event) =>
                  setCursoAnio(event.target.value as CursoAnio)
                }
                required
                value={cursoAnio}
              >
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-ink">
              División
              <select
                className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                name="curso_division"
                onChange={(event) =>
                  setCursoDivision(event.target.value as CursoDivision)
                }
                required
                value={cursoDivision}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand">
                Integrantes del equipo
              </p>
              <p className="mt-1 text-sm text-muted">
                Agregá todos los integrantes que la profesora debe revisar.
              </p>
            </div>
            <Button onClick={addIntegrante} type="button" variant="secondary">
              Agregar integrante
            </Button>
          </div>

          <div className="space-y-3">
            {integrantes.map((integrante, index) => (
              <div
                className="grid gap-3 rounded-lg border border-border bg-surface p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                key={index}
              >
                <label className="block text-sm font-medium text-ink">
                  Nombre y apellido
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                    onChange={(event) =>
                      updateIntegrante(index, "nombre", event.target.value)
                    }
                    required={index === 0}
                    value={integrante.nombre}
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Email
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                    onChange={(event) =>
                      updateIntegrante(index, "email", event.target.value)
                    }
                    type="email"
                    value={integrante.email}
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Rol
                  <input
                    className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                    onChange={(event) =>
                      updateIntegrante(index, "rol", event.target.value)
                    }
                    value={integrante.rol}
                  />
                </label>
                <div className="flex items-end">
                  <Button
                    disabled={integrantes.length === 1}
                    onClick={() => removeIntegrante(index)}
                    type="button"
                    variant="secondary"
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-brand">
              Datos de empresa u organismo
            </p>
            <p className="mt-1 text-sm text-muted">
              La profesora revisará estos datos antes de habilitar la cuenta.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre de empresa u organismo"
              name="nombre_entidad"
              required
            />
            <label className="block text-sm font-medium text-ink">
              Tipo
              <select
                className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                name="tipo_entidad"
                onChange={(event) =>
                  setTipoEntidad(event.target.value as TipoEntidad)
                }
                required
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
            <Input label="Rubro / área" name="rubro" />
            <Input label="Actividad principal" name="actividad_principal" />
            <Input label="Domicilio" name="domicilio" />
            <Input label="CUIT simulado" name="cuit_simulado" />
          </div>
          <label className="block text-sm font-medium text-ink">
            Descripción
            <textarea
              className="mt-2 min-h-28 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              name="descripcion"
            />
          </label>
        </section>

        {cursoAnio === "4" ? (
          <section className="space-y-3">
            <Input
              label="Socio responsable"
              name="socio_responsable"
              required
            />
            <p className="text-sm text-muted">
              Para 4° año, indicá quién será el socio responsable del equipo.
            </p>
          </section>
        ) : null}

        {cursoAnio === "5" ? (
          <section className="space-y-3">
            <Input
              label="Persona jurídica"
              name="persona_juridica"
              required
            />
            <p className="text-sm text-muted">
              Para 5° año, indicá la persona jurídica asignada o creada para la
              simulación.
            </p>
          </section>
        ) : null}

        {errorMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta pendiente"}
        </Button>
      </form>
    </Card>
  );
}
