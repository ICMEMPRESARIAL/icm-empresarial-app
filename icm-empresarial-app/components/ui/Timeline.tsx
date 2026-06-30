import type { ReactNode } from "react";

type TimelineItem = {
  content?: ReactNode;
  description?: string | null;
  title: string;
  timestamp?: string | null;
};

type TimelineProps = {
  items: TimelineItem[];
};

export function Timeline({ items }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white p-6 text-sm text-muted">
        No hay actividad registrada.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li className="flex gap-3" key={`${item.title}-${index}`}>
          <div className="flex flex-col items-center">
            <span className="mt-1 h-3 w-3 rounded-full bg-brand" />
            {index < items.length - 1 ? (
              <span className="mt-2 h-full w-px bg-border" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              {item.timestamp ? (
                <time className="text-xs text-muted">{item.timestamp}</time>
              ) : null}
            </div>
            {item.description ? (
              <p className="mt-1 text-sm text-muted">{item.description}</p>
            ) : null}
            {item.content ? <div className="mt-2">{item.content}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
