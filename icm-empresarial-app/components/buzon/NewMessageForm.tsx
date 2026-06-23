import { createCorrespondenciaAction } from "@/lib/buzon/actions";
import { correspondenciaTipos } from "@/lib/buzon/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Empresa } from "@/lib/empresas/types";

type NewMessageFormProps = {
  destinatarios: Empresa[];
};

const labelByTipo = {
  consulta: "Consulta",
  factura_simulada: "Factura simulada",
  notificacion: "Notificación",
  oficio: "Oficio",
  pedido: "Pedido",
  reclamo: "Reclamo"
} as const;

export function NewMessageForm({ destinatarios }: NewMessageFormProps) {
  return (
    <Card>
      <form action={createCorrespondenciaAction} className="space-y-5">
        <label className="block text-sm font-medium text-ink">
          Destinatario
          <select
            className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            name="destinatario_empresa_id"
            required
          >
            <option value="">Seleccionar destinatario</option>
            {destinatarios.map((destinatario) => (
              <option key={destinatario.id} value={destinatario.id}>
                {destinatario.nombre} · {destinatario.tipo}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-ink">
          Tipo
          <select
            className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            name="tipo"
            required
          >
            <option value="">Seleccionar tipo</option>
            {correspondenciaTipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {labelByTipo[tipo]}
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
          Contenido
          <textarea
            className="mt-2 min-h-40 w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            minLength={5}
            name="contenido"
            required
          />
        </label>

        <div className="flex justify-end">
          <Button type="submit">Enviar mensaje</Button>
        </div>
      </form>
    </Card>
  );
}
