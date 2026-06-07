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
      bioFr: true,
      bioEn: true,
      user: { select: { name: true, image: true } },
    },
  }).catch(() => null);

  if (!profile) {
    return { title: "Instructeur introuvable" };
  }

  const name = profile.user?.name || "Instructeur";
  const title = `${name} — Formateur sur Novakou`;
  const bio = profile.bioFr || profile.bioEn;
  const description = bio
    ? bio.slice(0, 160)
    : `Découvrez les formations et produits de ${name} sur Novakou.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  const ogImage = profile.user?.image
    ? profile.user.image
    : `${baseUrl}/api/og?type=mentor&title=${encodeURIComponent(name)}&subtitle=${encodeURIComponent("Formateur Novakou")}`;

  return {
    title,
    description,
    alternates: { canonical: `/instructeurs/${id}` },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${baseUrl}/instructeurs/${id}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function InstructeurLayout({ params, children }: Props) {
  const { id } = await params;
  // JSON-LD Person + BreadcrumbList injectés côté server pour le SEO.
  const profile = await prisma.instructeurProfile
    .findUnique({
      where: { id },
      select: {
        bioFr: true,
        bioEn: true,
        user: { select: { name: true, image: true } },
      },
    })
    .catch(() => null);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  const name = profile?.user?.name || "Instructeur";

  return (
    <>
      {profile && profile.user?.name && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: profile.user.name,
              jobTitle: "Formateur Novakou",
              description: (profile.bioFr || profile.bioEn || "").slice(0, 500),
              url: `${baseUrl}/instructeurs/${id}`,
              ...(profile.user.image ? { image: profile.user.image } : {}),
              worksFor: { "@type": "Organization", name: "Novakou", url: baseUrl },
            }),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
              { "@type": "ListItem", position: 2, name: "Instructeurs", item: `${baseUrl}/instructeurs` },
              { "@type": "ListItem", position: 3, name },
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
