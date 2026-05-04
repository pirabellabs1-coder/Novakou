import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MembershipPageClient from "./MembershipPageClient";

export const revalidate = 300;

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
    select: { name: true, description: true, bannerUrl: true, imageUrl: true },
  }).catch(() => null);
  if (!plan) return { title: "Abonnement introuvable" };
  const description = plan.description?.slice(0, 160) || `Abonnez-vous sur Novakou.`;
  const image = plan.bannerUrl || plan.imageUrl || undefined;
  return {
    title: `${plan.name} · Abonnement Novakou`,
    description,
    openGraph: {
      title: plan.name,
      description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
      type: "website",
    },
  };
}

export default async function MembershipPage({ params }: Props) {
  const { id } = await params;
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
    include: {
      instructeur: { select: { id: true, user: { select: { id: true, name: true, image: true } } } },
      shop: { select: { id: true, slug: true, name: true, themeColor: true } },
    },
  });
  if (!plan || !plan.isActive) notFound();

  const [formations, products] = await Promise.all([
    plan.linkedFormationIds.length > 0
      ? prisma.formation.findMany({
          where: { id: { in: plan.linkedFormationIds }, status: "ACTIF" },
          select: { id: true, slug: true, title: true, thumbnail: true, price: true },
        })
      : Promise.resolve([]),
    plan.linkedProductIds.length > 0
      ? prisma.digitalProduct.findMany({
          where: { id: { in: plan.linkedProductIds }, status: "ACTIF" },
          select: { id: true, slug: true, title: true, banner: true, price: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <MembershipPageClient
      plan={{
        id: plan.id,
        name: plan.name,
        description: plan.description,
        imageUrl: plan.imageUrl,
        bannerUrl: plan.bannerUrl,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval as "monthly" | "yearly",
        trialDays: plan.trialDays,
        maxMembers: plan.maxMembers,
        activeCount: plan.activeCount,
        instructeur: {
          id: plan.instructeur.id,
          name: plan.instructeur.user?.name ?? "Créateur",
          image: plan.instructeur.user?.image ?? null,
        },
        shop: plan.shop,
        includedFormations: formations,
        includedProducts: products,
      }}
    />
  );
}
