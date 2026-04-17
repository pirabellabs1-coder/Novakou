import ProduitPageClient from "./ProduitPageClient";

export default async function ProduitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProduitPageClient slug={slug} />;
}
