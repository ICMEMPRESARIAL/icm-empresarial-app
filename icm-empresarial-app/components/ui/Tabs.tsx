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
    <nav className="flex gap-2 overflow-x-auto rounded-lg border border-border bg-white p-1">
      {items.map((item) => (
        <Link
          className={[
            "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition",
            item.active
              ? "bg-brand text-white"
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
