import { Avatar } from "@/components/ui/Avatar";
import type { Empresa } from "@/lib/empresas/types";

type EmpresaAvatarProps = {
  className?: string;
  empresa: Pick<
    Empresa,
    "color_marca" | "logo" | "logo_url" | "nombre" | "nombre_comercial"
  >;
};

export function EmpresaAvatar({ className, empresa }: EmpresaAvatarProps) {
  const name = empresa.nombre_comercial ?? empresa.nombre;

  return (
    <Avatar
      alt={`Logo de ${name}`}
      className={className}
      color={empresa.color_marca}
      name={name}
      src={empresa.logo_url ?? empresa.logo}
    />
  );
}
