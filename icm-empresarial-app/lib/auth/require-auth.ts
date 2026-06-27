import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth/get-user-profile";

export async function requireAuth() {
  const session = await getUserProfile();

  if (!session.user) {
    redirect("/login");
  }

  if (!session.profile) {
    throw new Error(
      "El usuario autenticado no tiene un perfil asignado en profiles."
    );
  }

  if (session.profile.estado === "dado_de_baja") {
    redirect("/login?error=dado_de_baja");
  }

  if (session.profile.estado === "pendiente") {
    redirect("/pendiente-aprobacion");
  }

  return {
    profile: session.profile,
    user: session.user
  };
}
