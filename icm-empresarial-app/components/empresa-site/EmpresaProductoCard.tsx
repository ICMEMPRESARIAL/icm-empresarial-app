import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import type { EmpresaProducto } from "@/lib/empresa-site/types";

type EmpresaProductoCardProps = {
  empresaSlug: string;
  producto: EmpresaProducto;
};

function formatMoney(value: number | null) {
  if (value === null) return "Precio a consultar";
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

export function EmpresaProductoCard({
  empresaSlug,
  producto
}: EmpresaProductoCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {producto.imagen_url ? (
        <Image
          alt={producto.nombre}
          className="h-36 w-full object-cover"
          height={240}
          src={producto.imagen_url}
          unoptimized
          width={420}
        />
      ) : (
        <div className="h-36 bg-gradient-to-br from-blue-100 via-cyan-50 to-emerald-100" />
      )}
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone={producto.tipo === "producto" ? "blue" : "green"}>
            {producto.tipo === "producto" ? "Producto" : "Servicio"}
          </Badge>
          <Badge tone="gray">{producto.modalidad}</Badge>
          {!producto.activo ? <Badge tone="red">Inactivo</Badge> : null}
        </div>
        <h2 className="mt-4 text-lg font-semibold text-ink">{producto.nombre}</h2>
        <p className="mt-1 text-sm text-muted">
          {producto.categoria ?? "Sin categoría"}
        </p>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
          {producto.descripcion ?? "Sin descripción cargada."}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">
            {formatMoney(producto.precio_simulado)}
          </p>
          <Link
            className="text-sm font-medium text-brand hover:underline"
            href={`/empresas/${empresaSlug}/contratarnos`}
          >
            Consultar
          </Link>
        </div>
      </div>
    </article>
  );
}
