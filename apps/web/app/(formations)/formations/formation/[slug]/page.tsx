import FormationPageClient from "./FormationPageClient";

export default async function FormationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <FormationPageClient slug={slug} />;
}
