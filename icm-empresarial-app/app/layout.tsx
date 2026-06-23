import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICM Empresarial",
  description: "Plataforma educativa empresarial de ICM Empresarial"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
