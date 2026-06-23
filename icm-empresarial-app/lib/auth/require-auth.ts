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

  return {
    profile: session.profile,
    user: session.user
  };
}
