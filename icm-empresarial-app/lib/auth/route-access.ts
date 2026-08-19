import { redirect } from "next/navigation";
import type { ProfileWithEmpresa } from "@/lib/auth/get-user-profile";

export function homePathForProfile(profile: ProfileWithEmpresa) {
  return profile.rol === "profesora_admin" ? "/admin" : "/buzon";
}

export function canAccessOperationalRoutes(profile: ProfileWithEmpresa) {
  return profile.rol === "profesora_admin";
}

export function redirectEmpresaFromOperationalRoute(
  profile: ProfileWithEmpresa,
  destination = "/buzon"
) {
  if (!canAccessOperationalRoutes(profile)) {
    redirect(destination);
  }
}
