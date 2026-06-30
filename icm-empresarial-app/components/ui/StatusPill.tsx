import { Badge } from "@/components/ui/Badge";

type StatusPillProps = {
  label: string;
  status:
    | "active"
    | "pending"
    | "suspended"
    | "inactive"
    | "info"
    | "warning"
    | "success"
    | "danger";
};

const toneByStatus = {
  active: "green",
  danger: "red",
  inactive: "gray",
  info: "blue",
  pending: "amber",
  success: "green",
  suspended: "orange",
  warning: "orange"
} as const;

export function StatusPill({ label, status }: StatusPillProps) {
  return <Badge tone={toneByStatus[status]}>{label}</Badge>;
}
