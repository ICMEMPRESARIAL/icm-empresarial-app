import Link from "next/link";

type TabItem = {
  href: string;
  label: string;
  active?: boolean;
};

type TabsProps = {
  items: TabItem[];
};

export function Tabs({ items }: TabsProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-white p-1.5 shadow-sm">
      {items.map((item) => (
        <Link
          className={[
            "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition",
            item.active
              ? "bg-brand text-white shadow-sm"
              : "text-muted hover:bg-surface hover:text-ink"
          ].join(" ")}
          href={item.href}
          key={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
