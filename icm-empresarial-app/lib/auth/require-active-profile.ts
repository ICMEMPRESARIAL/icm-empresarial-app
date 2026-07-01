import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth/get-user-profile";
import { logAction } from "@/lib/audit/log-action";

export async function assertActiveUserCanOperate(
  operation = "operar",
  auditAction = "intento_operacion_usuario_suspendido"
) {
  const session = await getUserProfile();

  if (!session.user) {
    redirect("/login");
  }

  if (!session.profile) {
    throw new Error(
      "El usuario autenticado no tiene un perfil asignado en profiles."
    );
  }

  const { profile, user } = session;

  if (profile.estado === "activo") {
    return { profile, user };
  }

  if (profile.estado === "pendiente") {
    throw new Error("Tu cuenta todavía está pendiente de aprobación.");
  }

  if (profile.estado === "suspendido") {
    try {
      await logAction({
        accion: auditAction,
        actorId: user.id,
        detalle: {
          operation,
          profile_id: profile.id,
          suspendido_hasta: profile.suspendido_hasta,
          suspendido_motivo: profile.suspendido_motivo
        },
        objeto: "profile"
      });
    } catch {
      // La auditoría no debe ocultar el motivo real del bloqueo operativo.
    }

    const until = profile.suspendido_hasta
      ? new Intl.DateTimeFormat("es-AR", {
          dateStyle: "medium",
          timeStyle: "short"
        }).format(new Date(profile.suspendido_hasta))
      : null;
    const suffix = until
      ? ` hasta ${until}`
      : " por tiempo indefinido";

    throw new Error(
      `Tu cuenta está suspendida${suffix}. No podés ${operation}. Motivo: ${
        profile.suspendido_motivo ?? "sin motivo informado"
      }`
    );
  }

  throw new Error("Tu cuenta fue dada de baja y no puede operar.");
}
