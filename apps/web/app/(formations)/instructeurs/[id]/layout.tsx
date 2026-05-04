import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const profile = await prisma.instructeurProfile.findUnique({
    where: { id },
    select: {
      storeName: true,
      storeDescription: true,
      user: { select: { name: true, image: true } },
    },
  }).catch(() => null);

  if (!profile) {
    return { title: "Instructeur introuvable" };
  }

  const name = profile.storeName || profile.user?.name || "Instructeur";
  const title = `${name} — Formateur sur Novakou`;
  const description = profile.storeDescription
    ? profile.storeDescription.slice(0, 160)
    : `Découvrez les formations et produits de ${name} sur Novakou.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      ...(profile.user?.image ? { images: [{ url: profile.user.image }] } : {}),
    },
  };
}

export default function InstructeurLayout({ children }: Props) {
  return children;
}
