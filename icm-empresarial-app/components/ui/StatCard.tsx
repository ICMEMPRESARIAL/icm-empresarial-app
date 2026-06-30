import type { ReactNode } from "react";

type StatCardProps = {
  icon?: ReactNode;
  label: string;
  value: string | number;
  helper?: string;
};

export function StatCard({ helper, icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        {icon ? (
          <div className="rounded-lg bg-blue-50 p-2 text-brand">{icon}</div>
        ) : null}
      </div>
      {helper ? <p className="mt-2 text-xs text-muted">{helper}</p> : null}
    </div>
  );
}
