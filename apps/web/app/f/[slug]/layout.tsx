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
      // Anonymat : on ne charge PAS l'identite perso du vendeur.
    },
  }).catch(() => null);

  if (!funnel) {
    return { title: "Page introuvable" };
  }

  // Anonymat : la marque affichee est le nom du tunnel, jamais le nom perso.
  const title = `${funnel.name} — Novakou`;
  const description = funnel.description
    ? funnel.description.replace(/<[^>]+>/g, " ").trim().slice(0, 160)
    : `Découvrez ${funnel.name} sur Novakou.`;

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
