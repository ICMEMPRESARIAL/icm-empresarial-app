import type { HTMLAttributes, ReactNode } from "react";

type SectionCardProps = HTMLAttributes<HTMLDivElement> & {
  actions?: ReactNode;
  description?: string;
  title?: string;
};

export function SectionCard({
  actions,
  children,
  className = "",
  description,
  title,
  ...props
}: SectionCardProps) {
  return (
    <section
      className={[
        "rounded-xl border border-border bg-white p-5 shadow-sm",
        className
      ].join(" ")}
      {...props}
    >
      {title || description || actions ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
