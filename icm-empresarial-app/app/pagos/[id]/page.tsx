import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PagoDetailPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/pagos?seleccion=${id}`);
}
