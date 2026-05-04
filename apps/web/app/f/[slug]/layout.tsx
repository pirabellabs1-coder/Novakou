import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const funnel = await prisma.salesFunnel.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      instructeur: {
        select: { storeName: true, user: { select: { name: true } } },
      },
    },
  }).catch(() => null);

  if (!funnel) {
    return { title: "Page introuvable" };
  }

  const vendorName = funnel.instructeur?.storeName || funnel.instructeur?.user?.name || "Novakou";
  const title = `${funnel.name} — ${vendorName}`;
  const description = funnel.description
    ? funnel.description.replace(/<[^>]+>/g, " ").trim().slice(0, 160)
    : `Découvrez ${funnel.name} par ${vendorName} sur Novakou.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default function FunnelLayout({ children }: Props) {
  return children;
}
