import { createTramiteAction } from "@/lib/tramites/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TipoTramite } from "@/lib/tramites/types";

type NuevoTramiteFormProps = {
  tipos: TipoTramite[];
};

export function NuevoTramiteForm({ tipos }: NuevoTramiteFormProps) {
  return (
    <Card>
      <form action={createTramiteAction} className="space-y-5">
        <label className="block text-sm font-medium text-ink">
          Trámite
          <select
            className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            name="tipo_tramite_id"
            required
          >
            <option value="">Seleccionar trámite</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.organismo?.nombre ?? tipo.organismo_slug} · {tipo.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-ink">
          Asunto
          <input
            className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            minLength={3}
            name="asunto"
            required
            type="text"
          />
        </label>

        <label className="block text-sm font-medium text-ink">
          Descripción del trámite
          <textarea
            className="mt-2 min-h-36 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            minLength={8}
            name="descripcion"
            required
          />
        </label>

        <div className="flex justify-end">
          <Button type="submit">Iniciar trámite</Button>
        </div>
      </form>
    </Card>
  );
}
