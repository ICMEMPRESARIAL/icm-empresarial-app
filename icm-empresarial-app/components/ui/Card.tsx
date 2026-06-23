import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-lg border border-border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className
      ].join(" ")}
      {...props}
    />
  );
}
