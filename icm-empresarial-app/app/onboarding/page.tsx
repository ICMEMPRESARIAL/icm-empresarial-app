import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { Card } from "@/components/ui/Card";
import { getUserProfile } from "@/lib/auth/get-user-profile";
import { createClient } from "@/lib/supabase/server";

type EmpresaOnboardingRow = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  tipo: "servicio" | "bien" | "organismo";
  subtipo_entidad: string | null;
  contacto_email: string | null;
  contacto_telefono: string | null;
  responsable: string | null;
  socio_responsable: string | null;
  curso_anio: string | null;
  curso_division: string | null;
  integrantes: Array<{ nombre: string; email?: string; rol?: string }>;
  logo_url: string | null;
  onboarding_completo: boolean;
};

export default async function OnboardingPage() {
  const session = await getUserProfile();

  if (!session.user || !session.profile) {
    redirect("/login");
  }

  if (session.profile.rol === "profesora_admin") {
    redirect("/bienvenida");
  }

  if (!session.profile.empresa_id) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: empresa, error } = await supabase
    .from("empresas")
    .select(
      "id,nombre,nombre_comercial,tipo,subtipo_entidad,contacto_email,contacto_telefono,responsable,socio_responsable,curso_anio,curso_division,integrantes,logo_url,onboarding_completo"
    )
    .eq("id", session.profile.empresa_id)
    .maybeSingle<EmpresaOnboardingRow>();

  if (error || !empresa) {
    throw new Error("No se pudo cargar la entidad asociada a tu cuenta.");
  }

  if (empresa.onboarding_completo) {
    redirect("/bienvenida");
  }

  const integrantes = (empresa.integrantes ?? []).map((item) => ({
    nombre: item.nombre ?? "",
    email: item.email ?? "",
    rol: item.rol ?? ""
  }));

  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        <Card className="p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            ICM Empresarial
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">
            Terminá de configurar tu entidad
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Estos datos identifican a tu empresa u organismo dentro de la plataforma y del buzón. Completalos antes de comenzar a operar.
          </p>
        </Card>

        <OnboardingForm
          empresaId={empresa.id}
          empresaNombre={empresa.nombre_comercial ?? empresa.nombre}
          initialCursoAnio={empresa.curso_anio}
          initialCursoDivision={empresa.curso_division}
          initialEmail={empresa.contacto_email}
          initialIntegrantes={integrantes}
          initialLogoUrl={empresa.logo_url}
          initialResponsable={empresa.responsable}
          initialSocioResponsable={empresa.socio_responsable}
          initialTelefono={empresa.contacto_telefono}
          subtipoEntidad={empresa.subtipo_entidad}
          tipo={empresa.tipo}
        />
      </section>
    </main>
  );
}
