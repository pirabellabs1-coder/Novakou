import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * La page profil « instructeur » n'existe plus : l'identité d'un vendeur, c'est
 * sa BOUTIQUE. On redirige donc tout ancien lien /instructeurs/[userId] vers la
 * boutique primaire du vendeur (ou vers /explorer s'il n'en a pas).
 */
interface Props {
  params: Promise<{ id: string }>;
}

export default async function InstructeurRedirect({ params }: Props) {
  const { id } = await params;
  let slug: string | null = null;
  try {
    // id = userId (les liens passaient instructeur.userId).
    const inst = await prisma.instructeurProfile.findFirst({
      where: { userId: id },
      select: {
        shops: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          take: 1,
          select: { slug: true },
        },
      },
    });
    slug = inst?.shops?.[0]?.slug ?? null;
  } catch {
    /* redirection de secours ci-dessous */
  }
  // redirect() DOIT être hors du try/catch (il lève une exception interne).
  redirect(slug ? `/boutique/${slug}` : "/explorer");
}
