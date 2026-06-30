import { redirect } from "next/navigation";

export default function FacturasRecibidasPage() {
  redirect("/facturas?filtro=recibidas");
}
