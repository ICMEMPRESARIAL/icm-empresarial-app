import { createClient } from "@/lib/supabase/server";

type AuditDetail = Record<
  string,
  string | number | boolean | null | string[] | number[]
>;

type LogActionInput = {
  actorId: string;
  accion: string;
  objeto: string;
  detalle?: AuditDetail;
};

export async function logAction({
  accion,
  actorId,
  detalle = {},
  objeto
}: LogActionInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_logs").insert({
    accion,
    actor_id: actorId,
    detalle,
    objeto
  });

  if (error) {
    throw new Error(`No se pudo registrar auditoria: ${error.message}`);
  }
}
