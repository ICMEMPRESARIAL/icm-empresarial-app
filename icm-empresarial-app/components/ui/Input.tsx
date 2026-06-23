import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ className = "", id, label, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block text-sm font-medium text-ink" htmlFor={inputId}>
      {label}
      <input
        id={inputId}
        className={[
          "mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/15",
          className
        ].join(" ")}
        {...props}
      />
    </label>
  );
}
