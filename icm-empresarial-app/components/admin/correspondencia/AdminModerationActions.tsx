import {
  hideCorrespondenciaAction,
  restoreCorrespondenciaAction
} from "@/lib/admin/correspondencia/actions";
import { Button } from "@/components/ui/Button";

type AdminModerationActionsProps = {
  correspondenciaId: string;
  oculto: boolean;
};

export function AdminModerationActions({
  correspondenciaId,
  oculto
}: AdminModerationActionsProps) {
  return oculto ? (
    <form action={restoreCorrespondenciaAction}>
      <input name="correspondencia_id" type="hidden" value={correspondenciaId} />
      <Button type="submit" variant="secondary">
        Confirmar restaurar
      </Button>
    </form>
  ) : (
    <form action={hideCorrespondenciaAction}>
      <input name="correspondencia_id" type="hidden" value={correspondenciaId} />
      <Button type="submit" variant="secondary">
        Confirmar ocultar
      </Button>
    </form>
  );
}
