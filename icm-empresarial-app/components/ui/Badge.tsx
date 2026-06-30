import type { HTMLAttributes } from "react";

type BadgeTone = "blue" | "green" | "amber" | "orange" | "red" | "gray" | "violet";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClass: Record<BadgeTone, string> = {
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-slate-100 text-slate-700",
  green: "bg-emerald-100 text-emerald-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  violet: "bg-violet-100 text-violet-800"
};

export function Badge({
  className = "",
  tone = "gray",
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        toneClass[tone],
        className
      ].join(" ")}
      {...props}
    />
  );
}
