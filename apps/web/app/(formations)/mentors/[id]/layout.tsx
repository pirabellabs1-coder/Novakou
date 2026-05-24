import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const mentor = await prisma.mentorProfile.findUnique({
    where: { id },
    select: {
      specialty: true,
      bio: true,
      domain: true,
      user: { select: { name: true, image: true } },
    },
  }).catch(() => null);

  if (!mentor) {
    return { title: "Mentor introuvable" };
  }

  const name = mentor.user?.name ?? "Mentor";
  const title = `${name} — ${mentor.specialty || mentor.domain || "Mentor"} | Novakou`;
  const description = mentor.bio
    ? mentor.bio.slice(0, 160)
    : `Réservez une session de mentorat avec ${name} sur Novakou.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      ...(mentor.user?.image ? { images: [{ url: mentor.user.image }] } : {}),
    },
  };
}

export default function MentorLayout({ children }: Props) {
  return children;
}
