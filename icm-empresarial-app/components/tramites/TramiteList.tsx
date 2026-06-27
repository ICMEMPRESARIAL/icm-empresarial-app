import { TramiteCard } from "@/components/tramites/TramiteCard";
import { Card } from "@/components/ui/Card";
import type { TramiteListItem } from "@/lib/tramites/types";

type TramiteListProps = {
  baseHref?: "/admin/tramites" | "/tramites";
  emptyText?: string;
  tramites: TramiteListItem[];
};

export function TramiteList({
  baseHref = "/tramites",
  emptyText = "No hay trámites para mostrar.",
  tramites
}: TramiteListProps) {
  if (tramites.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">{emptyText}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tramites.map((tramite) => (
        <TramiteCard baseHref={baseHref} key={tramite.id} tramite={tramite} />
      ))}
    </div>
  );
}
