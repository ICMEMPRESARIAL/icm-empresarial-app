import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type ActionButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary";
};

export function ActionButton({
  children,
  className = "",
  href,
  icon,
  variant = "primary",
  ...props
}: ActionButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-brand text-white hover:bg-[#183f73]"
      : "border border-border bg-white text-ink hover:bg-surface";

  return (
    <Link
      className={[
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition",
        variantClass,
        className
      ].join(" ")}
      href={href}
      {...props}
    >
      {icon}
      {children}
    </Link>
  );
}
