import { redirectEmpresaFromOperationalRoute } from "@/lib/auth/route-access";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function TramitesLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAuth();
  redirectEmpresaFromOperationalRoute(profile);

  return children;
}
