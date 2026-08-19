import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth/get-user-profile";
import { homePathForProfile } from "@/lib/auth/route-access";

export default async function HomePage() {
  const session = await getUserProfile();

  if (!session.user) {
    redirect("/login");
  }

  if (session.profile?.estado === "pendiente") {
    redirect("/pendiente-aprobacion");
  }

  if (session.profile?.estado === "dado_de_baja") {
    redirect("/login");
  }

  if (session.profile) {
    redirect(homePathForProfile(session.profile));
  }

  redirect("/login");
}
