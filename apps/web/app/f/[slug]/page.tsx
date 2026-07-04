import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import FunnelLandingClient from "./FunnelLandingClient";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

// SEO / partage social par tunnel : réglable par le vendeur (Réglages → SEO),
// sinon retombe sur le nom du tunnel.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const funnel = await prisma.salesFunnel.findUnique({
      where: { slug },
      select: { name: true, description: true, theme: true, isActive: true },
    });
    if (!funnel) return { title: "Page introuvable — Novakou" };
    const seo = ((funnel.theme as Record<string, unknown> | null)?.seo ?? {}) as {
      title?: string; description?: string; image?: string;
    };
    const title = seo.title?.trim() || funnel.name;
    const description = seo.description?.trim() || funnel.description || `Découvrez ${funnel.name}`;
    return {
      title,
      description,
      robots: funnel.isActive ? undefined : { index: false },
      openGraph: {
        title,
        description,
        type: "website",
        ...(seo.image ? { images: [{ url: seo.image }] } : {}),
      },
      twitter: {
        card: seo.image ? "summary_large_image" : "summary",
        title,
        description,
        ...(seo.image ? { images: [seo.image] } : {}),
      },
    };
  } catch {
    return { title: "Novakou" };
  }
}

export default async function FunnelPage({ params }: PageProps) {
  const { slug } = await params;
  return <FunnelLandingClient slug={slug} />;
}
