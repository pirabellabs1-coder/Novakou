import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveRootSlug } from "@/lib/root-slug";

import ShopStaticRoute, { generateMetadata as shopStaticMetadata } from "@/app/boutique/[slug]/[page]/page";

/**
 * Pages internes d'une boutique à la racine : `novakou.com/<boutique>/<page>`.
 *
 * Sans cette route, l'adresse courte n'aurait marché que pour la page
 * d'accueil d'une boutique : ses pages « À propos », « Contact » ou « CGV »
 * auraient renvoyé une erreur, alors que le middleware redirige déjà leurs
 * anciennes adresses vers ici.
 *
 * Seule une BOUTIQUE a des pages internes. Un produit ou une formation
 * n'en a pas : `/mon-produit/quelque-chose` doit rester introuvable plutôt
 * que d'afficher le produit sous une adresse fantaisiste, qui se retrouverait
 * indexée en double.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ rootSlug: string; page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rootSlug, page } = await params;
  if ((await resolveRootSlug(rootSlug)) !== "shop") {
    return { title: "Page introuvable", robots: { index: false, follow: false } };
  }
  return shopStaticMetadata({ params: Promise.resolve({ slug: rootSlug, page }) });
}

export default async function RootShopStaticPage({ params }: Props) {
  const { rootSlug, page } = await params;
  if ((await resolveRootSlug(rootSlug)) !== "shop") notFound();
  return ShopStaticRoute({ params: Promise.resolve({ slug: rootSlug, page }) });
}
