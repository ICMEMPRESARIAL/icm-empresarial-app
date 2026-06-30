import Image from "next/image";

type AvatarProps = {
  alt: string;
  className?: string;
  color?: string | null;
  name: string;
  src?: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({
  alt,
  className = "",
  color,
  name,
  src
}: AvatarProps) {
  if (src) {
    return (
      <Image
        alt={alt}
        className={[
          "h-11 w-11 rounded-xl border border-white/70 object-cover shadow-sm",
          className
        ].join(" ")}
        height={88}
        unoptimized
        src={src}
        width={88}
      />
    );
  }

  return (
    <div
      className={[
        "flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm",
        className
      ].join(" ")}
      style={{ backgroundColor: color ?? "#1f4f8f" }}
    >
      {initials(name) || "ICM"}
    </div>
  );
}
