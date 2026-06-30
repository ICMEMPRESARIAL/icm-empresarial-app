import { Avatar } from "@/components/ui/Avatar";
import type { Empresa } from "@/lib/empresas/types";

type EmpresaAvatarProps = {
  className?: string;
  empresa: Pick<Empresa, "color_marca" | "logo" | "logo_url" | "nombre">;
};

export function EmpresaAvatar({ className, empresa }: EmpresaAvatarProps) {
  return (
    <Avatar
      alt={`Logo de ${empresa.nombre}`}
      className={className}
      color={empresa.color_marca}
      name={empresa.nombre}
      src={empresa.logo_url ?? empresa.logo}
    />
  );
}
