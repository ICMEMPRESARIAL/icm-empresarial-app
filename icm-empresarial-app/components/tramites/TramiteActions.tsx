import {
  approveTramiteAction,
  finalizeTramiteAction,
  rejectTramiteAction,
  requestDocumentacionAction,
  updateTramiteEstadoAction
} from "@/lib/tramites/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TramiteDetail } from "@/lib/tramites/types";

type TramiteActionsProps = {
  canManage: boolean;
  tramite: TramiteDetail;
};

function EstadoButton({
  estado,
  label,
  tramiteId
}: {
  estado: string;
  label: string;
  tramiteId: string;
}) {
  return (
    <form action={updateTramiteEstadoAction}>
      <input name="tramite_id" type="hidden" value={tramiteId} />
      <input name="estado" type="hidden" value={estado} />
      <Button type="submit" variant="secondary">
        {label}
      </Button>
    </form>
  );
}

export function TramiteActions({ canManage, tramite }: TramiteActionsProps) {
  if (!canManage) {
    return null;
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">Acciones del organismo</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <EstadoButton
          estado="recibida_por_organismo"
          label="Marcar recibida"
          tramiteId={tramite.id}
        />
        <EstadoButton
          estado="en_revision"
          label="Pasar a revisión"
          tramiteId={tramite.id}
        />
        <EstadoButton
          estado="observada"
          label="Observar"
          tramiteId={tramite.id}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <form action={requestDocumentacionAction} className="space-y-3">
          <input name="tramite_id" type="hidden" value={tramite.id} />
          <label className="block text-sm font-medium text-ink">
            Documentación requerida
            <textarea
              className="mt-2 min-h-20 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              name="descripcion"
              placeholder="Detalle de la documentación solicitada"
            />
          </label>
          <Button type="submit" variant="secondary">
            Pedir documentación
          </Button>
        </form>

        <form action={approveTramiteAction} className="space-y-3">
          <input name="tramite_id" type="hidden" value={tramite.id} />
          <label className="block text-sm font-medium text-ink">
            Observación de aprobación
            <textarea
              className="mt-2 min-h-20 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              name="descripcion"
            />
          </label>
          <Button type="submit">Aprobar</Button>
        </form>

        <form action={rejectTramiteAction} className="space-y-3">
          <input name="tramite_id" type="hidden" value={tramite.id} />
          <label className="block text-sm font-medium text-ink">
            Motivo de rechazo
            <textarea
              className="mt-2 min-h-20 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              name="descripcion"
            />
          </label>
          <Button type="submit" variant="secondary">
            Rechazar
          </Button>
        </form>

        <form action={finalizeTramiteAction} className="space-y-3">
          <input name="tramite_id" type="hidden" value={tramite.id} />
          <label className="block text-sm font-medium text-ink">
            Cierre
            <textarea
              className="mt-2 min-h-20 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              name="descripcion"
            />
          </label>
          <Button type="submit">Finalizar</Button>
        </form>
      </div>
    </Card>
  );
}
