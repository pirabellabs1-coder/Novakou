import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PayerClient from "./PayerClient";

// Page de paiement d'un lien de paiement. force-dynamic : jamais mise en cache
// statique (montant/état à jour), et accès direct même si le produit est caché.
export const dynamic = "force-dynamic";

async function getLink(slug: string) {
  return prisma.digitalProduct
    .findFirst({
      where: { slug, isPaymentLink: true },
      select: {
        id: true, slug: true, title: true, description: true, price: true,
        thumbnail: true, status: true, allowCustomAmount: true,
      },
    })
    .catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const link = await getLink(slug);
  return {
    title: link ? `Payer — ${link.title} | Novakou` : "Lien de paiement | Novakou",
    robots: { index: false, follow: false },
  };
}

export default async function PayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await getLink(slug);
  if (!link) notFound();

  return (
    <PayerClient
      link={{
        id: link.id,
        slug: link.slug,
        title: link.title,
        description: link.description,
        price: link.price,
        thumbnail: link.thumbnail,
        active: link.status === "ACTIF",
        allowCustomAmount: link.allowCustomAmount,
      }}
    />
  );
}
