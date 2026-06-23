import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-brand text-white hover:bg-[#183f73]"
      : "border border-border bg-white text-ink hover:bg-surface";

  return (
    <button
      className={[
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClass,
        className
      ].join(" ")}
      type={type}
      {...props}
    />
  );
}
