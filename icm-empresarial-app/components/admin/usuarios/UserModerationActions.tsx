import {
  deactivateUserAction,
  reactivateUserAction,
  suspendUserAction,
  updateConductaUsuarioAction
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
          <textarea
            className="min-h-16 rounded-md border border-border bg-white px-3 py-2 text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            name="detalle"
            placeholder="Detalle opcional"
          />
          <select
            className="h-9 rounded-md border border-border bg-white px-3 text-xs text-ink"
            name="duracion"
          >
            <option value="1_dia">1 día</option>
            <option value="3_dias">3 días</option>
            <option value="7_dias">7 días</option>
            <option value="personalizada">Fecha personalizada</option>
            <option value="indefinida">Indefinida</option>
          </select>
          <input
            className="h-9 rounded-md border border-border bg-white px-3 text-xs text-ink"
            name="suspendido_hasta"
            type="datetime-local"
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

      <form action={updateConductaUsuarioAction} className="flex flex-col gap-2">
        <input name="profile_id" type="hidden" value={user.id} />
        <select
          className="h-9 rounded-md border border-border bg-white px-3 text-xs text-ink"
          defaultValue={user.conducta_estado}
          name="conducta"
        >
          <option value="excelente">Excelente</option>
          <option value="observado">Observado</option>
          <option value="suspendido_previamente">Suspendido previamente</option>
          <option value="reincidente">Reincidente</option>
          <option value="grave">Grave</option>
        </select>
        <input
          className="h-9 rounded-md border border-border bg-white px-3 text-xs text-ink"
          defaultValue={user.conducta_observacion ?? ""}
          name="conducta_observacion"
          placeholder="Observación docente"
        />
        <Button type="submit" variant="secondary">
          Guardar conducta
        </Button>
      </form>
    </div>
  );
}
