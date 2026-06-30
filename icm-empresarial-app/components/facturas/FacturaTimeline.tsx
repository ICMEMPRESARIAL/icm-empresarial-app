import type { FacturaEvento } from "@/lib/facturas/types";

export function FacturaTimeline({ eventos }: { eventos: FacturaEvento[] }) {
  if (eventos.length === 0) {
    return <p className="text-sm text-muted">Sin eventos registrados.</p>;
  }

  return (
    <ol className="space-y-4">
      {eventos.map((evento) => (
        <li className="relative pl-6" key={evento.id}>
          <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-brand" />
          <p className="text-sm font-semibold text-ink">{evento.titulo}</p>
          <p className="mt-1 text-xs text-muted">
            {new Date(evento.created_at).toLocaleString("es-AR")}
            {evento.actor_empresa
              ? ` · ${evento.actor_empresa.nombre_comercial ?? evento.actor_empresa.nombre}`
              : ""}
          </p>
          {evento.descripcion ? (
            <p className="mt-2 text-sm text-muted">{evento.descripcion}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
