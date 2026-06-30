import { redirect } from "next/navigation";

export default function FacturasEmitidasPage() {
  redirect("/facturas?filtro=emitidas");
}
