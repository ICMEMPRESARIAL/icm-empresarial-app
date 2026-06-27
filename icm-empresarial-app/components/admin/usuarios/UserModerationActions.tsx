import {
  deactivateUserAction,
  reactivateUserAction,
  suspendUserAction
} from "@/lib/admin/usuarios/actions";
import { Button } from "@/components/ui/Button";
import type { AdminUserItem } from "@/lib/admin/usuarios/queries";

type UserModerationActionsProps = {
  user: AdminUserItem;
};

export function UserModerationActions({ user }: UserModerationActionsProps) {
  return (
    <div className="space-y-3">
      {user.estado === "activo" ? (
        <form action={suspendUserAction} className="flex flex-col gap-2">
          <input name="profile_id" type="hidden" value={user.id} />
          <input
            className="h-9 rounded-md border border-border bg-white px-3 text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            name="motivo"
            placeholder="Motivo de suspensión"
            required
          />
          <Button type="submit" variant="secondary">
            Suspender
          </Button>
        </form>
      ) : null}

      {user.estado === "suspendido" ? (
        <form action={reactivateUserAction}>
          <input name="profile_id" type="hidden" value={user.id} />
          <Button type="submit">Rehabilitar</Button>
        </form>
      ) : null}

      {user.estado !== "dado_de_baja" ? (
        <form action={deactivateUserAction}>
          <input name="profile_id" type="hidden" value={user.id} />
          <Button type="submit" variant="secondary">
            Dar de baja
          </Button>
        </form>
      ) : null}
    </div>
  );
}
