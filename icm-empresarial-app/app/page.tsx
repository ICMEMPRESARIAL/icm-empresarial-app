import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth/get-user-profile";

export default async function HomePage() {
  const session = await getUserProfile();

  if (!session.user) {
    redirect("/login");
  }

  if (session.profile?.rol === "profesora_admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
