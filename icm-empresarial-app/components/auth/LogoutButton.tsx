"use client";

import { signOutAction } from "@/lib/auth/actions";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className = "" }: LogoutButtonProps) {
  return (
    <form action={signOutAction}>
      <button
        className={[
          "inline-flex h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface",
          className
        ].join(" ")}
        type="submit"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
